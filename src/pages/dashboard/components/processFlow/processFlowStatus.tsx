import React from 'react';
import { cn } from '@/lib/utils';
import { PROCESS_FLOW_STATUS_CONFIG } from './processFlowStatusConfig';

export const ProcessFlowProgressBar: React.FC<{ progress: number; status: number }> = ({
  progress,
  status,
}) => {
  const colorClass =
    status === 2
      ? 'bg-green-500'
      : status === 3
        ? 'bg-red-500'
        : status === 1
          ? 'bg-amber-500'
          : 'bg-slate-300';

  return (
    <div className="flex flex-1 items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={cn('h-full rounded-full transition-all duration-300', colorClass)}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs text-slate-500">{progress}%</span>
    </div>
  );
};

export const ProcessFlowStatusIcon: React.FC<{ status: number; className?: string }> = ({
  status,
  className,
}) => {
  const config = PROCESS_FLOW_STATUS_CONFIG[status] || PROCESS_FLOW_STATUS_CONFIG[0];
  const Icon = config.icon;
  const iconClass =
    status === 2
      ? 'text-green-500'
      : status === 3
        ? 'text-red-500'
        : status === 1
          ? 'animate-spin text-amber-500'
          : 'text-slate-400';

  return <Icon className={cn('h-5 w-5', iconClass, className)} />;
};
