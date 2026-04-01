import React from 'react';
import { Loader2, PlayCircle } from 'lucide-react';
import type { RoundItem, SimTypeResult as ConditionResultSummary } from '@/api/results';
import { Badge, Card } from '@/components/ui';
import { ConditionFlowCard } from './processFlow/ConditionFlowCard';
import { type WorkflowNode } from './processFlow/FlowNode';
import { ProcessFlowProgressBar } from './processFlow/processFlowStatus';
import { PROCESS_FLOW_STATUS_CONFIG } from './processFlow/processFlowStatusConfig';

export interface ProcessFlowViewProps {
  orderId: number;
  orderStatus: number;
  orderProgress: number;
  conditionResults: ConditionResultSummary[];
  conditionRoundGroups: Array<{ conditionId: number; rounds: RoundItem[] }>;
  conditionLabelMap: Map<number, string>;
  workflowNodes: WorkflowNode[];
  loading?: boolean;
}

export const ProcessFlowView: React.FC<ProcessFlowViewProps> = ({
  orderId,
  orderStatus,
  orderProgress,
  conditionResults,
  conditionRoundGroups,
  conditionLabelMap,
  workflowNodes,
  loading = false,
}) => {
  const statusConfig = PROCESS_FLOW_STATUS_CONFIG[orderStatus] || PROCESS_FLOW_STATUS_CONFIG[0];

  const totalRounds = conditionRoundGroups.reduce((sum, group) => sum + group.rounds.length, 0);
  const completedRounds = conditionRoundGroups.reduce(
    (sum, group) => sum + group.rounds.filter(round => round.status === 2).length,
    0
  );
  const runningRounds = conditionRoundGroups.reduce(
    (sum, group) => sum + group.rounds.filter(round => round.status === 1).length,
    0
  );
  const failedRounds = conditionRoundGroups.reduce(
    (sum, group) => sum + group.rounds.filter(round => round.status === 3).length,
    0
  );

  if (loading) {
    return (
      <Card>
        <div className="flex h-64 items-center justify-center text-slate-500">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          正在加载流程视图...
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-brand-100 p-3 dark:bg-brand-900/30">
              <PlayCircle className="h-8 w-8 text-brand-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">订单 #{orderId}</h3>
                <Badge variant={statusConfig.variant} size="md">
                  {statusConfig.label}
                </Badge>
              </div>
              <div className="mt-1 flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <span>工况 {conditionResults.length}</span>
                <span>总轮次 {totalRounds}</span>
                <span className="text-green-600">完成 {completedRounds}</span>
                {runningRounds > 0 && (
                  <span className="text-amber-600">运行中 {runningRounds}</span>
                )}
                {failedRounds > 0 && <span className="text-red-600">失败 {failedRounds}</span>}
              </div>
            </div>
            <div className="w-64">
              <ProcessFlowProgressBar progress={orderProgress} status={orderStatus} />
            </div>
          </div>

          <div className="border-t" />

          <div className="space-y-3">
            {conditionResults.map((result, index) => {
              const conditionId = result.simTypeId;
              const rounds =
                conditionRoundGroups.find(group => group.conditionId === conditionId)?.rounds || [];
              const conditionName = conditionLabelMap.get(conditionId) || `工况-${conditionId}`;
              return (
                <ConditionFlowCard
                  key={result.id}
                  conditionResult={result}
                  conditionName={conditionName}
                  rounds={rounds}
                  nodes={workflowNodes}
                  defaultExpanded={index === 0}
                />
              );
            })}
          </div>

          {conditionResults.length === 0 && (
            <div className="flex h-32 items-center justify-center text-slate-500">暂无工况数据</div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ProcessFlowView;
