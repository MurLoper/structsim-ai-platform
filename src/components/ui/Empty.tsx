/**
 * Empty - 空状态占位组件
 *
 * 类似 Element UI 的 el-empty / Ant Design 的 Empty
 * 用于数据为空时的统一展示
 *
 * @example
 * ```tsx
 * <Empty />
 * <Empty description="未找到匹配的参数" />
 * <Empty icon={<InboxIcon />} description="暂无数据" action={<Button>新建</Button>} />
 * ```
 */
import React from 'react';
import { cn } from '@/lib/utils';

export interface EmptyProps {
  /** 自定义图标 */
  icon?: React.ReactNode;
  /** 描述文字 */
  description?: string;
  /** 操作区域（如按钮） */
  action?: React.ReactNode;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 容器类名 */
  className?: string;
}

const DefaultIcon = () => (
  <svg
    className="w-16 h-16 text-muted-foreground/30"
    viewBox="0 0 64 64"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <rect x="12" y="20" width="40" height="28" rx="3" />
    <path d="M12 28h40" />
    <circle cx="32" cy="38" r="4" />
    <path d="M20 14h24" strokeLinecap="round" />
  </svg>
);

export const Empty: React.FC<EmptyProps> = ({
  icon,
  description = '暂无数据',
  action,
  size = 'md',
  className,
}) => {
  const sizeStyles = {
    sm: 'py-6',
    md: 'py-12',
    lg: 'py-20',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center', sizeStyles[size], className)}>
      <div className="mb-3">{icon || <DefaultIcon />}</div>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
Empty.displayName = 'Empty';
