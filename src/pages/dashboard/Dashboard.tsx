import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores';
import { RESOURCES } from '@/locales';
import { Button, Card, Badge } from '@/components/ui';
import { ArrowRightIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { useStatusDefs } from '@/features/config/queries/useCompositeConfigs';
import { useProjects, useSimTypes } from '@/features/config/queries';
import { useOrders } from '@/features/orders/queries';
import { DataTable } from '@/components/tables/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import type { OrderListItem } from '@/types/order';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useUIStore();
  const {
    data: statusDefs,
    error: statusDefsError,
    isLoading: statusDefsLoading,
    refetch: refetchStatusDefs,
  } = useStatusDefs();
  const {
    data: projects = [],
    error: projectsError,
    isLoading: projectsLoading,
    refetch: refetchProjects,
  } = useProjects();
  const {
    data: simTypes = [],
    error: simTypesError,
    isLoading: simTypesLoading,
    refetch: refetchSimTypes,
  } = useSimTypes();
  const {
    data: ordersPage,
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useOrders({ page: 1, pageSize: 20 });
  const orders = ordersPage?.items || [];
  const t = (key: string) => RESOURCES[language][key] || key;
  const emptyText = RESOURCES[language]['dash.empty'] || '暂无订单';
  const hasLoadError = Boolean(ordersError || projectsError || simTypesError || statusDefsError);
  const tableLoading = ordersLoading || projectsLoading || simTypesLoading || statusDefsLoading;
  const handleRetry = () => {
    void refetchOrders();
    void refetchProjects();
    void refetchSimTypes();
    void refetchStatusDefs();
  };

  const projectMap = useMemo(
    () => new Map(projects.map(project => [project.id, project])),
    [projects]
  );
  const simTypeMap = useMemo(
    () => new Map(simTypes.map(simType => [simType.id, simType])),
    [simTypes]
  );

  const getStatusBadge = (statusId: number) => {
    const config = statusDefs?.find(
      status => String(status.id) === String(statusId) || status.code === String(statusId)
    );
    const statusCode = config?.code || String(statusId);
    const variant = statusCode.includes('success')
      ? 'success'
      : statusCode.includes('failed')
        ? 'error'
        : statusCode.includes('running')
          ? 'info'
          : 'default';

    return <Badge variant={variant}>{config?.name || statusCode}</Badge>;
  };

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
        header: t('dash.col.id'),
        accessorKey: 'orderNo',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-slate-500">
            {row.original.orderNo || row.original.id}
          </span>
        ),
      },
      {
        header: t('dash.col.name'),
        accessorKey: 'projectId',
        cell: ({ row }) => {
          const project = projectMap.get(row.original.projectId);
          return (
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">
                {project?.name || `#${row.original.projectId}`}
              </div>
              <div className="text-xs text-slate-500">{row.original.projectId}</div>
            </div>
          );
        },
      },
      {
        header: t('dash.col.types'),
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
        header: t('dash.col.status'),
        accessorKey: 'status',
        cell: ({ row }) => getStatusBadge(row.original.status),
      },
      {
        header: t('dash.col.progress'),
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
        header: t('dash.col.submitted_at'),
        accessorKey: 'createdAt',
        cell: ({ row }) => (
          <span className="text-xs text-slate-500">{formatCreatedAt(row.original.createdAt)}</span>
        ),
      },
      {
        header: t('dash.col.action'),
        accessorKey: 'id',
        cell: ({ row }) => (
          <div className="flex justify-end">
            <button
              onClick={() => navigate(`/results/${row.original.id}`)}
              className="text-brand-600 hover:text-brand-700 font-medium text-sm flex items-center gap-1"
            >
              {t('dash.view_results')} <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [navigate, t, projectMap, simTypeMap, statusDefs]
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {t('dash.title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">{t('dash.subtitle')}</p>
        </div>
        <Button onClick={() => navigate('/create')} icon={<BeakerIcon className="w-5 h-5" />}>
          {t('dash.new_sim')}
        </Button>
      </div>

      <Card padding="none">
        {hasLoadError && (
          <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-slate-200 bg-red-50 text-red-700">
            <span className="text-sm">订单或配置数据加载失败，请重试。</span>
            <Button size="sm" variant="outline" onClick={handleRetry}>重试</Button>
          </div>
        )}
        <DataTable
          data={orders}
          columns={columns}
          containerHeight={480}
          enableSorting={false}
          showCount={false}
          loading={tableLoading}
          emptyText={emptyText}
          className="border-none"
          wrapperClassName="p-4"
        />
      </Card>
    </div>
  );
};

export default Dashboard;
