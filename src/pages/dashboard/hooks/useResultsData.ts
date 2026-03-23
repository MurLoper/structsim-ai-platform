import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutputDefs, useParamDefs } from '@/features/config/queries';
import { ordersApi, resultsApi } from '@/api';
import { queryKeys } from '@/lib/queryClient';
import { PAGINATION, RESULTS_CHART_MAX_POINTS, RESULTS_PAGE_SIZE } from '@/constants';
import type {
  ModuleDetail,
  OrderConditionRoundColumn,
  OrderConditionRoundsResponse,
  OrderConditionSummary,
  RoundItem,
  SimTypeResult as ConditionResultSummary,
} from '@/api/results';
import type { WorkflowNode } from '../components/ProcessFlowView';

export interface ResultRecord {
  iteration: number;
  conditionId: number;
  metricKey: string;
  value: number;
  conditionName: string;
}

interface ConditionRoundsGroup {
  conditionId: number;
  rounds: RoundItem[];
  orderCondition: OrderConditionSummary;
  resultSource: string;
  columns: OrderConditionRoundColumn[];
  statistics?: OrderConditionRoundsResponse['statistics'];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface FullConditionRoundsGroup extends ConditionRoundsGroup {
  sampled: boolean;
}

interface ConditionRoundPagingState {
  page: number;
  pageSize: number;
}

interface ResultsOverviewStats {
  conditionCount: number;
  totalRounds: number;
  completedRounds: number;
  failedRounds: number;
  runningRounds: number;
  resultSource: string;
  runningModules: string[];
}

const RESULTS_ANALYSIS_PAGE_SIZE = 20000;

const buildConditionLabel = (condition: OrderConditionSummary) => {
  const fold = condition.foldTypeName || `工况类型-${condition.foldTypeId ?? '-'}`;
  const sim = condition.simTypeName || `仿真类型-${condition.simTypeId}`;
  return `${fold} / ${sim}`;
};

const buildModuleProgress = (moduleDetails?: ModuleDetail[]) => {
  if (!moduleDetails?.length) return null;
  return moduleDetails.reduce<Record<string, number>>((acc, item, index) => {
    acc[item.moduleCode || `node_${index + 1}`] = Number(item.progress ?? 0);
    return acc;
  }, {});
};

const mapMockRoundToLegacyRound = (
  conditionId: number,
  item: OrderConditionRoundsResponse['items'][number]
): RoundItem => ({
  id: item.id,
  simTypeResultId: conditionId,
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

const buildWorkflowNodesFromRounds = (groups: ConditionRoundsGroup[]): WorkflowNode[] => {
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
  const orderStatus = typeof orderDetail?.status === 'number' ? orderDetail.status : null;
  const orderProgress = typeof orderDetail?.progress === 'number' ? orderDetail.progress : null;

  const [metric, setMetric] = useState('');
  const [selectedConditionIds, setSelectedConditionIds] = useState<number[]>([]);
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [minIteration, setMinIteration] = useState('');
  const [maxIteration, setMaxIteration] = useState('');
  const [focusedConditionId, setFocusedConditionId] = useState<number | null>(null);
  const [conditionRoundPaging, setConditionRoundPaging] = useState<
    Record<number, ConditionRoundPagingState>
  >({});

  useEffect(() => {
    if (selectedConditionIds.length > 0) return;
    const fromConditions = orderConditions.map(item => item.id);
    const fromOrder = Array.isArray(orderDetail?.conditions)
      ? orderDetail.conditions.map((item: { id: number }) => item.id)
      : [];
    const defaults = fromConditions.length > 0 ? fromConditions : fromOrder;
    if (defaults.length > 0) {
      setSelectedConditionIds(defaults);
    }
  }, [orderConditions, orderDetail, selectedConditionIds.length]);

  useEffect(() => {
    if (!orderConditions.length) return;
    if (
      focusedConditionId &&
      orderConditions.some(condition => condition.id === focusedConditionId)
    ) {
      return;
    }
    setFocusedConditionId(orderConditions[0]?.id ?? null);
  }, [focusedConditionId, orderConditions]);

  const availableConditions = useMemo(
    () =>
      orderConditions.map(condition => ({
        id: condition.id,
        name: buildConditionLabel(condition),
      })),
    [orderConditions]
  );

  const availableConditionIds = useMemo(
    () => availableConditions.map(item => item.id),
    [availableConditions]
  );

  const conditionLabelMap = useMemo(
    () => new Map(availableConditions.map(item => [item.id, item.name])),
    [availableConditions]
  );

  const selectedConditions = useMemo(
    () => orderConditions.filter(condition => selectedConditionIds.includes(condition.id)),
    [orderConditions, selectedConditionIds]
  );

  useEffect(() => {
    if (selectedConditions.length === 0) return;
    setConditionRoundPaging(prev => {
      const next: Record<number, ConditionRoundPagingState> = {};
      selectedConditions.forEach(condition => {
        next[condition.id] = prev[condition.id] || {
          page: PAGINATION.DEFAULT_PAGE,
          pageSize: RESULTS_PAGE_SIZE,
        };
      });
      return next;
    });
  }, [selectedConditions]);

  const {
    data: conditionRoundGroups = [],
    isLoading: roundsLoading,
    error: roundsError,
    refetch: refetchRounds,
  } = useQuery({
    queryKey: [
      'results',
      'conditionRounds',
      resolvedOrderId,
      selectedConditionIds,
      conditionRoundPaging,
    ],
    queryFn: async () => {
      if (!resolvedOrderId || selectedConditions.length === 0) return [] as ConditionRoundsGroup[];
      const responses = await Promise.all(
        selectedConditions.map(async condition => {
          const paging = conditionRoundPaging[condition.id] || {
            page: PAGINATION.DEFAULT_PAGE,
            pageSize: RESULTS_PAGE_SIZE,
          };
          const response = await resultsApi.getOrderConditionRounds(condition.id, {
            page: paging.page,
            pageSize: paging.pageSize,
          });

          return {
            conditionId: condition.id,
            orderCondition: response.data?.orderCondition || condition,
            resultSource: response.data?.resultSource || 'mock',
            columns: response.data?.columns || [],
            statistics: response.data?.statistics,
            rounds: (response.data?.items || []).map(item =>
              mapMockRoundToLegacyRound(condition.id, item)
            ),
            page: response.data?.page || paging.page,
            pageSize: response.data?.pageSize || paging.pageSize,
            total: response.data?.total || 0,
            totalPages: response.data?.totalPages || 0,
          } as ConditionRoundsGroup;
        })
      );
      return responses;
    },
    enabled: !!resolvedOrderId && selectedConditions.length > 0,
    staleTime: 30 * 1000,
  });

  const workflowNodes = useMemo(
    () => buildWorkflowNodesFromRounds(conditionRoundGroups),
    [conditionRoundGroups]
  );

  const focusedCondition = useMemo(
    () => orderConditions.find(condition => condition.id === focusedConditionId) ?? null,
    [focusedConditionId, orderConditions]
  );

  const {
    data: focusedConditionAnalysis,
    isLoading: focusedConditionAnalysisLoading,
    error: focusedConditionAnalysisError,
    refetch: refetchFocusedConditionAnalysis,
  } = useQuery({
    queryKey: ['results', 'focusedConditionAnalysis', focusedConditionId],
    queryFn: async () => {
      if (!focusedCondition) return null as FullConditionRoundsGroup | null;
      const expectedTotal = Math.max(Number(focusedCondition.roundTotal || 0), 1);
      const pageSize = Math.min(
        Math.max(expectedTotal, RESULTS_PAGE_SIZE),
        RESULTS_ANALYSIS_PAGE_SIZE
      );
      const response = await resultsApi.getOrderConditionRounds(focusedCondition.id, {
        page: PAGINATION.DEFAULT_PAGE,
        pageSize,
      });

      return {
        conditionId: focusedCondition.id,
        orderCondition: response.data?.orderCondition || focusedCondition,
        resultSource: response.data?.resultSource || 'mock',
        columns: response.data?.columns || [],
        statistics: response.data?.statistics,
        rounds: (response.data?.items || []).map(item =>
          mapMockRoundToLegacyRound(focusedCondition.id, item)
        ),
        page: response.data?.page || PAGINATION.DEFAULT_PAGE,
        pageSize: response.data?.pageSize || pageSize,
        total: response.data?.total || expectedTotal,
        totalPages: response.data?.totalPages || 1,
        sampled: (response.data?.total || expectedTotal) > pageSize,
      } satisfies FullConditionRoundsGroup;
    },
    enabled: !!focusedCondition,
    staleTime: 30 * 1000,
  });

  const metricLabelMap = useMemo(() => {
    const map = new Map<string, string>();

    conditionRoundGroups.forEach(({ rounds }) => {
      rounds.forEach(round => {
        Object.keys(round.outputResults || {}).forEach(key => {
          if (!map.has(key)) {
            map.set(key, key);
          }
        });
      });
    });

    focusedConditionAnalysis?.rounds.forEach(round => {
      Object.keys(round.outputResults || {}).forEach(key => {
        if (!map.has(key)) {
          map.set(key, key);
        }
      });
    });

    outputDefs.forEach(def => {
      const key = String(def.id);
      if (!map.has(key)) {
        map.set(key, def.name);
      }
    });

    return map;
  }, [conditionRoundGroups, outputDefs]);

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

  const conditionResults = useMemo<ConditionResultSummary[]>(() => {
    const groupConditionMap = new Map(
      conditionRoundGroups.map(group => [group.orderCondition.id, group.orderCondition])
    );

    return orderConditions.map(condition => {
      const resolvedCondition = groupConditionMap.get(condition.id) || condition;
      const statistics = resolvedCondition.statistics as
        | {
            totalRounds?: number;
            completedRounds?: number;
            failedRounds?: number;
          }
        | undefined;

      return {
        id: resolvedCondition.id,
        orderId: resolvedCondition.orderId,
        simTypeId: resolvedCondition.id,
        simTypeName: buildConditionLabel(resolvedCondition),
        status: resolvedCondition.status,
        progress: Math.round(Number(resolvedCondition.process ?? 0)),
        totalRounds: Number(statistics?.totalRounds ?? resolvedCondition.roundTotal ?? 0),
        completedRounds: Number(statistics?.completedRounds ?? 0),
        failedRounds: Number(statistics?.failedRounds ?? 0),
        bestRoundIndex: null,
        createdAt: resolvedCondition.createdAt,
        updatedAt: resolvedCondition.updatedAt,
      };
    });
  }, [orderConditions, conditionRoundGroups]);

  const overviewStats = useMemo<ResultsOverviewStats>(() => {
    const runningModuleSet = new Set<string>();
    const stats = conditionRoundGroups.reduce<ResultsOverviewStats>(
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
        conditionCount: orderConditions.length,
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
  }, [orderConditions.length, conditionRoundGroups]);

  const results = useMemo(() => {
    if (!metric || conditionRoundGroups.length === 0) return [] as ResultRecord[];

    return conditionRoundGroups.flatMap(({ conditionId, rounds, orderCondition }) =>
      rounds
        .map(round => {
          const outputs = round.outputResults || {};
          const rawValue = outputs[metric];
          if (rawValue === undefined || rawValue === null) return null;
          const value = typeof rawValue === 'number' ? rawValue : Number(rawValue);
          if (!Number.isFinite(value)) return null;
          return {
            iteration: round.roundIndex,
            conditionId,
            metricKey: metric,
            value,
            conditionName: buildConditionLabel(orderCondition),
          } as ResultRecord;
        })
        .filter((item): item is ResultRecord => Boolean(item))
    );
  }, [metric, conditionRoundGroups]);

  const filteredResults = useMemo(() => {
    const minVal = minValue ? Number(minValue) : Number.NEGATIVE_INFINITY;
    const maxVal = maxValue ? Number(maxValue) : Number.POSITIVE_INFINITY;
    const minIter = minIteration ? Number(minIteration) : Number.NEGATIVE_INFINITY;
    const maxIter = maxIteration ? Number(maxIteration) : Number.POSITIVE_INFINITY;
    const conditionSet = new Set(selectedConditionIds);

    return results.filter(record => {
      if (metric && record.metricKey !== metric) return false;
      if (conditionSet.size > 0 && !conditionSet.has(record.conditionId)) return false;
      if (record.value < minVal || record.value > maxVal) return false;
      if (record.iteration < minIter || record.iteration > maxIter) return false;
      return true;
    });
  }, [results, metric, selectedConditionIds, minValue, maxValue, minIteration, maxIteration]);

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
        conditionName: conditionLabelMap.get(record.conditionId) || String(record.conditionId),
        value: record.value,
      })),
    [chartResults, conditionLabelMap]
  );

  const avgByCondition = useMemo(() => {
    const map = new Map<number, { total: number; count: number }>();
    filteredResults.forEach(record => {
      const current = map.get(record.conditionId) || { total: 0, count: 0 };
      map.set(record.conditionId, {
        total: current.total + record.value,
        count: current.count + 1,
      });
    });
    return Array.from(map.entries()).map(([conditionId, stats]) => ({
      conditionName: conditionLabelMap.get(conditionId) || String(conditionId),
      value: stats.count ? Math.round((stats.total / stats.count) * 100) / 100 : 0,
    }));
  }, [filteredResults, conditionLabelMap]);

  const focusedConditionResults = useMemo<ResultRecord[]>(() => {
    if (!metric || !focusedConditionAnalysis) return [];
    const condition = focusedConditionAnalysis.orderCondition;
    const conditionName = buildConditionLabel(condition);

    return focusedConditionAnalysis.rounds
      .map(round => {
        const outputs = round.outputResults || {};
        const rawValue = outputs[metric];
        if (rawValue === undefined || rawValue === null) return null;
        const value = typeof rawValue === 'number' ? rawValue : Number(rawValue);
        if (!Number.isFinite(value)) return null;
        return {
          iteration: round.roundIndex,
          conditionId: focusedConditionAnalysis.conditionId,
          metricKey: metric,
          value,
          conditionName,
        } as ResultRecord;
      })
      .filter((item): item is ResultRecord => Boolean(item));
  }, [focusedConditionAnalysis, metric]);

  const toggleCondition = (value: number) => {
    setSelectedConditionIds(prev =>
      prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
    );
  };

  const handleReset = () => {
    setMetric(metricOptions[0]?.value || '');
    setSelectedConditionIds(availableConditionIds);
    setMinValue('');
    setMaxValue('');
    setMinIteration('');
    setMaxIteration('');
  };

  const updateConditionRoundsPage = (conditionId: number, page: number) => {
    setConditionRoundPaging(prev => ({
      ...prev,
      [conditionId]: {
        ...(prev[conditionId] || { pageSize: RESULTS_PAGE_SIZE }),
        page: Math.max(1, page),
      },
    }));
  };

  const updateConditionRoundsPageSize = (conditionId: number, pageSize: number) => {
    setConditionRoundPaging(prev => ({
      ...prev,
      [conditionId]: {
        page: PAGINATION.DEFAULT_PAGE,
        pageSize,
      },
    }));
  };

  const resultsError =
    outputDefsError ||
    paramDefsError ||
    orderError ||
    orderConditionsError ||
    roundsError ||
    focusedConditionAnalysisError;

  const retryResults = () => {
    void refetchOutputDefs();
    void refetchParamDefs();
    if (resolvedOrderId) {
      void refetchOrder();
      void refetchOrderConditions();
      void refetchRounds();
      if (focusedConditionId) {
        void refetchFocusedConditionAnalysis();
      }
    }
  };

  return {
    displayOrderId,
    orderStatus,
    orderProgress,
    metric,
    setMetric,
    focusedConditionId,
    setFocusedConditionId,
    focusedCondition,
    focusedConditionAnalysis,
    focusedConditionResults,
    metricOptions,
    metricLabelMap,
    conditionLabelMap,
    selectedConditionIds,
    toggleCondition,
    minValue,
    setMinValue,
    maxValue,
    setMaxValue,
    minIteration,
    setMinIteration,
    maxIteration,
    setMaxIteration,
    availableConditions,
    availableConditionIds,
    filteredResults,
    trendData,
    avgByCondition,
    conditionResults,
    conditionRoundGroups,
    conditionRoundPaging,
    updateConditionRoundsPage,
    updateConditionRoundsPageSize,
    overviewStats,
    paramDefs,
    outputDefs,
    workflowNodes,
    isResultsLoading:
      outputDefsLoading ||
      paramDefsLoading ||
      orderLoading ||
      orderConditionsLoading ||
      roundsLoading ||
      focusedConditionAnalysisLoading,
    resultsError,
    retryResults,
    handleReset,
  };
};
