import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowRight, Beaker, Pencil } from 'lucide-react';
import { Button, Card, Badge, StatusBadge, useToast } from '@/components/ui';
import { DataTable } from '@/components/tables/DataTable';
import Pagination from '@/components/ui/Pagination';
import { RESOURCES } from '@/locales';
import { useUIStore } from '@/stores';
import { useProjects, useSimTypes } from '@/features/config/queries';
import { useStatusDefs } from '@/features/config/queries/useCompositeConfigs';
import { useOrderUsers, useOrders } from '@/features/orders/queries';
import type { OrdersQueryParams } from '@/api/orders';
import type { OrderListItem } from '@/types/order';
import type { User } from '@/types';
import {
  trackOrdersEditOpen,
  trackOrdersFilterApply,
  trackOrdersPageChange,
  trackOrdersPageSizeChange,
} from '@/features/platform/tracking/domains/ordersTracking';
import { getOrderUserDisplayName } from '@/features/orders/utils/orderUsers';
import OrderFilters from './components/OrderFilters';
import { useOrderRowInteractions } from './hooks/useOrderRowInteractions';

interface OrderListProps {
  onOpenResult?: (orderId: number) => void;
  onOpenEdit?: (orderId: number) => void;
  onCreate?: () => void;
}

const OrderList: React.FC<OrderListProps> = ({ onOpenResult, onOpenEdit, onCreate }) => {
  const navigate = useNavigate();
  const { language } = useUIStore();
  const { showToast } = useToast();
  const [filters, setFilters] = useState<OrdersQueryParams>({
    page: 1,
    pageSize: 20,
  });

  const { data: statusDefs, isLoading: statusDefsLoading } = useStatusDefs();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: simTypes = [], isLoading: simTypesLoading } = useSimTypes();
  const { data: users = [], isLoading: usersLoading } = useOrderUsers();
  const {
    data: ordersPage,
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useOrders(filters);

  const orders = ordersPage?.items ?? [];
  const total = ordersPage?.total ?? 0;
  const totalPages = ordersPage?.totalPages ?? 1;
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;

  const t = useCallback((key: string) => RESOURCES[language]?.[key] ?? key, [language]);
  const tableLoading =
    ordersLoading || projectsLoading || simTypesLoading || statusDefsLoading || usersLoading;

  const projectMap = useMemo(
    () => new Map(projects.map(project => [project.id, project])),
    [projects]
  );
  const simTypeMap = useMemo(
    () => new Map(simTypes.map(simType => [simType.id, simType])),
    [simTypes]
  );
  const userMap = useMemo(
    () => new Map(users.map(user => [(user.domainAccount || '').toLowerCase(), user] as const)),
    [users]
  );

  const projectOptions = useMemo(
    () => projects.map(project => ({ value: project.id, label: project.name })),
    [projects]
  );
  const simTypeOptions = useMemo(
    () => simTypes.map(simType => ({ value: simType.id, label: simType.name })),
    [simTypes]
  );
  const userOptions = useMemo(
    () =>
      users
        .map(user => {
          const identity = user.domainAccount || String(user.id || '');
          if (!identity) return null;
          const displayName = getOrderUserDisplayName(user);
          return {
            value: identity,
            label: displayName,
          };
        })
        .filter((item): item is { value: string; label: string } => item !== null),
    [users]
  );
  const statusOptions = useMemo(() => {
    if (!statusDefs || statusDefs.length === 0) {
      return [
        { value: 0, label: '未开始' },
        { value: 1, label: '进行中' },
        { value: 2, label: '已完成' },
        { value: 3, label: '失败' },
      ];
    }
    return statusDefs.map(status => ({
      value: status.id,
      label: status.name,
    }));
  }, [statusDefs]);

  const getUserDisplay = useCallback(
    (order: OrderListItem): { name: string; identity: string; user?: User } => {
      const identity = order.domainAccount || order.createdBy || '';
      const user = identity ? userMap.get(identity.toLowerCase()) : undefined;
      const name = user ? getOrderUserDisplayName(user) : identity || '-';
      return { name, identity, user };
    },
    [userMap]
  );

  const { openResult, handleRowClick, handleRowDoubleClick } = useOrderRowInteractions({
    onOpenResult,
    showToast,
  });

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
    return new Date(timestamp * 1000).toLocaleString();
  };

  const handleFilterChange = useCallback((nextFilters: OrdersQueryParams) => {
    trackOrdersFilterApply(nextFilters);
    setFilters(nextFilters);
  }, []);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      trackOrdersPageChange(nextPage, pageSize);
      setFilters(prev => ({ ...prev, page: nextPage }));
    },
    [pageSize]
  );

  const handlePageSizeChange = useCallback((nextPageSize: number) => {
    trackOrdersPageSizeChange(nextPageSize);
    setFilters(prev => ({ ...prev, pageSize: nextPageSize, page: 1 }));
  }, []);

  const columns = useMemo<ColumnDef<OrderListItem>[]>(
    () => [
      {
        header: t('orders.col.id'),
        accessorKey: 'orderNo',
        cell: ({ row }) => (
          <button
            onClick={event => {
              event.stopPropagation();
              openResult(row.original.id, 'button');
            }}
            className="text-left font-mono text-xs text-brand-600 transition-colors hover:text-brand-700 hover:underline"
          >
            {row.original.orderNo || row.original.id}
          </button>
        ),
      },
      {
        header: t('orders.col.project'),
        accessorKey: 'projectId',
        cell: ({ row }) => {
          const project = projectMap.get(row.original.projectId);
          return (
            <div className="font-medium text-slate-900 dark:text-slate-100 eyecare:text-foreground">
              {project?.name || `#${row.original.projectId}`}
            </div>
          );
        },
      },
      {
        header: t('orders.col.applicant'),
        accessorKey: 'domainAccount',
        cell: ({ row }) => {
          const { name } = getUserDisplay(row.original);
          return (
            <div className="min-w-[120px]">
              <div className="font-medium text-slate-900 dark:text-slate-100 eyecare:text-foreground">
                {name}
              </div>
            </div>
          );
        },
      },
      {
        header: t('orders.col.sim_types'),
        accessorKey: 'simTypeIds',
        cell: ({ row }) => {
          const summary = row.original.conditionSummary;
          if (summary && Object.keys(summary).length > 0) {
            return (
              <div className="flex flex-col gap-0.5">
                {Object.entries(summary).map(([foldName, simNames]) => (
                  <div key={foldName} className="flex flex-wrap items-center gap-1">
                    <span className="shrink-0 text-xs text-slate-400 eyecare:text-muted-foreground">
                      {foldName}:
                    </span>
                    {simNames.map(name => (
                      <Badge key={name} size="sm">
                        {name}
                      </Badge>
                    ))}
                  </div>
                ))}
              </div>
            );
          }

          return (
            <div className="flex flex-wrap gap-1">
              {(row.original.simTypeIds || []).map(simTypeId => (
                <Badge key={simTypeId} size="sm">
                  {simTypeMap.get(simTypeId)?.name || `#${simTypeId}`}
                </Badge>
              ))}
            </div>
          );
        },
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
              <div className="h-1.5 w-full max-w-[100px] rounded-full bg-slate-200 dark:bg-slate-700 eyecare:bg-muted">
                <div
                  className="h-1.5 rounded-full bg-brand-500 transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="mt-1 block text-xs text-slate-400 eyecare:text-muted-foreground">
                {progress}%
              </span>
            </div>
          );
        },
      },
      {
        header: t('orders.col.created_at'),
        accessorKey: 'createdAt',
        cell: ({ row }) => (
          <span className="text-xs text-slate-500 eyecare:text-muted-foreground">
            {formatCreatedAt(row.original.createdAt)}
          </span>
        ),
      },
      {
        header: t('orders.col.action'),
        accessorKey: 'id',
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <button
              onClick={event => {
                event.stopPropagation();
                trackOrdersEditOpen(row.original.id);
                if (onOpenEdit) onOpenEdit(row.original.id);
                else navigate(`/create?orderId=${row.original.id}`);
              }}
              className="flex items-center gap-1 rounded px-2 py-1 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300 eyecare:text-muted-foreground"
            >
              {t('common.edit')} <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={event => {
                event.stopPropagation();
                openResult(row.original.id, 'button');
              }}
              className="flex items-center gap-1 rounded px-2 py-1 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-500/10"
            >
              {t('orders.view_results')} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [navigate, onOpenEdit, openResult, t, projectMap, simTypeMap, getStatusBadge, getUserDisplay]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-slate-900 dark:text-white eyecare:text-foreground">
            {t('orders.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 eyecare:text-muted-foreground">
            {t('orders.subtitle')}
          </p>
        </div>
        <Button
          onClick={() => {
            if (onCreate) onCreate();
            else navigate('/create');
          }}
          icon={<Beaker className="h-5 w-5" />}
        >
          {t('orders.new_order')}
        </Button>
      </div>

      <OrderFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        projects={projectOptions}
        simTypes={simTypeOptions}
        statusOptions={statusOptions}
        users={userOptions}
        t={t}
      />

      <Card padding="none">
        {ordersError && (
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-red-50 px-4 py-3 text-red-700">
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
          onRowClick={handleRowClick}
          onRowDoubleClick={handleRowDoubleClick}
          showCount={true}
          loading={tableLoading}
          emptyText={t('orders.empty')}
          className="border-none"
          wrapperClassName="p-4"
        />
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          showTotal={true}
          showPageSize={true}
          disabled={ordersLoading}
        />
      </Card>
    </div>
  );
};

export default OrderList;
