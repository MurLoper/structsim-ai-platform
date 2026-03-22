import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutputDefs, useParamDefs } from '@/features/config/queries';
import { ordersApi, resultsApi } from '@/api';
import { queryKeys } from '@/lib/queryClient';
import { RESULTS_PAGE_SIZE, RESULTS_CHART_MAX_POINTS, PAGINATION } from '@/constants';
import type {
  ModuleDetail,
  OrderConditionRoundsResponse,
  OrderConditionSummary,
  RoundItem,
  SimTypeResult,
} from '@/api/results';
import type { WorkflowNode } from '../components/ProcessFlowView';

export interface ResultRecord {
  iteration: number;
  schemeId: number;
  metricKey: string;
  value: number;
  group: string;
}

interface RoundsGroup {
  schemeId: number;
  rounds: RoundItem[];
  orderCondition: OrderConditionSummary;
  resultSource: string;
  statistics?: OrderConditionRoundsResponse['statistics'];
}

interface ResultsOverviewStats {
  schemeCount: number;
  totalRounds: number;
  completedRounds: number;
  failedRounds: number;
  runningRounds: number;
  resultSource: string;
  runningModules: string[];
}

const buildConditionLabel = (condition: OrderConditionSummary) => {
  const fold = condition.foldTypeName || `姿态-${condition.foldTypeId ?? '-'}`;
  const sim = condition.simTypeName || `方案-${condition.simTypeId}`;
  return `${fold} / ${sim} · C${condition.conditionId}`;
};

const buildModuleProgress = (moduleDetails?: ModuleDetail[]) => {
  if (!moduleDetails?.length) return null;
  return moduleDetails.reduce<Record<string, number>>((acc, item, index) => {
    acc[item.moduleCode || `node_${index + 1}`] = Number(item.progress ?? 0);
    return acc;
  }, {});
};

const mapMockRoundToLegacyRound = (
  groupId: number,
  item: OrderConditionRoundsResponse['items'][number]
): RoundItem => ({
  id: item.id,
  simTypeResultId: groupId,
  roundIndex: item.roundIndex,
  status: item.status,
  progress: Math.round(Number(item.process ?? 0)),
  paramValues: item.params ?? null,
  outputResults: item.outputs ?? null,
  errorMsg: item.status === 3 ? 'mock 轮次执行失败' : undefined,
  runningModule: item.runningModule,
  finalResult: item.finalResult ?? null,
  moduleDetails: item.moduleDetails,
  flowNodeProgress: buildModuleProgress(item.moduleDetails),
});

const buildWorkflowNodesFromRounds = (groups: RoundsGroup[]): WorkflowNode[] => {
  const seen = new Set<string>();
  const nodes: WorkflowNode[] = [];

  groups.forEach(group => {
    group.rounds.forEach(round => {
      round.moduleDetails?.forEach(detail => {
        const nodeId = detail.moduleCode || detail.moduleName;
        if (!nodeId || seen.has(nodeId)) return;
        seen.add(nodeId);
        nodes.push({
          id: nodeId,
          moduleId: nodes.length + 1,
          name: detail.moduleName || detail.moduleCode,
        });
      });
    });
  });

  return nodes;
};

export const useResultsData = (orderId: number | null) => {
  const resolvedOrderId = orderId && Number.isFinite(orderId) ? orderId : null;

  const {
    data: outputDefs = [],
    error: outputDefsError,
    isLoading: outputDefsLoading,
    refetch: refetchOutputDefs,
  } = useOutputDefs();
  const {
    data: paramDefs = [],
    error: paramDefsError,
    isLoading: paramDefsLoading,
    refetch: refetchParamDefs,
  } = useParamDefs();

  const {
    data: orderDetail,
    error: orderError,
    isLoading: orderLoading,
    refetch: refetchOrder,
  } = useQuery({
    queryKey: resolvedOrderId
      ? queryKeys.orders.detail(resolvedOrderId)
      : ['orders', 'detail', 'none'],
    queryFn: async () => {
      if (!resolvedOrderId) return null;
      const response = await ordersApi.getOrder(resolvedOrderId);
      return response.data;
    },
    enabled: !!resolvedOrderId,
  });

  const {
    data: orderConditions = [],
    isLoading: orderConditionsLoading,
    error: orderConditionsError,
    refetch: refetchOrderConditions,
  } = useQuery({
    queryKey: ['results', 'orderConditions', resolvedOrderId],
    queryFn: async () => {
      if (!resolvedOrderId) return [] as OrderConditionSummary[];
      const response = await resultsApi.getOrderConditions(resolvedOrderId);
      return response.data || [];
    },
    enabled: !!resolvedOrderId,
    staleTime: 30 * 1000,
  });

  const displayOrderId = orderDetail?.orderNo || (resolvedOrderId ? `#${resolvedOrderId}` : '-');

  const [metric, setMetric] = useState('');
  const [selectedSchemeIds, setSelectedSchemeIds] = useState<number[]>([]);
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [minIteration, setMinIteration] = useState('');
  const [maxIteration, setMaxIteration] = useState('');

  useEffect(() => {
    if (selectedSchemeIds.length > 0) return;
    const fromConditions = orderConditions.map(item => item.id);
    const fromOrder = Array.isArray(orderDetail?.conditions)
      ? orderDetail.conditions.map((item: { id: number }) => item.id)
      : [];
    const defaults = fromConditions.length > 0 ? fromConditions : fromOrder;
    if (defaults.length > 0) {
      setSelectedSchemeIds(defaults);
    }
  }, [orderConditions, orderDetail, selectedSchemeIds.length]);

  const availableSchemes = useMemo(
    () =>
      orderConditions.map(condition => ({
        id: condition.id,
        name: buildConditionLabel(condition),
      })),
    [orderConditions]
  );

  const availableSchemeIds = useMemo(
    () => availableSchemes.map(item => item.id),
    [availableSchemes]
  );

  const schemeLabelMap = useMemo(
    () => new Map(availableSchemes.map(item => [item.id, item.name])),
    [availableSchemes]
  );

  const selectedConditions = useMemo(
    () => orderConditions.filter(condition => selectedSchemeIds.includes(condition.id)),
    [orderConditions, selectedSchemeIds]
  );

  const {
    data: schemeRoundGroups = [],
    isLoading: roundsLoading,
    error: roundsError,
    refetch: refetchRounds,
  } = useQuery({
    queryKey: ['results', 'conditionRounds', resolvedOrderId, selectedSchemeIds],
    queryFn: async () => {
      if (!resolvedOrderId || selectedConditions.length === 0) return [] as RoundsGroup[];
      const responses = await Promise.all(
        selectedConditions.map(async condition => {
          const response = await resultsApi.getOrderConditionRounds(condition.id, {
            page: PAGINATION.DEFAULT_PAGE,
            pageSize: RESULTS_PAGE_SIZE,
          });

          return {
            schemeId: condition.id,
            orderCondition: condition,
            resultSource: response.data?.resultSource || 'mock',
            statistics: response.data?.statistics,
            rounds: (response.data?.items || []).map(item =>
              mapMockRoundToLegacyRound(condition.id, item)
            ),
          } as RoundsGroup;
        })
      );
      return responses;
    },
    enabled: !!resolvedOrderId && selectedConditions.length > 0,
    staleTime: 30 * 1000,
  });

  const workflowNodes = useMemo(
    () => buildWorkflowNodesFromRounds(schemeRoundGroups),
    [schemeRoundGroups]
  );

  const metricLabelMap = useMemo(() => {
    const map = new Map<string, string>();

    schemeRoundGroups.forEach(({ rounds }) => {
      rounds.forEach(round => {
        Object.keys(round.outputResults || {}).forEach(key => {
          if (!map.has(key)) {
            map.set(key, key);
          }
        });
      });
    });

    outputDefs.forEach(def => {
      const key = String(def.id);
      if (!map.has(key)) {
        map.set(key, def.name);
      }
    });

    return map;
  }, [schemeRoundGroups, outputDefs]);

  const metricOptions = useMemo(
    () =>
      Array.from(metricLabelMap.entries()).map(([value, label]) => ({
        value,
        label,
      })),
    [metricLabelMap]
  );

  useEffect(() => {
    if (!metricOptions.length) return;
    if (!metric || !metricLabelMap.has(metric)) {
      setMetric(metricOptions[0].value);
    }
  }, [metric, metricLabelMap, metricOptions]);

  const schemeResults = useMemo<SimTypeResult[]>(
    () =>
      orderConditions.map(condition => ({
        id: condition.id,
        orderId: condition.orderId,
        simTypeId: condition.id,
        simTypeName: buildConditionLabel(condition),
        status: condition.status,
        progress: Math.round(Number(condition.process ?? 0)),
        totalRounds: Number(condition.roundTotal ?? 0),
        completedRounds: 0,
        failedRounds: 0,
        bestRoundIndex: null,
        createdAt: condition.createdAt,
        updatedAt: condition.updatedAt,
      })),
    [orderConditions]
  );

  const overviewStats = useMemo<ResultsOverviewStats>(() => {
    const runningModuleSet = new Set<string>();
    const stats = schemeRoundGroups.reduce<ResultsOverviewStats>(
      (acc, group) => {
        const summary = group.statistics;
        acc.totalRounds += Number(summary?.totalRounds ?? group.rounds.length);
        acc.completedRounds += Number(
          summary?.completedRounds ?? group.rounds.filter(round => round.status === 2).length
        );
        acc.failedRounds += Number(
          summary?.failedRounds ?? group.rounds.filter(round => round.status === 3).length
        );
        acc.runningRounds += Number(
          summary?.runningRounds ?? group.rounds.filter(round => round.status === 1).length
        );
        if (!acc.resultSource && group.resultSource) {
          acc.resultSource = group.resultSource;
        }
        if (group.orderCondition.status === 1 && group.orderCondition.runningModule) {
          runningModuleSet.add(group.orderCondition.runningModule);
        }
        return acc;
      },
      {
        schemeCount: orderConditions.length,
        totalRounds: 0,
        completedRounds: 0,
        failedRounds: 0,
        runningRounds: 0,
        resultSource: '',
        runningModules: [],
      }
    );

    return {
      ...stats,
      resultSource: stats.resultSource || 'mock',
      runningModules: Array.from(runningModuleSet),
    };
  }, [orderConditions.length, schemeRoundGroups]);

  const results = useMemo(() => {
    if (!metric || schemeRoundGroups.length === 0) return [] as ResultRecord[];

    return schemeRoundGroups.flatMap(({ schemeId, rounds, orderCondition }) =>
      rounds
        .map(round => {
          const outputs = round.outputResults || {};
          const rawValue = outputs[metric];
          if (rawValue === undefined || rawValue === null) return null;
          const value = typeof rawValue === 'number' ? rawValue : Number(rawValue);
          if (!Number.isFinite(value)) return null;
          return {
            iteration: round.roundIndex,
            schemeId,
            metricKey: metric,
            value,
            group: buildConditionLabel(orderCondition),
          } as ResultRecord;
        })
        .filter((item): item is ResultRecord => Boolean(item))
    );
  }, [metric, schemeRoundGroups]);

  const filteredResults = useMemo(() => {
    const minVal = minValue ? Number(minValue) : Number.NEGATIVE_INFINITY;
    const maxVal = maxValue ? Number(maxValue) : Number.POSITIVE_INFINITY;
    const minIter = minIteration ? Number(minIteration) : Number.NEGATIVE_INFINITY;
    const maxIter = maxIteration ? Number(maxIteration) : Number.POSITIVE_INFINITY;
    const schemeSet = new Set(selectedSchemeIds);

    return results.filter(record => {
      if (metric && record.metricKey !== metric) return false;
      if (schemeSet.size > 0 && !schemeSet.has(record.schemeId)) return false;
      if (record.value < minVal || record.value > maxVal) return false;
      if (record.iteration < minIter || record.iteration > maxIter) return false;
      return true;
    });
  }, [results, metric, selectedSchemeIds, minValue, maxValue, minIteration, maxIteration]);

  const chartResults = useMemo(() => {
    if (filteredResults.length <= RESULTS_CHART_MAX_POINTS) {
      return filteredResults;
    }
    const step = Math.ceil(filteredResults.length / RESULTS_CHART_MAX_POINTS);
    return filteredResults.filter((_, index) => index % step === 0);
  }, [filteredResults]);

  const trendData = useMemo(
    () =>
      chartResults.map(record => ({
        iteration: record.iteration,
        schemeName: schemeLabelMap.get(record.schemeId) || String(record.schemeId),
        value: record.value,
      })),
    [chartResults, schemeLabelMap]
  );

  const avgByScheme = useMemo(() => {
    const map = new Map<number, { total: number; count: number }>();
    filteredResults.forEach(record => {
      const current = map.get(record.schemeId) || { total: 0, count: 0 };
      map.set(record.schemeId, { total: current.total + record.value, count: current.count + 1 });
    });
    return Array.from(map.entries()).map(([schemeId, stats]) => ({
      schemeName: schemeLabelMap.get(schemeId) || String(schemeId),
      value: stats.count ? Math.round((stats.total / stats.count) * 100) / 100 : 0,
    }));
  }, [filteredResults, schemeLabelMap]);

  const toggleScheme = (value: number) => {
    setSelectedSchemeIds(prev =>
      prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
    );
  };

  const handleReset = () => {
    setMetric(metricOptions[0]?.value || '');
    setSelectedSchemeIds(availableSchemeIds);
    setMinValue('');
    setMaxValue('');
    setMinIteration('');
    setMaxIteration('');
  };

  const resultsError =
    outputDefsError || paramDefsError || orderError || orderConditionsError || roundsError;

  const retryResults = () => {
    void refetchOutputDefs();
    void refetchParamDefs();
    if (resolvedOrderId) {
      void refetchOrder();
      void refetchOrderConditions();
      void refetchRounds();
    }
  };

  return {
    displayOrderId,
    metric,
    setMetric,
    metricOptions,
    metricLabelMap,
    schemeLabelMap,
    selectedSchemeIds,
    toggleScheme,
    minValue,
    setMinValue,
    maxValue,
    setMaxValue,
    minIteration,
    setMinIteration,
    maxIteration,
    setMaxIteration,
    availableSchemes,
    availableSchemeIds,
    filteredResults,
    trendData,
    avgByScheme,
    schemeResults,
    schemeRoundGroups,
    overviewStats,
    paramDefs,
    outputDefs,
    workflowNodes,
    isResultsLoading:
      outputDefsLoading ||
      paramDefsLoading ||
      orderLoading ||
      orderConditionsLoading ||
      roundsLoading,
    resultsError,
    retryResults,
    handleReset,
  };
};
