import { RESULTS_CHART_MAX_POINTS } from '@/constants';
import type {
  ModuleDetail,
  OrderConditionRoundColumn,
  OrderConditionRoundsResponse,
  OrderConditionSummary,
  RoundItem,
  SimTypeResult as ConditionResultSummary,
} from '@/api/results';
import type { OutputDef } from '@/types/config';
import type { WorkflowNode } from '../components/ProcessFlowView';

export interface ResultRecord {
  iteration: number;
  conditionId: number;
  metricKey: string;
  value: number;
  conditionName: string;
}

export interface ConditionRoundsGroup {
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

export interface FullConditionRoundsGroup extends ConditionRoundsGroup {
  sampled: boolean;
}

export interface ConditionRoundPagingState {
  page: number;
  pageSize: number;
}

export interface ResultsOverviewStats {
  conditionCount: number;
  totalRounds: number;
  completedRounds: number;
  failedRounds: number;
  runningRounds: number;
  resultSource: string;
  runningModules: string[];
}

export const RESULTS_ANALYSIS_PAGE_SIZE = 20000;

export const buildConditionLabel = (condition: OrderConditionSummary) => {
  const fold = condition.foldTypeName || `宸ュ喌绫诲瀷-${condition.foldTypeId ?? '-'}`;
  const sim = condition.simTypeName || `浠跨湡绫诲瀷-${condition.simTypeId}`;
  return `${fold} / ${sim}`;
};

const buildModuleProgress = (moduleDetails?: ModuleDetail[]) => {
  if (!moduleDetails?.length) return null;
  return moduleDetails.reduce<Record<string, number>>((acc, item, index) => {
    acc[item.moduleCode || `node_${index + 1}`] = Number(item.progress ?? 0);
    return acc;
  }, {});
};

export const mapMockRoundToLegacyRound = (
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
  errorMsg: item.status === 3 ? 'mock 杞鎵ц澶辫触' : undefined,
  runningModule: item.runningModule,
  finalResult: item.finalResult ?? null,
  moduleDetails: item.moduleDetails,
  flowNodeProgress: buildModuleProgress(item.moduleDetails),
});

export const buildWorkflowNodesFromRounds = (groups: ConditionRoundsGroup[]): WorkflowNode[] => {
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

export const buildMetricLabelMap = (
  conditionRoundGroups: ConditionRoundsGroup[],
  focusedConditionAnalysis: FullConditionRoundsGroup | null | undefined,
  outputDefs: OutputDef[]
) => {
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
};

export const buildConditionResults = (
  orderConditions: OrderConditionSummary[],
  conditionRoundGroups: ConditionRoundsGroup[]
): ConditionResultSummary[] => {
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
};

export const buildOverviewStats = (
  orderConditions: OrderConditionSummary[]
): ResultsOverviewStats => {
  const runningModuleSet = new Set<string>();
  const stats = orderConditions.reduce<ResultsOverviewStats>(
    (acc, condition) => {
      const summary = (condition.statistics as
        | {
            totalRounds?: number;
            completedRounds?: number;
            failedRounds?: number;
            runningRounds?: number;
          }
        | undefined) || { totalRounds: condition.roundTotal };

      acc.totalRounds += Number(summary.totalRounds ?? condition.roundTotal ?? 0);
      acc.completedRounds += Number(summary.completedRounds ?? 0);
      acc.failedRounds += Number(summary.failedRounds ?? 0);
      acc.runningRounds += Number(summary.runningRounds ?? 0);
      if (condition.status === 1 && condition.runningModule) {
        runningModuleSet.add(condition.runningModule);
      }
      return acc;
    },
    {
      conditionCount: orderConditions.length,
      totalRounds: 0,
      completedRounds: 0,
      failedRounds: 0,
      runningRounds: 0,
      resultSource: 'mock',
      runningModules: [],
    }
  );

  return {
    ...stats,
    runningModules: Array.from(runningModuleSet),
  };
};

export const buildResultRecords = (
  metric: string,
  conditionRoundGroups: ConditionRoundsGroup[]
): ResultRecord[] => {
  if (!metric || conditionRoundGroups.length === 0) {
    return [];
  }

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
        } satisfies ResultRecord;
      })
      .filter((item): item is ResultRecord => Boolean(item))
  );
};

export const filterResultRecords = (
  results: ResultRecord[],
  metric: string,
  selectedConditionIds: number[],
  minValue: string,
  maxValue: string,
  minIteration: string,
  maxIteration: string
) => {
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
};

export const sampleChartResults = (filteredResults: ResultRecord[]) => {
  if (filteredResults.length <= RESULTS_CHART_MAX_POINTS) {
    return filteredResults;
  }

  const step = Math.ceil(filteredResults.length / RESULTS_CHART_MAX_POINTS);
  return filteredResults.filter((_, index) => index % step === 0);
};

export const buildTrendData = (
  chartResults: ResultRecord[],
  conditionLabelMap: Map<number, string>
) =>
  chartResults.map(record => ({
    iteration: record.iteration,
    conditionName: conditionLabelMap.get(record.conditionId) || String(record.conditionId),
    value: record.value,
  }));

export const buildAvgByCondition = (
  filteredResults: ResultRecord[],
  conditionLabelMap: Map<number, string>
) => {
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
};

export const buildFocusedConditionResults = (
  metric: string,
  focusedConditionAnalysis: FullConditionRoundsGroup | null | undefined
): ResultRecord[] => {
  if (!metric || !focusedConditionAnalysis) {
    return [];
  }

  const conditionName = buildConditionLabel(focusedConditionAnalysis.orderCondition);
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
      } satisfies ResultRecord;
    })
    .filter((item): item is ResultRecord => Boolean(item));
};
