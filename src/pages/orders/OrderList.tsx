import React, { useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores';
import { RESOURCES } from '@/locales';
import { Button, Card, Badge, StatusBadge } from '@/components/ui';
import { ArrowRight, Beaker, Pencil } from 'lucide-react';
import { useStatusDefs } from '@/features/config/queries/useCompositeConfigs';
import { useProjects, useSimTypes } from '@/features/config/queries';
import { useOrders } from '@/features/orders/queries';
import { DataTable } from '@/components/tables/DataTable';
import OrderFilters from './components/OrderFilters';
import Pagination from '@/components/ui/Pagination';
import type { ColumnDef } from '@tanstack/react-table';
import type { OrderListItem } from '@/types/order';
import type { OrdersQueryParams } from '@/api/orders';

interface OrderListProps {
  onOpenResult?: (orderId: number) => void;
  onOpenEdit?: (orderId: number) => void;
  onCreate?: () => void;
}

const OrderList: React.FC<OrderListProps> = ({ onOpenResult, onOpenEdit, onCreate }) => {
  const navigate = useNavigate();
  const { language } = useUIStore();

  // 筛选状态
  const [filters, setFilters] = useState<OrdersQueryParams>({
    page: 1,
    pageSize: 20,
  });

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
  } = useOrders(filters);

  const orders = ordersPage?.items ?? [];
  const total = ordersPage?.total ?? 0;
  const totalPages = ordersPage?.totalPages ?? 1;
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;

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

  // 筛选选项
  const projectOptions = useMemo(
    () => projects.map(p => ({ value: p.id, label: p.name })),
    [projects]
  );
  const simTypeOptions = useMemo(
    () => simTypes.map(s => ({ value: s.id, label: s.name })),
    [simTypes]
  );
  const statusOptions = useMemo(() => {
    if (!statusDefs || statusDefs.length === 0) {
      return [
        { value: 0, label: '未开始' },
        { value: 1, label: '运行中' },
        { value: 2, label: '已完成' },
        { value: 3, label: '失败' },
      ];
    }
    return statusDefs.map(s => ({
      value: s.id,
      label: s.name,
    }));
  }, [statusDefs]);

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

  // 筛选变更
  const handleFilterChange = useCallback((newFilters: OrdersQueryParams) => {
    setFilters(newFilters);
  }, []);

  // 分页变更
  const handlePageChange = useCallback((newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setFilters(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  }, []);

  const columns = useMemo<ColumnDef<OrderListItem>[]>(
    () => [
      {
        header: t('orders.col.id'),
        accessorKey: 'orderNo',
        cell: ({ row }) => (
          <button
            onClick={() => {
              if (onOpenResult) onOpenResult(row.original.id);
              else window.open(`/#/results/${row.original.id}`, '_blank');
            }}
            className="font-mono text-xs text-brand-600 hover:text-brand-700 hover:underline transition-colors text-left"
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
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100 eyecare:text-foreground">
                {project?.name || `#${row.original.projectId}`}
              </div>
            </div>
          );
        },
      },
      {
        header: t('orders.col.sim_types'),
        accessorKey: 'simTypeIds',
        cell: ({ row }) => {
          // 优先使用 conditionSummary（姿态→仿真类型映射）
          const summary = row.original.conditionSummary;
          if (summary && Object.keys(summary).length > 0) {
            return (
              <div className="flex flex-col gap-0.5">
                {Object.entries(summary).map(([foldName, simNames]) => (
                  <div key={foldName} className="flex items-center gap-1 flex-wrap">
                    <span className="text-xs text-slate-400 eyecare:text-muted-foreground shrink-0">
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
          // 降级：仅显示仿真类型
          return (
            <div className="flex gap-1 flex-wrap">
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
              <div className="w-full bg-slate-200 dark:bg-slate-700 eyecare:bg-muted rounded-full h-1.5 max-w-[100px]">
                <div
                  className="h-1.5 rounded-full bg-brand-500 transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 eyecare:text-muted-foreground mt-1 block">
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
              onClick={() => {
                if (onOpenEdit) onOpenEdit(row.original.id);
                else navigate(`/create?orderId=${row.original.id}`);
              }}
              className="text-slate-600 hover:text-slate-700 dark:text-slate-400 eyecare:text-muted-foreground dark:hover:text-slate-300 font-medium text-sm flex items-center gap-1 px-2 py-1 rounded transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t('common.edit')} <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (onOpenResult) onOpenResult(row.original.id);
                else window.open(`/#/results/${row.original.id}`, '_blank');
              }}
              className="text-brand-600 hover:text-brand-700 font-medium text-sm flex items-center gap-1 px-2 py-1 rounded transition-colors hover:bg-brand-50 dark:hover:bg-brand-500/10"
            >
              {t('orders.view_results')} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [navigate, onOpenEdit, onOpenResult, t, projectMap, simTypeMap, getStatusBadge]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white eyecare:text-foreground mb-1">
            {t('orders.title')}
          </h1>
          <p className="text-slate-500 eyecare:text-muted-foreground dark:text-slate-400 eyecare:text-muted-foreground eyecare:text-muted-foreground text-sm">
            {t('orders.subtitle')}
          </p>
        </div>
        <Button
          onClick={() => {
            if (onCreate) onCreate();
            else navigate('/create');
          }}
          icon={<Beaker className="w-5 h-5" />}
        >
          {t('orders.new_order')}
        </Button>
      </div>

      {/* Filters */}
      <OrderFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        projects={projectOptions}
        simTypes={simTypeOptions}
        statusOptions={statusOptions}
      />

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
