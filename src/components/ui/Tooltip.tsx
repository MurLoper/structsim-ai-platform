/**
 * Tooltip - 文字提示组件
 *
 * 参考 Element UI el-tooltip / Ant Design Tooltip
 * 纯 CSS 实现，无需 radix 依赖，轻量高效
 *
 * @example
 * ```tsx
 * <Tooltip content="这是一段提示">
 *   <Button>悬浮查看</Button>
 * </Tooltip>
 *
 * <Tooltip content="删除此项" placement="left">
 *   <TrashIcon className="w-4 h-4" />
 * </Tooltip>
 * ```
 */
import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface TooltipProps {
  /** 提示内容 */
  content: React.ReactNode;
  /** 触发元素 */
  children: React.ReactElement;
  /** 位置 */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** 延迟显示(ms) */
  delay?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 容器类名 */
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  delay = 200,
  disabled = false,
  className,
}) => {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback(() => {
    if (disabled) return;
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }, [disabled, delay]);

  const hide = useCallback(() => {
    clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  if (!content || disabled) return children;

  const placementStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowStyles = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-popover border-x-transparent border-b-transparent',
    bottom:
      'bottom-full left-1/2 -translate-x-1/2 border-b-popover border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-popover border-y-transparent border-r-transparent',
    right:
      'right-full top-1/2 -translate-y-1/2 border-r-popover border-y-transparent border-l-transparent',
  };

  return (
    <span className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && (
        <div
          className={cn(
            'absolute z-50 px-2.5 py-1.5 text-xs rounded-md shadow-lg',
            'bg-popover text-popover-foreground border border-border',
            'whitespace-nowrap pointer-events-none animate-fade-in',
            placementStyles[placement],
            className
          )}
        >
          {content}
          <div className={cn('absolute w-0 h-0 border-4', arrowStyles[placement])} />
        </div>
      )}
    </span>
  );
};
Tooltip.displayName = 'Tooltip';
