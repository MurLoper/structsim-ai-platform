import React from 'react';
import type { RoundItem } from '@/api/results';
import { FlowNode, type WorkflowNode } from './FlowNode';
import { ProcessFlowStatusIcon } from './processFlowStatus';

const getNodeStatus = (
  nodeId: string,
  nodeIndex: number,
  nodeProgress: Record<string, number> | null | undefined,
  roundStatus: number
): 'pending' | 'running' | 'completed' | 'failed' => {
  const progress = nodeProgress?.[nodeId] ?? nodeProgress?.[`node_${nodeIndex + 1}`] ?? 0;
  if (roundStatus === 3 && progress > 0 && progress < 100) return 'failed';
  if (progress >= 100) return 'completed';
  if (progress > 0) return 'running';
  return 'pending';
};

type RoundFlowRowProps = {
  round: RoundItem;
  nodes: WorkflowNode[];
};

export const RoundFlowRow: React.FC<RoundFlowRowProps> = ({ round, nodes }) => (
  <div className="flex items-center gap-4 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
    <div className="flex min-w-[100px] items-center gap-2">
      <ProcessFlowStatusIcon status={round.status} className="h-4 w-4" />
      <span className="text-sm font-medium">轮次 #{round.roundIndex}</span>
    </div>
    <div className="flex flex-1 items-center gap-1 overflow-x-auto">
      {nodes.map((node, index) => {
        const status = getNodeStatus(node.id, index, round.flowNodeProgress, round.status);
        const progress =
          round.flowNodeProgress?.[node.id] ?? round.flowNodeProgress?.[`node_${index + 1}`] ?? 0;
        return (
          <FlowNode
            key={node.id}
            node={node}
            status={status}
            progress={progress}
            isStuck={round.stuckModuleId === node.moduleId}
            isLast={index === nodes.length - 1}
          />
        );
      })}
    </div>
    {round.errorMsg && (
      <span className="max-w-[220px] truncate text-xs text-red-500" title={round.errorMsg}>
        {round.errorMsg}
      </span>
    )}
  </div>
);
