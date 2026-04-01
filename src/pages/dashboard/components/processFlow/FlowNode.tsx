import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProcessFlowStatusIcon } from './processFlowStatus';

export interface WorkflowNode {
  id: string;
  moduleId: number;
  name: string;
  position?: { x: number; y: number };
}

type FlowNodeProps = {
  node: WorkflowNode;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  isStuck?: boolean;
  isLast?: boolean;
};

export const FlowNode: React.FC<FlowNodeProps> = ({
  node,
  status,
  progress = 0,
  isStuck,
  isLast,
}) => {
  const bgClass =
    status === 'completed'
      ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
      : status === 'running'
        ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20'
        : status === 'failed'
          ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
          : 'border-slate-200 bg-slate-50 dark:bg-slate-800';

  const statusNumber =
    status === 'completed' ? 2 : status === 'running' ? 1 : status === 'failed' ? 3 : 0;

  return (
    <div className="flex items-center">
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border px-3 py-2',
          bgClass,
          isStuck && 'ring-2 ring-red-400'
        )}
      >
        <ProcessFlowStatusIcon status={statusNumber} className="h-4 w-4" />
        <div className="flex flex-col">
          <span
            className={cn(
              'whitespace-nowrap text-sm font-medium',
              status === 'pending' && 'text-slate-500'
            )}
          >
            {node.name}
          </span>
          {status === 'running' && <span className="text-xs text-amber-600">{progress}%</span>}
        </div>
      </div>
      {!isLast && <ChevronRight className="mx-1 h-4 w-4 flex-shrink-0 text-slate-400" />}
    </div>
  );
};
