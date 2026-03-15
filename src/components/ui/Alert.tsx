/**
 * Alert - 提示横幅组件
 *
 * 类似 Element UI 的 el-alert / Ant Design 的 Alert
 * 用于页面内的提示信息、警告、错误等
 *
 * @example
 * ```tsx
 * <Alert type="info" title="提示" description="请先完成基本配置" />
 * <Alert type="warning" closable onClose={() => {}}>注意事项内容</Alert>
 * <Alert type="success">操作成功</Alert>
 * ```
 */
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export interface AlertProps {
  /** 提示类型 */
  type?: 'info' | 'success' | 'warning' | 'error';
  /** 标题 */
  title?: string;
  /** 描述（与children二选一） */
  description?: string;
  /** 内容 */
  children?: React.ReactNode;
  /** 是否可关闭 */
  closable?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
  /** 自定义图标 */
  icon?: React.ReactNode;
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 容器类名 */
  className?: string;
}

const typeConfig = {
  info: {
    bg: 'bg-primary/5 border-primary/20',
    icon: InformationCircleIcon,
    iconColor: 'text-primary',
  },
  success: {
    bg: 'bg-success/5 border-success/20',
    icon: CheckCircleIcon,
    iconColor: 'text-success',
  },
  warning: {
    bg: 'bg-warning/5 border-warning/20',
    icon: ExclamationTriangleIcon,
    iconColor: 'text-warning',
  },
  error: {
    bg: 'bg-destructive/5 border-destructive/20',
    icon: XCircleIcon,
    iconColor: 'text-destructive',
  },
};

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  description,
  children,
  closable = false,
  onClose,
  icon,
  showIcon = true,
  className,
}) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const config = typeConfig[type];
  const IconComp = config.icon;

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  return (
    <div className={cn('flex gap-3 rounded-lg border p-4', config.bg, className)} role="alert">
      {showIcon && (
        <div className="shrink-0 pt-0.5">
          {icon || <IconComp className={cn('w-5 h-5', config.iconColor)} />}
        </div>
      )}
      <div className="flex-1 min-w-0">
        {title && <h5 className="text-sm font-semibold text-foreground mb-1">{title}</h5>}
        <div className="text-sm text-muted-foreground">{description || children}</div>
      </div>
      {closable && (
        <button
          onClick={handleClose}
          className="shrink-0 p-0.5 rounded hover:bg-muted/50 transition-colors"
        >
          <XMarkIcon className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
};
Alert.displayName = 'Alert';
