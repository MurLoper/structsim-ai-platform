import type {
  ModuleDetail,
  OrderConditionRoundsResponse,
  OrderConditionSummary,
  RoundItem,
} from '@/api/results';
import type { OutputDef } from '@/types/config';
import type { WorkflowNode } from '../components/processFlow/FlowNode';
import type {
  ConditionRoundsGroup,
  FullConditionRoundsGroup,
  ResultRecord,
  ResultsOverviewStats,
} from './resultsAnalysisTypes';

export const buildConditionLabel = (condition: OrderConditionSummary) => {
  const fold = condition.foldTypeName || `姿态#${condition.foldTypeId ?? '-'}`;
  const sim = condition.simTypeName || `仿真类型#${condition.simTypeId}`;
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
  outputResults: item.outputOrigins ?? item.outputs ?? null,
  outputOriginResults: item.outputOrigins ?? item.outputs ?? null,
  outputFinalResults: item.outputFinals ?? null,
  outputAttachments: item.outputAttachments ?? null,
  errorMsg: item.status === 3 ? '结果执行失败' : undefined,
  runningModule: item.runningModule,
  runningStatus: item.runningStatus ?? item.status,
  finalResult: item.finalResult ?? null,
  optDataId: item.optDataId,
  taskId: item.taskId,
  dataDir: item.dataDir,
  baseDir: item.baseDir,
  jobDir: item.jobDir,
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
) => {
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
      optIssueId: resolvedCondition.optIssueId,
      optJobId: resolvedCondition.optJobId,
      canResubmit: resolvedCondition.canResubmit === true,
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
    resultSource: orderConditions.some(condition => condition.resultSource === 'external')
      ? 'external'
      : stats.resultSource,
    runningModules: Array.from(runningModuleSet),
  };
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
