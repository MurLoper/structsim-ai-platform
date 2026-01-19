/**
 * 结果节点组件
 *
 * 代表输出结果
 */
import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';

export interface ResultNodeData {
  label: string;
  outputCount?: number;
  description?: string;
}

export const ResultNode = memo(function ResultNode({ data, selected }: NodeProps<ResultNodeData>) {
  const { label, outputCount, description } = data;

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 shadow-sm min-w-[140px]',
        'border-success/50 bg-success/5',
        'transition-all duration-200',
        selected && 'ring-2 ring-ring ring-offset-2'
      )}
    >
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-success !border-2 !border-background"
      />

      {/* 节点内容 */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg',
            'bg-success/10 text-success'
          )}
        >
          <BarChart3 className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">{label}</div>
          {outputCount != null && (
            <div className="text-xs text-muted-foreground">{outputCount} 个输出</div>
          )}
        </div>
      </div>

      {description && (
        <div className="mt-2 text-xs text-muted-foreground truncate">{description}</div>
      )}
    </div>
  );
});
