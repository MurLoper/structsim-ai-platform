import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
} from 'lucide-react';
import type { RoundItem, SimTypeResult as ConditionResultSummary } from '@/api/results';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { RoundFlowRow } from './RoundFlowRow';
import { type WorkflowNode } from './FlowNode';
import { ProcessFlowProgressBar, ProcessFlowStatusIcon } from './processFlowStatus';
import { PROCESS_FLOW_STATUS_CONFIG } from './processFlowStatusConfig';

type ConditionFlowCardProps = {
  conditionResult: ConditionResultSummary;
  conditionName: string;
  rounds: RoundItem[];
  nodes: WorkflowNode[];
  defaultExpanded?: boolean;
};

export const ConditionFlowCard: React.FC<ConditionFlowCardProps> = ({
  conditionResult,
  conditionName,
  rounds,
  nodes,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'failed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const statusConfig =
    PROCESS_FLOW_STATUS_CONFIG[conditionResult.status] || PROCESS_FLOW_STATUS_CONFIG[0];
  const pageSize = 10;

  const completedCount = rounds.filter(round => round.status === 2).length;
  const runningCount = rounds.filter(round => round.status === 1).length;
  const failedCount = rounds.filter(round => round.status === 3).length;

  const filteredRounds = useMemo(() => {
    if (statusFilter === 'running') return rounds.filter(round => round.status === 1);
    if (statusFilter === 'failed') return rounds.filter(round => round.status === 3);
    return rounds;
  }, [rounds, statusFilter]);

  const totalPages = Math.ceil(filteredRounds.length / pageSize);
  const paginatedRounds = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRounds.slice(start, start + pageSize);
  }, [filteredRounds, currentPage]);

  const handleFilterChange = (filter: 'all' | 'running' | 'failed') => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  return (
    <div className="overflow-hidden rounded-lg border">
      <div
        className="flex cursor-pointer items-center gap-4 bg-white p-4 hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/50"
        onClick={() => setExpanded(!expanded)}
      >
        <button className="p-1">
          {expanded ? (
            <ChevronDown className="h-5 w-5 text-slate-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-slate-500" />
          )}
        </button>
        <ProcessFlowStatusIcon status={conditionResult.status} />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="font-semibold">{conditionName}</span>
            <Badge variant={statusConfig.variant} size="sm">
              {statusConfig.label}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span>总轮次 {conditionResult.totalRounds}</span>
            <span className="text-green-600">完成 {completedCount}</span>
            {runningCount > 0 && <span className="text-amber-600">运行中 {runningCount}</span>}
            {failedCount > 0 && <span className="text-red-600">失败 {failedCount}</span>}
          </div>
        </div>
        <div className="w-48">
          <ProcessFlowProgressBar
            progress={conditionResult.progress}
            status={conditionResult.status}
          />
        </div>
      </div>

      {expanded && rounds.length > 0 && (
        <div className="space-y-3 border-t bg-slate-50/50 p-3 dark:bg-slate-800/30">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <button
              onClick={() => handleFilterChange('all')}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors',
                statusFilter === 'all'
                  ? 'border-slate-600 bg-slate-600 text-white'
                  : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
              )}
            >
              全部 ({rounds.length})
            </button>
            {runningCount > 0 && (
              <button
                onClick={() => handleFilterChange('running')}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors',
                  statusFilter === 'running'
                    ? 'border-amber-500 bg-amber-500 text-white'
                    : 'border-amber-300 bg-white text-amber-600 hover:bg-amber-50'
                )}
              >
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3" />
                  运行中 ({runningCount})
                </span>
              </button>
            )}
            {failedCount > 0 && (
              <button
                onClick={() => handleFilterChange('failed')}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors',
                  statusFilter === 'failed'
                    ? 'border-red-500 bg-red-500 text-white'
                    : 'border-red-300 bg-white text-red-600 hover:bg-red-50'
                )}
              >
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  失败 ({failedCount})
                </span>
              </button>
            )}
          </div>

          {paginatedRounds.length > 0 ? (
            <div className="space-y-2">
              {paginatedRounds.map(round => (
                <RoundFlowRow key={round.id} round={round} nodes={nodes} />
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-slate-500">没有匹配的轮次</div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="rounded border p-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-300">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="rounded border p-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <span className="ml-2 text-xs text-slate-400">共 {filteredRounds.length} 条</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
