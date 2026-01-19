/**
 * 参数节点组件
 *
 * 代表输入参数配置
 */
import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { SlidersHorizontal } from 'lucide-react';

export interface ParameterNodeData {
  label: string;
  paramCount?: number;
  description?: string;
}

export const ParameterNode = memo(function ParameterNode({
  data,
  selected,
}: NodeProps<ParameterNodeData>) {
  const { label, paramCount, description } = data;

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 shadow-sm min-w-[140px]',
        'border-warning/50 bg-warning/5',
        'transition-all duration-200',
        selected && 'ring-2 ring-ring ring-offset-2'
      )}
    >
      {/* 节点内容 */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg',
            'bg-warning/10 text-warning'
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">{label}</div>
          {paramCount != null && (
            <div className="text-xs text-muted-foreground">{paramCount} 个参数</div>
          )}
        </div>
      </div>

      {description && (
        <div className="mt-2 text-xs text-muted-foreground truncate">{description}</div>
      )}

      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-warning !border-2 !border-background"
      />
    </div>
  );
});
