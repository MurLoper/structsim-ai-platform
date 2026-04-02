import React, { memo, useCallback } from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui';
import type { OrdersQueryParams } from '@/api/orders';
import OrderFilterSelect from './OrderFilterSelect';

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
  users: FilterOption[];
  t: (key: string) => string;
}

const OrderFilters: React.FC<OrderFiltersProps> = memo(
  ({ filters, onFilterChange, projects, simTypes, statusOptions, users, t }) => {
    const handleChange = useCallback(
      (key: keyof OrdersQueryParams, value: string | number | undefined) => {
        const nextFilters = { ...filters, [key]: value === '' ? undefined : value, page: 1 };
        onFilterChange(nextFilters);
      },
      [filters, onFilterChange]
    );

    const handleReset = useCallback(() => {
      onFilterChange({ page: 1, pageSize: filters.pageSize });
    }, [filters.pageSize, onFilterChange]);

    const hasFilters = !!(
      filters.orderNo ||
      filters.domainAccount ||
      filters.remark ||
      filters.status !== undefined ||
      filters.projectId ||
      filters.simTypeId
    );

    return (
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 eyecare:border-border eyecare:bg-card">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] max-w-[260px] flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400 eyecare:text-muted-foreground">
              {t('orders.filters.order_no')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t('orders.filters.order_no_placeholder')}
                value={filters.orderNo || ''}
                onChange={event => handleChange('orderNo', event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 eyecare:border-border eyecare:bg-background eyecare:text-foreground"
              />
              {filters.orderNo && (
                <button
                  type="button"
                  onClick={() => handleChange('orderNo', undefined)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-600 eyecare:hover:bg-muted"
                >
                  <X className="h-3 w-3 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          <div className="min-w-[180px]">
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400 eyecare:text-muted-foreground">
              {t('orders.filters.applicant')}
            </label>
            <OrderFilterSelect
              value={filters.domainAccount}
              options={users}
              allLabel={t('orders.filters.applicant_all')}
              placeholder={t('orders.filters.applicant')}
              onChange={value => handleChange('domainAccount', value as string | undefined)}
            />
          </div>

          <div className="min-w-[220px] max-w-[320px] flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400 eyecare:text-muted-foreground">
              {t('orders.filters.remark')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t('orders.filters.remark_placeholder')}
                value={filters.remark || ''}
                onChange={event => handleChange('remark', event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 eyecare:border-border eyecare:bg-background eyecare:text-foreground"
              />
              {filters.remark && (
                <button
                  type="button"
                  onClick={() => handleChange('remark', undefined)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-600 eyecare:hover:bg-muted"
                >
                  <X className="h-3 w-3 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400 eyecare:text-muted-foreground">
              {t('orders.filters.status')}
            </label>
            <OrderFilterSelect
              value={filters.status}
              options={statusOptions}
              allLabel={t('orders.filters.status_all')}
              placeholder={t('orders.filters.status')}
              disabled={statusOptions.length === 0}
              onChange={value =>
                handleChange('status', value !== undefined ? Number(value) : undefined)
              }
            />
          </div>

          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400 eyecare:text-muted-foreground">
              {t('orders.filters.project')}
            </label>
            <OrderFilterSelect
              value={filters.projectId}
              options={projects}
              allLabel={t('orders.filters.project_all')}
              placeholder={t('orders.filters.project')}
              disabled={projects.length === 0}
              onChange={value =>
                handleChange('projectId', value !== undefined ? Number(value) : undefined)
              }
            />
          </div>

          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400 eyecare:text-muted-foreground">
              {t('orders.filters.sim_type')}
            </label>
            <OrderFilterSelect
              value={filters.simTypeId}
              options={simTypes}
              allLabel={t('orders.filters.sim_type_all')}
              placeholder={t('orders.filters.sim_type')}
              disabled={simTypes.length === 0}
              onChange={value =>
                handleChange('simTypeId', value !== undefined ? Number(value) : undefined)
              }
            />
          </div>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              icon={<RotateCcw className="h-4 w-4" />}
              className="text-slate-500 hover:text-slate-700"
            >
              {t('orders.filters.reset')}
            </Button>
          )}
        </div>
      </div>
    );
  }
);

OrderFilters.displayName = 'OrderFilters';

export default OrderFilters;
