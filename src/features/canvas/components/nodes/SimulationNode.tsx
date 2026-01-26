/**
 * 仿真节点组件
 *
 * 代表一个仿真任务节点
 */
import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Play } from 'lucide-react';

export interface SimulationNodeData {
  label: string;
  simType?: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  progress?: number;
}

interface SimulationNodeProps {
  data: SimulationNodeData;
  selected?: boolean;
}

export const SimulationNode = memo(function SimulationNode({
  data,
  selected,
}: SimulationNodeProps) {
  const { label, simType, status = 'idle', progress } = data;

  const statusColors = {
    idle: 'border-border bg-card',
    running: 'border-primary bg-primary/5',
    success: 'border-success bg-success/5',
    error: 'border-destructive bg-destructive/5',
  };

  const statusIndicator = {
    idle: 'bg-muted-foreground',
    running: 'bg-primary animate-pulse',
    success: 'bg-success',
    error: 'bg-destructive',
  };

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 shadow-sm min-w-[160px]',
        'transition-all duration-200',
        statusColors[status],
        selected && 'ring-2 ring-ring ring-offset-2'
      )}
    >
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />

      {/* 节点内容 */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg',
            'bg-primary/10 text-primary'
          )}
        >
          <Play className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">{label}</div>
          {simType && <div className="text-xs text-muted-foreground truncate">{simType}</div>}
        </div>
        <div className={cn('w-2 h-2 rounded-full', statusIndicator[status])} />
      </div>

      {/* 进度条 */}
      {status === 'running' && progress != null && (
        <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
    </div>
  );
});
