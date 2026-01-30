import React, { memo, useCallback } from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui';
import type { OrdersQueryParams } from '@/api/orders';

export interface FilterOption {
  value: number | string;
  label: string;
}

export interface OrderFiltersProps {
  filters: OrdersQueryParams;
  onFilterChange: (filters: OrdersQueryParams) => void;
  projects: FilterOption[];
  simTypes: FilterOption[];
  statusOptions: FilterOption[];
}

const OrderFilters: React.FC<OrderFiltersProps> = memo(
  ({ filters, onFilterChange, projects, simTypes, statusOptions }) => {
    const handleChange = useCallback(
      (key: keyof OrdersQueryParams, value: string | number | undefined) => {
        const newFilters = { ...filters, [key]: value || undefined, page: 1 };
        onFilterChange(newFilters);
      },
      [filters, onFilterChange]
    );

    const handleReset = useCallback(() => {
      onFilterChange({ page: 1, pageSize: filters.pageSize });
    }, [filters.pageSize, onFilterChange]);

    const hasFilters = !!(
      filters.orderNo ||
      filters.status ||
      filters.projectId ||
      filters.simTypeId
    );

    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* 订单编号搜索 */}
          <div className="flex-1 min-w-[200px] max-w-[280px]">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              订单编号
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索订单编号..."
                value={filters.orderNo || ''}
                onChange={e => handleChange('orderNo', e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg
                bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
                focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
              {filters.orderNo && (
                <button
                  onClick={() => handleChange('orderNo', undefined)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* 状态筛选 */}
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              状态
            </label>
            <select
              value={filters.status || ''}
              onChange={e =>
                handleChange('status', e.target.value ? Number(e.target.value) : undefined)
              }
              disabled={statusOptions.length === 0}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg
              bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
              focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">全部状态</option>
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 项目筛选 */}
          <div className="min-w-[160px]">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              项目
            </label>
            <select
              value={filters.projectId || ''}
              onChange={e =>
                handleChange('projectId', e.target.value ? Number(e.target.value) : undefined)
              }
              disabled={projects.length === 0}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg
              bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
              focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">全部项目</option>
              {projects.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 仿真类型筛选 */}
          <div className="min-w-[160px]">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              仿真类型
            </label>
            <select
              value={filters.simTypeId || ''}
              onChange={e =>
                handleChange('simTypeId', e.target.value ? Number(e.target.value) : undefined)
              }
              disabled={simTypes.length === 0}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg
              bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
              focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">全部类型</option>
              {simTypes.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 重置按钮 */}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              icon={<RotateCcw className="w-4 h-4" />}
              className="text-slate-500 hover:text-slate-700"
            >
              重置
            </Button>
          )}
        </div>
      </div>
    );
  }
);

OrderFilters.displayName = 'OrderFilters';

export default OrderFilters;
