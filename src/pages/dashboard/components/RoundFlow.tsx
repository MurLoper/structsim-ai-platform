/**
 * 轮次流程可视化组件
 *
 * 展示单个轮次的工作流执行进度
 */
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui';
import { CheckCircle, XCircle, Clock, Loader2, ChevronRight } from 'lucide-react';

/** 工作流节点 */
export interface WorkflowNode {
  id: string;
  moduleId: number;
  name: string;
  position?: { x: number; y: number };
}

/** 节点进度数据 */
export interface NodeProgress {
  [nodeId: string]: number; // 0-100
}

export interface RoundFlowProps {
  /** 工作流节点列表 */
  nodes: WorkflowNode[];
  /** 当前节点ID */
  currentNodeId?: number | null;
  /** 各节点进度 */
  nodeProgress?: NodeProgress | null;
  /** 轮次状态: 0=待运行, 1=运行中, 2=已完成, 3=失败 */
  status: number;
  /** 卡住的模块ID */
  stuckModuleId?: number | null;
  /** 紧凑模式 */
  compact?: boolean;
}

/** 获取节点状态 */
function getNodeStatus(
  nodeId: string,
  nodeIndex: number,
  currentNodeId: number | null | undefined,
  nodeProgress: NodeProgress | null | undefined,
  roundStatus: number
): 'pending' | 'running' | 'completed' | 'failed' {
  const progress = nodeProgress?.[nodeId] ?? nodeProgress?.[`node_${nodeIndex + 1}`] ?? 0;

  if (roundStatus === 3 && progress > 0 && progress < 100) {
    return 'failed';
  }
  if (progress >= 100) {
    return 'completed';
  }
  if (progress > 0) {
    return 'running';
  }
  return 'pending';
}

/** 节点状态图标 */
function NodeIcon({ status }: { status: 'pending' | 'running' | 'completed' | 'failed' }) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'running':
      return <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />;
    case 'failed':
      return <XCircle className="w-5 h-5 text-red-500" />;
    default:
      return <Clock className="w-5 h-5 text-slate-400" />;
  }
}

export const RoundFlow: React.FC<RoundFlowProps> = ({
  nodes,
  currentNodeId,
  nodeProgress,
  status,
  stuckModuleId,
  compact = false,
}) => {
  if (!nodes || nodes.length === 0) {
    return <div className="text-sm text-slate-500 py-2">暂无流程配置</div>;
  }

  return (
    <div className={cn('flex items-center gap-1', compact ? 'flex-wrap' : 'overflow-x-auto')}>
      {nodes.map((node, index) => {
        const nodeStatus = getNodeStatus(node.id, index, currentNodeId, nodeProgress, status);
        const progress = nodeProgress?.[node.id] ?? nodeProgress?.[`node_${index + 1}`] ?? 0;
        const isStuck = stuckModuleId === node.moduleId;

        return (
          <div key={node.id} className="flex items-center">
            {/* 节点 */}
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors',
                nodeStatus === 'completed' &&
                  'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
                nodeStatus === 'running' &&
                  'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
                nodeStatus === 'failed' &&
                  'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
                nodeStatus === 'pending' &&
                  'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700',
                isStuck && 'ring-2 ring-red-400'
              )}
            >
              <NodeIcon status={nodeStatus} />
              <div className="flex flex-col">
                <span
                  className={cn(
                    'text-sm font-medium whitespace-nowrap',
                    nodeStatus === 'pending' && 'text-slate-500'
                  )}
                >
                  {node.name}
                </span>
                {nodeStatus === 'running' && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">{progress}%</span>
                )}
              </div>
            </div>
            {/* 连接线 */}
            {index < nodes.length - 1 && (
              <ChevronRight className="w-4 h-4 text-slate-400 mx-1 flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RoundFlow;
