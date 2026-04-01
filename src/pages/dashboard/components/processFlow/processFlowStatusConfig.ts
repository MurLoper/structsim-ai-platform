import { CheckCircle, Clock, Loader2, XCircle } from 'lucide-react';

export const PROCESS_FLOW_STATUS_CONFIG: Record<
  number,
  { label: string; variant: 'default' | 'success' | 'warning' | 'error'; icon: React.ElementType }
> = {
  0: { label: '待运行', variant: 'default', icon: Clock },
  1: { label: '运行中', variant: 'warning', icon: Loader2 },
  2: { label: '已完成', variant: 'success', icon: CheckCircle },
  3: { label: '失败', variant: 'error', icon: XCircle },
};
