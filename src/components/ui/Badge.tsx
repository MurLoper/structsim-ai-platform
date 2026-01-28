/* eslint-disable react-refresh/only-export-components */
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
  CircleDot,
  CircleCheck,
  CircleX,
  CircleAlert,
  CirclePause,
  CirclePlay,
  Timer,
  Hourglass,
  RefreshCw,
  RotateCcw,
  Send,
  FileCheck,
  FileX,
  Zap,
  Activity,
  // 更多图标
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Bookmark,
  Bell,
  BellOff,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Shield,
  ShieldCheck,
  ShieldX,
  Settings,
  Cog,
  Wrench,
  Hammer,
  Package,
  Box,
  Archive,
  Trash2,
  Download,
  Upload,
  Cloud,
  CloudOff,
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  Power,
  PowerOff,
  Cpu,
  Server,
  Database,
  HardDrive,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Globe,
  Map,
  MapPin,
  Navigation,
  Compass,
  Home,
  Building,
  Factory,
  Rocket,
  Plane,
  Car,
  Truck,
  Ship,
  Anchor,
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
    default: 'bg-muted text-muted-foreground border-border',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    error: 'bg-destructive/10 text-destructive border-destructive/20',
    info: 'bg-primary/10 text-primary border-primary/20',
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

// 状态图标映射表（根据状态代码自动匹配）
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

// Lucide 图标名称到组件的映射（用于自定义图标）
export const LUCIDE_ICON_MAP: Record<string, LucideIcon> = {
  // 基础状态图标
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  PauseCircle,
  PlayCircle,
  Ban,
  HelpCircle,
  CircleDot,
  CircleCheck,
  CircleX,
  CircleAlert,
  CirclePause,
  CirclePlay,
  Timer,
  Hourglass,
  RefreshCw,
  RotateCcw,
  Send,
  FileCheck,
  FileX,
  Zap,
  Activity,
  // 常用图标
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Bookmark,
  Bell,
  BellOff,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Shield,
  ShieldCheck,
  ShieldX,
  Settings,
  Cog,
  Wrench,
  Hammer,
  Package,
  Box,
  Archive,
  Trash2,
  Download,
  Upload,
  Cloud,
  CloudOff,
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  Power,
  PowerOff,
  Cpu,
  Server,
  Database,
  HardDrive,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Globe,
  Map,
  MapPin,
  Navigation,
  Compass,
  Home,
  Building,
  Factory,
  Rocket,
  Plane,
  Car,
  Truck,
  Ship,
  Anchor,
};

// 预设图标选项（供状态配置使用）- 常用图标
export const PRESET_LUCIDE_ICONS = [
  { name: 'CheckCircle', label: '成功', icon: CheckCircle },
  { name: 'CircleCheck', label: '完成', icon: CircleCheck },
  { name: 'XCircle', label: '失败', icon: XCircle },
  { name: 'CircleX', label: '错误', icon: CircleX },
  { name: 'Clock', label: '等待', icon: Clock },
  { name: 'Timer', label: '计时', icon: Timer },
  { name: 'Hourglass', label: '进行中', icon: Hourglass },
  { name: 'Loader2', label: '加载', icon: Loader2 },
  { name: 'RefreshCw', label: '刷新', icon: RefreshCw },
  { name: 'PlayCircle', label: '开始', icon: PlayCircle },
  { name: 'PauseCircle', label: '暂停', icon: PauseCircle },
  { name: 'AlertCircle', label: '警告', icon: AlertCircle },
  { name: 'Ban', label: '取消', icon: Ban },
  { name: 'Send', label: '提交', icon: Send },
  { name: 'Zap', label: '快速', icon: Zap },
  { name: 'Activity', label: '活动', icon: Activity },
  { name: 'CircleDot', label: '默认', icon: CircleDot },
  { name: 'HelpCircle', label: '未知', icon: HelpCircle },
];

// 扩展图标选项（更多图标）
export const EXTENDED_LUCIDE_ICONS = [
  { name: 'Star', label: '星标', icon: Star },
  { name: 'Heart', label: '收藏', icon: Heart },
  { name: 'ThumbsUp', label: '点赞', icon: ThumbsUp },
  { name: 'ThumbsDown', label: '踩', icon: ThumbsDown },
  { name: 'Flag', label: '标记', icon: Flag },
  { name: 'Bookmark', label: '书签', icon: Bookmark },
  { name: 'Bell', label: '通知', icon: Bell },
  { name: 'Eye', label: '可见', icon: Eye },
  { name: 'EyeOff', label: '隐藏', icon: EyeOff },
  { name: 'Lock', label: '锁定', icon: Lock },
  { name: 'Unlock', label: '解锁', icon: Unlock },
  { name: 'Shield', label: '保护', icon: Shield },
  { name: 'ShieldCheck', label: '安全', icon: ShieldCheck },
  { name: 'Settings', label: '设置', icon: Settings },
  { name: 'Wrench', label: '工具', icon: Wrench },
  { name: 'Package', label: '包裹', icon: Package },
  { name: 'Archive', label: '归档', icon: Archive },
  { name: 'Download', label: '下载', icon: Download },
  { name: 'Upload', label: '上传', icon: Upload },
  { name: 'Cloud', label: '云端', icon: Cloud },
  { name: 'Database', label: '数据库', icon: Database },
  { name: 'Server', label: '服务器', icon: Server },
  { name: 'Cpu', label: 'CPU', icon: Cpu },
  { name: 'Globe', label: '全球', icon: Globe },
  { name: 'Home', label: '首页', icon: Home },
  { name: 'Rocket', label: '火箭', icon: Rocket },
  { name: 'FileCheck', label: '文件通过', icon: FileCheck },
  { name: 'FileX', label: '文件失败', icon: FileX },
  { name: 'RotateCcw', label: '重试', icon: RotateCcw },
  { name: 'CirclePlay', label: '运行', icon: CirclePlay },
  { name: 'CirclePause', label: '挂起', icon: CirclePause },
  { name: 'CircleAlert', label: '注意', icon: CircleAlert },
];

/**
 * 根据状态代码获取对应的图标组件
 */
export const getStatusIcon = (code: string): LucideIcon => {
  const upperCode = code?.toUpperCase() || '';
  return STATUS_ICON_MAP[upperCode] || HelpCircle;
};

/**
 * 根据图标名称获取 Lucide 图标组件
 * @param iconName 图标名称（如 "CheckCircle"）
 * @returns 图标组件，未找到返回 null
 */
export const getLucideIconByName = (iconName: string): LucideIcon | null => {
  return LUCIDE_ICON_MAP[iconName] || null;
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

/**
 * 渲染图标（支持 Lucide 图标名称和 emoji）
 */
const renderIcon = (
  statusIcon: string | undefined,
  DefaultIcon: LucideIcon,
  isSpinning: boolean,
  className?: string
) => {
  if (!statusIcon) {
    return (
      <DefaultIcon className={clsx(className || 'w-3.5 h-3.5', isSpinning && 'animate-spin')} />
    );
  }

  // 检查是否是 Lucide 图标名称
  const LucideIcon = getLucideIconByName(statusIcon);
  if (LucideIcon) {
    const shouldSpin = isSpinning || statusIcon === 'Loader2' || statusIcon === 'RefreshCw';
    return (
      <LucideIcon className={clsx(className || 'w-3.5 h-3.5', shouldSpin && 'animate-spin')} />
    );
  }

  // 否则当作 emoji 或文字渲染
  return <span className="text-sm">{statusIcon}</span>;
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
 * 支持 Lucide 图标名称（如 "CheckCircle"）或 emoji 字符
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
  const DefaultIconComponent = getStatusIcon(code);
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
        {showIcon && renderIcon(statusIcon, DefaultIconComponent, isSpinning)}
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
      {showIcon && renderIcon(statusIcon, DefaultIconComponent, isSpinning, 'w-3.5 h-3.5 mr-1')}
      {statusName}
    </Badge>
  );
};
