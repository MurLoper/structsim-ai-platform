import React from 'react';
import clsx from 'clsx';
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  PauseCircle,
  PlayCircle,
  Ban,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  style,
}) => {
  const variants = {
    default:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
    success:
      'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    warning:
      'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
    error:
      'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    info: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full border',
        variants[variant],
        sizes[size],
        className
      )}
      style={style}
    >
      {children}
    </span>
  );
};

// 状态图标映射表
const STATUS_ICON_MAP: Record<string, LucideIcon> = {
  // 成功类
  COMPLETED: CheckCircle,
  PARTIAL_COMPLETED: CheckCircle,
  SUCCESS: CheckCircle,
  DONE: CheckCircle,
  // 失败类
  FAILED: XCircle,
  ERROR: XCircle,
  // 运行类
  RUNNING: Loader2,
  STARTING: PlayCircle,
  PROCESSING: Loader2,
  // 等待类
  PENDING: Clock,
  QUEUED: Clock,
  WAITING: Clock,
  DRAFT: Clock,
  // 暂停/取消类
  PAUSED: PauseCircle,
  CANCELLED: Ban,
  STOPPED: Ban,
  // 警告类
  WARNING: AlertCircle,
  TIMEOUT: AlertCircle,
};

/**
 * 根据状态代码获取对应的图标组件
 */
export const getStatusIcon = (code: string): LucideIcon => {
  const upperCode = code?.toUpperCase() || '';
  return STATUS_ICON_MAP[upperCode] || HelpCircle;
};

/**
 * 根据颜色值生成浅色背景
 */
const getLightBackground = (color: string): string => {
  // 如果是十六进制颜色，转换为带透明度的背景
  if (color.startsWith('#')) {
    return `${color}15`; // 15 是十六进制的透明度约 8%
  }
  return 'transparent';
};

interface StatusBadgeProps {
  statusId?: string;
  statusCode?: string;
  statusName: string;
  statusColor?: string;
  statusIcon?: string;
  showIcon?: boolean;
}

/**
 * 状态徽章组件
 * 颜色应用于文字和图标，背景使用浅色
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  statusId,
  statusCode,
  statusName,
  statusColor,
  statusIcon,
  showIcon = true,
}) => {
  // 获取图标组件
  const code = statusCode || statusId || '';
  const IconComponent = getStatusIcon(code);
  const isSpinning = code.toUpperCase() === 'RUNNING' || code.toUpperCase() === 'PROCESSING';

  // 如果有自定义颜色，使用自定义样式
  if (statusColor) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border"
        style={{
          color: statusColor,
          borderColor: statusColor,
          backgroundColor: getLightBackground(statusColor),
        }}
      >
        {showIcon &&
          (statusIcon ? (
            <span className="text-sm">{statusIcon}</span>
          ) : (
            <IconComponent className={clsx('w-3.5 h-3.5', isSpinning && 'animate-spin')} />
          ))}
        {statusName}
      </span>
    );
  }

  // 没有自定义颜色时，根据状态代码确定样式
  const getVariant = (): BadgeProps['variant'] => {
    const upperCode = code.toUpperCase();
    if (['COMPLETED', 'PARTIAL_COMPLETED', 'SUCCESS', 'DONE'].includes(upperCode)) return 'success';
    if (['FAILED', 'ERROR'].includes(upperCode)) return 'error';
    if (['WARNING', 'TIMEOUT'].includes(upperCode)) return 'warning';
    if (['RUNNING', 'STARTING', 'PROCESSING', 'QUEUED'].includes(upperCode)) return 'info';
    return 'default';
  };

  return (
    <Badge variant={getVariant()}>
      {showIcon &&
        (statusIcon ? (
          <span className="text-sm mr-1">{statusIcon}</span>
        ) : (
          <IconComponent className={clsx('w-3.5 h-3.5 mr-1', isSpinning && 'animate-spin')} />
        ))}
      {statusName}
    </Badge>
  );
};
