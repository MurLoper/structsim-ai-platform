import type { OrderConditionRoundColumn } from '@/api/results';

export const CONDITION_RESULT_STATUS_MAP: Record<
  number,
  { label: string; variant: 'default' | 'success' | 'warning' | 'error' }
> = {
  0: { label: '待运行', variant: 'default' },
  1: { label: '运行中', variant: 'warning' },
  2: { label: '已完成', variant: 'success' },
  3: { label: '失败', variant: 'error' },
};

export const CONDITION_RESULT_PAGE_SIZE_OPTIONS = [
  { value: '500', label: '500 / 页' },
  { value: '2000', label: '2000 / 页' },
  { value: '5000', label: '5000 / 页' },
  { value: '20000', label: '20000 / 页' },
];

export const getConditionResultColumnLabel = (column: OrderConditionRoundColumn) => {
  if (column.label) {
    return column.label;
  }
  const fallback = column.key.split('.').pop();
  return fallback || column.key;
};

export const formatConditionResultNumber = (value: unknown, digits = 4) => {
  if (value === undefined || value === null) {
    return '-';
  }
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(digits) : String(value);
};
