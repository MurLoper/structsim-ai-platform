import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores';
import { RESOURCES } from '@/locales';
import { Button, Card, Badge } from '@/components/ui';
import { StatCard } from '@/components/dashboard/StatCard';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import {
  ClipboardList,
  PlayCircle,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Beaker,
} from 'lucide-react';
import { useStatusDefs } from '@/features/config/queries/useCompositeConfigs';
import { useProjects, useSimTypes } from '@/features/config/queries';
import { useOrders } from '@/features/orders/queries';
import {
  useOrderStatistics,
  useOrderTrends,
  useStatusDistribution,
} from '@/features/orders/queries/useStatistics';
import { DataTable } from '@/components/tables/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import type { OrderListItem } from '@/types/order';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useUIStore();

  // 统计数据
  const { data: statsResponse, isLoading: statsLoading } = useOrderStatistics();
  const { data: trendsResponse, isLoading: trendsLoading } = useOrderTrends(7);
  const { data: distributionResponse, isLoading: distributionLoading } = useStatusDistribution();

  // 解包统计数据 - 处理mock和API两种返回格式
  const stats = useMemo(() => {
    if (!statsResponse) return undefined;
    return 'data' in statsResponse ? statsResponse.data : statsResponse;
  }, [statsResponse]);

  const trends = useMemo(() => {
    if (!trendsResponse) return [];
    const data = 'data' in trendsResponse ? trendsResponse.data : trendsResponse;
    return Array.isArray(data) ? data : [];
  }, [trendsResponse]);

  const distribution = useMemo(() => {
    if (!distributionResponse) return [];
    const data = 'data' in distributionResponse ? distributionResponse.data : distributionResponse;
    return Array.isArray(data) ? data : [];
  }, [distributionResponse]);

  // 配置数据
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

  // 订单数据
  const {
    data: ordersPage,
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useOrders({ page: 1, pageSize: 10 });

  const orders = ordersPage?.items ?? [];
  const t = useCallback((key: string) => RESOURCES[language]?.[key] ?? key, [language]);
  const emptyText = RESOURCES[language]?.['dash.empty'] ?? '暂无订单';
  const hasLoadError = Boolean(ordersError || projectsError || simTypesError || statusDefsError);
  const tableLoading = ordersLoading || projectsLoading || simTypesLoading || statusDefsLoading;

  const handleRetry = () => {
    void refetchOrders();
    void refetchProjects();
    void refetchSimTypes();
    void refetchStatusDefs();
  };

  // 数据映射
  const projectMap = useMemo(
    () => new Map(projects.map(project => [project.id, project])),
    [projects]
  );
  const simTypeMap = useMemo(
    () => new Map(simTypes.map(simType => [simType.id, simType])),
    [simTypes]
  );

  // 图表数据转换
  const trendChartData = useMemo(() => {
    return trends.map(item => ({
      name: item.date,
      value: item.count,
    }));
  }, [trends]);

  const distributionChartData = useMemo(() => {
    return distribution.map(item => ({
      name: item.statusName,
      value: item.count,
    }));
  }, [distribution]);

  const getStatusBadge = React.useCallback(
    (statusId: number) => {
      const config = statusDefs?.find(
        status => status.id === statusId || Number(status.code) === statusId
      );

      if (!config) {
        return <Badge variant="default">未知状态</Badge>;
      }

      // 根据状态类型和代码确定徽章样式
      const variant =
        config.code === 'COMPLETED' || config.code === 'PARTIAL_COMPLETED'
          ? 'success'
          : config.code === 'FAILED'
            ? 'error'
            : config.code === 'RUNNING' || config.code === 'STARTING'
              ? 'info'
              : config.code === 'CANCELLED'
                ? 'warning'
                : 'default';

      return (
        <Badge
          variant={variant}
          style={{
            backgroundColor: config.colorTag,
            borderColor: config.colorTag,
          }}
        >
          {config.icon && <span className="mr-1">{config.icon}</span>}
          {config.name}
        </Badge>
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
              {t('dash.view_results')} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [navigate, t, projectMap, simTypeMap, getStatusBadge]
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {t('dash.title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">{t('dash.subtitle')}</p>
        </div>
        <Button onClick={() => navigate('/create')} icon={<Beaker className="w-5 h-5" />}>
          {t('dash.new_sim')}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('dash.stats.total')}
          value={statsLoading ? '-' : String(stats?.total ?? 0)}
          icon={ClipboardList}
          color="blue"
        />
        <StatCard
          title={t('dash.stats.running')}
          value={statsLoading ? '-' : String(stats?.running ?? 0)}
          icon={PlayCircle}
          color="yellow"
        />
        <StatCard
          title={t('dash.stats.completed')}
          value={statsLoading ? '-' : String(stats?.completed ?? 0)}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title={t('dash.stats.failed')}
          value={statsLoading ? '-' : String(stats?.failed ?? 0)}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {t('dash.chart.trend') ?? '订单趋势（近7天）'}
          </h3>
          {trendsLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-400">加载中...</div>
          ) : trendChartData.length > 0 ? (
            <LineChart data={trendChartData} xField="name" yField="value" height={250} />
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">暂无数据</div>
          )}
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {t('dash.chart.distribution') ?? '状态分布'}
          </h3>
          {distributionLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-400">加载中...</div>
          ) : distributionChartData.length > 0 ? (
            <BarChart data={distributionChartData} xField="name" yField="value" height={250} />
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">暂无数据</div>
          )}
        </Card>
      </div>

      {/* Orders Table */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t('dash.recent_orders') ?? '最近订单'}
          </h3>
        </div>
        {hasLoadError && (
          <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-slate-200 bg-red-50 text-red-700">
            <span className="text-sm">订单或配置数据加载失败，请重试。</span>
            <Button size="sm" variant="outline" onClick={handleRetry}>
              重试
            </Button>
          </div>
        )}
        <DataTable
          data={orders}
          columns={columns}
          containerHeight={400}
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
