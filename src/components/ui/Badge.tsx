import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
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
    >
      {children}
    </span>
  );
};

interface StatusBadgeProps {
  statusId: string;
  statusName: string;
  statusColor?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ statusId, statusName, statusColor }) => {
  // Map status IDs to variants
  const getVariant = (): BadgeProps['variant'] => {
    if (statusId.includes('success')) return 'success';
    if (statusId.includes('failed') || statusId.includes('error')) return 'error';
    if (statusId.includes('warning')) return 'warning';
    if (statusId.includes('running') || statusId.includes('queued')) return 'info';
    return 'default';
  };

  return (
    <Badge variant={getVariant()} className={statusColor}>
      {statusName}
    </Badge>
  );
};
