/**
 * Tag - 标签组件
 *
 * 参考 Element UI el-tag / Ant Design Tag
 * 用于标记和分类，支持可关闭、多种颜色变体
 *
 * @example
 * ```tsx
 * <Tag>默认</Tag>
 * <Tag color="primary">主要</Tag>
 * <Tag color="success" closable onClose={handleClose}>成功</Tag>
 * <Tag color="custom" style={{ color: '#f00', borderColor: '#f00', backgroundColor: '#fff0f0' }}>自定义色</Tag>
 * ```
 */
import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export interface TagProps {
  /** 内容 */
  children: React.ReactNode;
  /** 预设颜色 */
  color?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  /** 尺寸 */
  size?: 'sm' | 'md';
  /** 是否可关闭 */
  closable?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
  /** 点击回调 */
  onClick?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式（用于自定义颜色） */
  style?: React.CSSProperties;
}

const colorStyles = {
  default: 'bg-muted text-muted-foreground border-border',
  primary: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  error: 'bg-destructive/10 text-destructive border-destructive/20',
  info: 'bg-primary/10 text-primary border-primary/20',
};

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
};

export const Tag: React.FC<TagProps> = ({
  children,
  color = 'default',
  size = 'md',
  closable = false,
  onClose,
  onClick,
  className,
  style,
}) => {
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose?.();
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-md border',
        'transition-colors',
        colorStyles[color],
        sizeStyles[size],
        onClick && 'cursor-pointer hover:opacity-80',
        className
      )}
      style={style}
      onClick={onClick}
    >
      {children}
      {closable && (
        <button
          onClick={handleClose}
          className="rounded-sm hover:bg-foreground/10 transition-colors"
        >
          <XMarkIcon className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};
Tag.displayName = 'Tag';
