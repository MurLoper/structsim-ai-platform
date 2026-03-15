/**
 * Divider - 分割线组件
 *
 * 参考 Element UI el-divider / Ant Design Divider
 * 支持水平/垂直方向、带文字分割
 *
 * @example
 * ```tsx
 * <Divider />
 * <Divider>或者</Divider>
 * <Divider orientation="left">基本信息</Divider>
 * <Divider type="vertical" />
 * ```
 */
import React from 'react';
import { cn } from '@/lib/utils';

export interface DividerProps {
  /** 方向 */
  type?: 'horizontal' | 'vertical';
  /** 文字位置（仅水平方向） */
  orientation?: 'left' | 'center' | 'right';
  /** 分割线文字 */
  children?: React.ReactNode;
  /** 是否虚线 */
  dashed?: boolean;
  /** 间距大小 */
  spacing?: 'sm' | 'md' | 'lg';
  /** 容器类名 */
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({
  type = 'horizontal',
  orientation = 'center',
  children,
  dashed = false,
  spacing = 'md',
  className,
}) => {
  if (type === 'vertical') {
    return (
      <span
        className={cn(
          'inline-block w-px self-stretch',
          dashed ? 'border-l border-dashed border-border' : 'bg-border',
          { sm: 'mx-1', md: 'mx-3', lg: 'mx-5' }[spacing],
          className
        )}
      />
    );
  }

  const spacingY = { sm: 'my-2', md: 'my-4', lg: 'my-6' }[spacing];
  const lineClass = cn(
    'flex-1 h-px',
    dashed ? 'border-t border-dashed border-border' : 'bg-border'
  );

  if (!children) {
    return <div className={cn(lineClass, spacingY, className)} />;
  }

  const orientClass = {
    left: 'after:flex-[8]',
    center: '',
    right: 'before:flex-[8]',
  };

  return (
    <div className={cn('flex items-center gap-3', spacingY, orientClass[orientation], className)}>
      <div className={lineClass} />
      <span className="text-xs text-muted-foreground font-medium whitespace-nowrap shrink-0">
        {children}
      </span>
      <div className={lineClass} />
    </div>
  );
};
Divider.displayName = 'Divider';
