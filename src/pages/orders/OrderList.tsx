import React, { useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores';
import { RESOURCES } from '@/locales';
import { Button, Card, Badge, StatusBadge } from '@/components/ui';
import { ArrowRight, Beaker } from 'lucide-react';
import { useStatusDefs } from '@/features/config/queries/useCompositeConfigs';
import { useProjects, useSimTypes } from '@/features/config/queries';
import { useOrders } from '@/features/orders/queries';
import { DataTable } from '@/components/tables/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import type { OrderListItem } from '@/types/order';

const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useUIStore();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // 配置数据
  const { data: statusDefs, isLoading: statusDefsLoading } = useStatusDefs();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: simTypes = [], isLoading: simTypesLoading } = useSimTypes();

  // 订单数据
  const {
    data: ordersPage,
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useOrders({ page, pageSize });

  const orders = ordersPage?.items ?? [];
  const total = ordersPage?.total ?? 0;
  const totalPages = ordersPage?.totalPages ?? 1;

  const t = useCallback((key: string) => RESOURCES[language]?.[key] ?? key, [language]);
  const tableLoading = ordersLoading || projectsLoading || simTypesLoading || statusDefsLoading;

  // 数据映射
  const projectMap = useMemo(
    () => new Map(projects.map(project => [project.id, project])),
    [projects]
  );
  const simTypeMap = useMemo(
    () => new Map(simTypes.map(simType => [simType.id, simType])),
    [simTypes]
  );

  const getStatusBadge = useCallback(
    (statusId: number) => {
      const config = statusDefs?.find(
        status => status.id === statusId || Number(status.code) === statusId
      );
      if (!config) {
        return <Badge variant="default">未知状态</Badge>;
      }
      return (
        <StatusBadge
          statusCode={config.code}
          statusName={config.name}
          statusColor={config.colorTag}
          statusIcon={config.icon}
        />
      );
    },
    [statusDefs]
  );

  const calculateProgress = (order: OrderListItem) => {
    const progress = order.progress ?? 0;
    return Math.min(Math.max(progress, 0), 100);
  };

  const formatCreatedAt = (timestamp?: number) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const columns = useMemo<ColumnDef<OrderListItem>[]>(
    () => [
      {
        header: t('orders.col.id'),
        accessorKey: 'orderNo',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-slate-500">
            {row.original.orderNo || row.original.id}
          </span>
        ),
      },
      {
        header: t('orders.col.project'),
        accessorKey: 'projectId',
        cell: ({ row }) => {
          const project = projectMap.get(row.original.projectId);
          return (
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">
                {project?.name || `#${row.original.projectId}`}
              </div>
            </div>
          );
        },
      },
      {
        header: t('orders.col.sim_types'),
        accessorKey: 'simTypeIds',
        cell: ({ row }) => (
          <div className="flex gap-1 flex-wrap">
            {(row.original.simTypeIds || []).map(simTypeId => (
              <Badge key={simTypeId} size="sm">
                {simTypeMap.get(simTypeId)?.name || `#${simTypeId}`}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        header: t('orders.col.status'),
        accessorKey: 'status',
        cell: ({ row }) => getStatusBadge(row.original.status),
      },
      {
        header: t('orders.col.progress'),
        accessorKey: 'progress',
        cell: ({ row }) => {
          const progress = calculateProgress(row.original);
          return (
            <div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 max-w-[100px]">
                <div
                  className="h-1.5 rounded-full bg-brand-500 transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 mt-1 block">{progress}%</span>
            </div>
          );
        },
      },
      {
        header: t('orders.col.created_at'),
        accessorKey: 'createdAt',
        cell: ({ row }) => (
          <span className="text-xs text-slate-500">{formatCreatedAt(row.original.createdAt)}</span>
        ),
      },
      {
        header: t('orders.col.action'),
        accessorKey: 'id',
        cell: ({ row }) => (
          <div className="flex justify-end">
            <button
              onClick={() => navigate(`/results/${row.original.id}`)}
              className="text-brand-600 hover:text-brand-700 font-medium text-sm flex items-center gap-1"
            >
              {t('orders.view_results')} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [navigate, t, projectMap, simTypeMap, getStatusBadge]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {t('orders.title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t('orders.subtitle')}</p>
        </div>
        <Button onClick={() => navigate('/create')} icon={<Beaker className="w-5 h-5" />}>
          {t('orders.new_order')}
        </Button>
      </div>

      {/* Orders Table */}
      <Card padding="none">
        {ordersError && (
          <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-slate-200 bg-red-50 text-red-700">
            <span className="text-sm">{t('orders.load_error')}</span>
            <Button size="sm" variant="outline" onClick={() => refetchOrders()}>
              {t('common.retry')}
            </Button>
          </div>
        )}
        <DataTable
          data={orders}
          columns={columns}
          containerHeight={600}
          enableSorting={true}
          showCount={true}
          loading={tableLoading}
          emptyText={t('orders.empty')}
          className="border-none"
          wrapperClassName="p-4"
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <span className="text-sm text-slate-500">
              {t('orders.total_count').replace('{count}', String(total))}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                {t('common.prev')}
              </Button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {page} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                {t('common.next')}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default OrderList;
