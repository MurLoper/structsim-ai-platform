/**
 * 流程展示视图
 *
 * 层级式展示：订单 -> 工况 -> 轮次
 */
import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Loader2,
  PlayCircle,
  XCircle,
} from 'lucide-react';
import type { RoundItem, SimTypeResult as ConditionResultSummary } from '@/api/results';
import { Badge, Card } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface WorkflowNode {
  id: string;
  moduleId: number;
  name: string;
  position?: { x: number; y: number };
}

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

const STATUS_CONFIG: Record<
  number,
  { label: string; variant: 'default' | 'success' | 'warning' | 'error'; icon: React.ElementType }
> = {
  0: { label: '待运行', variant: 'default', icon: Clock },
  1: { label: '运行中', variant: 'warning', icon: Loader2 },
  2: { label: '已完成', variant: 'success', icon: CheckCircle },
  3: { label: '失败', variant: 'error', icon: XCircle },
};

const ProgressBar: React.FC<{ progress: number; status: number }> = ({ progress, status }) => {
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

const StatusIcon: React.FC<{ status: number; className?: string }> = ({ status, className }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG[0];
  const Icon = config.icon;
  const iconClass =
    status === 2
      ? 'text-green-500'
      : status === 3
        ? 'text-red-500'
        : status === 1
          ? 'text-amber-500 animate-spin'
          : 'text-slate-400';

  return <Icon className={cn('h-5 w-5', iconClass, className)} />;
};

const FlowNode: React.FC<{
  node: WorkflowNode;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  isStuck?: boolean;
  isLast?: boolean;
}> = ({ node, status, progress = 0, isStuck, isLast }) => {
  const bgClass =
    status === 'completed'
      ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
      : status === 'running'
        ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20'
        : status === 'failed'
          ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
          : 'border-slate-200 bg-slate-50 dark:bg-slate-800';

  const statusNum =
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
        <StatusIcon status={statusNum} className="h-4 w-4" />
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

function getNodeStatus(
  nodeId: string,
  nodeIndex: number,
  nodeProgress: Record<string, number> | null | undefined,
  roundStatus: number
): 'pending' | 'running' | 'completed' | 'failed' {
  const progress = nodeProgress?.[nodeId] ?? nodeProgress?.[`node_${nodeIndex + 1}`] ?? 0;
  if (roundStatus === 3 && progress > 0 && progress < 100) return 'failed';
  if (progress >= 100) return 'completed';
  if (progress > 0) return 'running';
  return 'pending';
}

const RoundFlowRow: React.FC<{ round: RoundItem; nodes: WorkflowNode[] }> = ({ round, nodes }) => (
  <div className="flex items-center gap-4 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
    <div className="flex min-w-[100px] items-center gap-2">
      <StatusIcon status={round.status} className="h-4 w-4" />
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

const ConditionFlowCard: React.FC<{
  conditionResult: ConditionResultSummary;
  conditionName: string;
  rounds: RoundItem[];
  nodes: WorkflowNode[];
  defaultExpanded?: boolean;
}> = ({ conditionResult, conditionName, rounds, nodes, defaultExpanded = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'failed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const statusConfig = STATUS_CONFIG[conditionResult.status] || STATUS_CONFIG[0];
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
        <StatusIcon status={conditionResult.status} />
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
          <ProgressBar progress={conditionResult.progress} status={conditionResult.status} />
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
            <div className="py-4 text-center text-sm text-slate-500">无匹配的轮次</div>
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
  const statusConfig = STATUS_CONFIG[orderStatus] || STATUS_CONFIG[0];

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
          加载中...
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
              <ProgressBar progress={orderProgress} status={orderStatus} />
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
