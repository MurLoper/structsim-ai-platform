/**
 * 流程展示视图组件
 *
 * 层级式展示：订单 -> 方案 -> 轮次
 */
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card, Badge, Button } from '@/components/ui';
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  PlayCircle,
  AlertTriangle,
  Filter,
} from 'lucide-react';
import type { RoundItem, SimTypeResult } from '@/api/results';

/** 工作流节点 */
export interface WorkflowNode {
  id: string;
  moduleId: number;
  name: string;
  position?: { x: number; y: number };
}

export interface ProcessFlowViewProps {
  /** 订单ID */
  orderId: number;
  /** 订单状态 */
  orderStatus: number;
  /** 订单进度 */
  orderProgress: number;
  /** 仿真类型结果列表 */
  simTypeResults: SimTypeResult[];
  /** 按仿真类型分组的轮次数据 */
  roundsBySimType: Array<{ simTypeId: number; rounds: RoundItem[] }>;
  /** 仿真类型名称映射 */
  simTypeLabelMap: Map<number, string>;
  /** 工作流节点配置 */
  workflowNodes: WorkflowNode[];
  /** 是否加载中 */
  loading?: boolean;
}

/** 状态配置 */
const STATUS_CONFIG: Record<
  number,
  { label: string; variant: 'default' | 'success' | 'warning' | 'error'; icon: React.ElementType }
> = {
  0: { label: '待运行', variant: 'default', icon: Clock },
  1: { label: '运行中', variant: 'warning', icon: Loader2 },
  2: { label: '已完成', variant: 'success', icon: CheckCircle },
  3: { label: '失败', variant: 'error', icon: XCircle },
};

/** 进度条组件 */
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
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', colorClass)}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <span className="text-xs text-slate-500 w-10 text-right">{progress}%</span>
    </div>
  );
};

/** 状态图标组件 */
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

  return <Icon className={cn('w-5 h-5', iconClass, className)} />;
};

/** 流程节点组件 */
const FlowNode: React.FC<{
  node: WorkflowNode;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  isStuck?: boolean;
  isLast?: boolean;
}> = ({ node, status, progress = 0, isStuck, isLast }) => {
  const bgClass =
    status === 'completed'
      ? 'bg-green-50 border-green-300 dark:bg-green-900/20'
      : status === 'running'
        ? 'bg-amber-50 border-amber-300 dark:bg-amber-900/20'
        : status === 'failed'
          ? 'bg-red-50 border-red-300 dark:bg-red-900/20'
          : 'bg-slate-50 border-slate-200 dark:bg-slate-800';

  const statusNum =
    status === 'completed' ? 2 : status === 'running' ? 1 : status === 'failed' ? 3 : 0;

  return (
    <div className="flex items-center">
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border',
          bgClass,
          isStuck && 'ring-2 ring-red-400'
        )}
      >
        <StatusIcon status={statusNum} className="w-4 h-4" />
        <div className="flex flex-col">
          <span
            className={cn(
              'text-sm font-medium whitespace-nowrap',
              status === 'pending' && 'text-slate-500'
            )}
          >
            {node.name}
          </span>
          {status === 'running' && <span className="text-xs text-amber-600">{progress}%</span>}
        </div>
      </div>
      {!isLast && <ChevronRight className="w-4 h-4 text-slate-400 mx-1 flex-shrink-0" />}
    </div>
  );
};

/** 获取节点状态 */
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

/** 轮次流程行 */
const RoundFlowRow: React.FC<{
  round: RoundItem;
  nodes: WorkflowNode[];
}> = ({ round, nodes }) => {
  const statusConfig = STATUS_CONFIG[round.status] || STATUS_CONFIG[0];

  return (
    <div className="flex items-center gap-4 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
      <div className="flex items-center gap-2 min-w-[100px]">
        <StatusIcon status={round.status} className="w-4 h-4" />
        <span className="text-sm font-medium">轮次 #{round.roundIndex}</span>
      </div>
      <div className="flex items-center gap-1 overflow-x-auto flex-1">
        {nodes.map((node, idx) => {
          const status = getNodeStatus(node.id, idx, round.flowNodeProgress, round.status);
          const progress =
            round.flowNodeProgress?.[node.id] ?? round.flowNodeProgress?.[`node_${idx + 1}`] ?? 0;
          return (
            <FlowNode
              key={node.id}
              node={node}
              status={status}
              progress={progress}
              isStuck={round.stuckModuleId === node.moduleId}
              isLast={idx === nodes.length - 1}
            />
          );
        })}
      </div>
      {round.errorMsg && (
        <span className="text-xs text-red-500 truncate max-w-[200px]" title={round.errorMsg}>
          {round.errorMsg}
        </span>
      )}
    </div>
  );
};

/** 方案流程卡片 */
const SimTypeFlowCard: React.FC<{
  simTypeResult: SimTypeResult;
  simTypeName: string;
  rounds: RoundItem[];
  nodes: WorkflowNode[];
  defaultExpanded?: boolean;
}> = ({ simTypeResult, simTypeName, rounds, nodes, defaultExpanded = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'failed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const statusConfig = STATUS_CONFIG[simTypeResult.status] || STATUS_CONFIG[0];

  const completedCount = rounds.filter(r => r.status === 2).length;
  const runningCount = rounds.filter(r => r.status === 1).length;
  const failedCount = rounds.filter(r => r.status === 3).length;

  // 筛选后的轮次
  const filteredRounds = useMemo(() => {
    if (statusFilter === 'running') return rounds.filter(r => r.status === 1);
    if (statusFilter === 'failed') return rounds.filter(r => r.status === 3);
    return rounds;
  }, [rounds, statusFilter]);

  // 分页数据
  const totalPages = Math.ceil(filteredRounds.length / pageSize);
  const paginatedRounds = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRounds.slice(start, start + pageSize);
  }, [filteredRounds, currentPage]);

  // 切换筛选时重置页码
  const handleFilterChange = (filter: 'all' | 'running' | 'failed') => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* 方案头部 */}
      <div
        className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
        onClick={() => setExpanded(!expanded)}
      >
        <button className="p-1">
          {expanded ? (
            <ChevronDown className="w-5 h-5 text-slate-500" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-500" />
          )}
        </button>
        <StatusIcon status={simTypeResult.status} />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="font-semibold">{simTypeName}</span>
            <Badge variant={statusConfig.variant} size="sm">
              {statusConfig.label}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
            <span>总轮次: {simTypeResult.totalRounds}</span>
            <span className="text-green-600">完成: {completedCount}</span>
            {runningCount > 0 && <span className="text-amber-600">运行中: {runningCount}</span>}
            {failedCount > 0 && <span className="text-red-600">失败: {failedCount}</span>}
          </div>
        </div>
        <div className="w-48">
          <ProgressBar progress={simTypeResult.progress} status={simTypeResult.status} />
        </div>
      </div>

      {/* 轮次列表 */}
      {expanded && rounds.length > 0 && (
        <div className="border-t bg-slate-50/50 dark:bg-slate-800/30 p-3 space-y-3">
          {/* 快速筛选按钮 */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400" />
            <button
              onClick={() => handleFilterChange('all')}
              className={cn(
                'px-3 py-1 text-xs rounded-full border transition-colors',
                statusFilter === 'all'
                  ? 'bg-slate-600 text-white border-slate-600'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
              )}
            >
              全部 ({rounds.length})
            </button>
            {runningCount > 0 && (
              <button
                onClick={() => handleFilterChange('running')}
                className={cn(
                  'px-3 py-1 text-xs rounded-full border transition-colors',
                  statusFilter === 'running'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-amber-600 border-amber-300 hover:bg-amber-50'
                )}
              >
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3" />
                  运行中 ({runningCount})
                </span>
              </button>
            )}
            {failedCount > 0 && (
              <button
                onClick={() => handleFilterChange('failed')}
                className={cn(
                  'px-3 py-1 text-xs rounded-full border transition-colors',
                  statusFilter === 'failed'
                    ? 'bg-red-500 text-white border-red-500'
                    : 'bg-white text-red-600 border-red-300 hover:bg-red-50'
                )}
              >
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  失败 ({failedCount})
                </span>
              </button>
            )}
          </div>

          {/* 轮次列表 */}
          {paginatedRounds.length > 0 ? (
            <div className="space-y-2">
              {paginatedRounds.map(round => (
                <RoundFlowRow key={round.id} round={round} nodes={nodes} />
              ))}
            </div>
          ) : (
            <div className="text-center text-sm text-slate-500 py-4">无匹配的轮次</div>
          )}

          {/* 分页控件 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-600 px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400 ml-2">共 {filteredRounds.length} 条</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/** 主组件 - 流程展示视图 */
export const ProcessFlowView: React.FC<ProcessFlowViewProps> = ({
  orderId,
  orderStatus,
  orderProgress,
  simTypeResults,
  roundsBySimType,
  simTypeLabelMap,
  workflowNodes,
  loading = false,
}) => {
  const statusConfig = STATUS_CONFIG[orderStatus] || STATUS_CONFIG[0];

  // 统计数据
  const totalRounds = roundsBySimType.reduce((sum, g) => sum + g.rounds.length, 0);
  const completedRounds = roundsBySimType.reduce(
    (sum, g) => sum + g.rounds.filter(r => r.status === 2).length,
    0
  );
  const runningRounds = roundsBySimType.reduce(
    (sum, g) => sum + g.rounds.filter(r => r.status === 1).length,
    0
  );
  const failedRounds = roundsBySimType.reduce(
    (sum, g) => sum + g.rounds.filter(r => r.status === 3).length,
    0
  );

  if (loading) {
    return (
      <Card>
        <div className="h-64 flex items-center justify-center text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          加载中...
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 订单级别流程卡片 */}
      <Card>
        <div className="space-y-4">
          {/* 订单头部 */}
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-brand-100 dark:bg-brand-900/30">
              <PlayCircle className="w-8 h-8 text-brand-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">订单 #{orderId}</h3>
                <Badge variant={statusConfig.variant} size="md">
                  {statusConfig.label}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                <span>方案数: {simTypeResults.length}</span>
                <span>总轮次: {totalRounds}</span>
                <span className="text-green-600">完成: {completedRounds}</span>
                {runningRounds > 0 && (
                  <span className="text-amber-600">运行中: {runningRounds}</span>
                )}
                {failedRounds > 0 && <span className="text-red-600">失败: {failedRounds}</span>}
              </div>
            </div>
            <div className="w-64">
              <ProgressBar progress={orderProgress} status={orderStatus} />
            </div>
          </div>

          {/* 分隔线 */}
          <div className="border-t" />

          {/* 方案列表 */}
          <div className="space-y-3">
            {simTypeResults.map((result, idx) => {
              const rounds =
                roundsBySimType.find(g => g.simTypeId === result.simTypeId)?.rounds || [];
              const simTypeName =
                simTypeLabelMap.get(result.simTypeId) || `SimType-${result.simTypeId}`;
              return (
                <SimTypeFlowCard
                  key={result.id}
                  simTypeResult={result}
                  simTypeName={simTypeName}
                  rounds={rounds}
                  nodes={workflowNodes}
                  defaultExpanded={idx === 0}
                />
              );
            })}
          </div>

          {simTypeResults.length === 0 && (
            <div className="h-32 flex items-center justify-center text-slate-500">暂无方案数据</div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ProcessFlowView;
