import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores';
import { RESOURCES } from '@/locales';
import { Button, Card } from '@/components/ui';
import { StatCard } from '@/components/dashboard/StatCard';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import {
  ClipboardList,
  PlayCircle,
  CheckCircle,
  AlertTriangle,
  Beaker,
  ArrowRight,
  Bell,
  FileText,
  Settings,
} from 'lucide-react';
import {
  useOrderStatistics,
  useOrderTrends,
  useStatusDistribution,
} from '@/features/orders/queries/useStatistics';
import {
  trackDashboardShortcutClick,
  trackDashboardStatClick,
} from '@/features/platform/tracking/domains/dashboardTracking';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useUIStore();

  const { data: statsResponse, isLoading: statsLoading } = useOrderStatistics();
  const { data: trendsResponse, isLoading: trendsLoading } = useOrderTrends(7);
  const { data: distributionResponse, isLoading: distributionLoading } = useStatusDistribution();

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

  const t = useCallback((key: string) => RESOURCES[language]?.[key] ?? key, [language]);

  const trendChartData = useMemo(
    () =>
      trends.map(item => ({
        name: item.date,
        value: item.count,
      })),
    [trends]
  );

  const distributionChartData = useMemo(
    () =>
      distribution.map(item => ({
        name: item.statusName,
        value: item.count,
      })),
    [distribution]
  );

  const quickLinks = [
    {
      title: t('dash.quick.orders'),
      description: t('dash.quick.orders_desc'),
      icon: FileText,
      path: '/orders',
      color: 'blue',
      featureKey: 'dashboard.orders',
    },
    {
      title: t('dash.quick.new_sim'),
      description: t('dash.quick.new_sim_desc'),
      icon: Beaker,
      path: '/create',
      color: 'green',
      featureKey: 'dashboard.new_sim',
    },
    {
      title: t('dash.quick.config'),
      description: t('dash.quick.config_desc'),
      icon: Settings,
      path: '/config',
      color: 'purple',
      featureKey: 'dashboard.config',
    },
    {
      title: '埋点分析',
      description: '查看页面访问、功能使用、流程转化和失败热点',
      icon: Bell,
      path: '/analytics',
      color: 'amber',
      featureKey: 'dashboard.analytics',
    },
  ] as const;

  const navigateWithTracking = (featureKey: string, path: string) => {
    trackDashboardShortcutClick(featureKey, path);
    navigate(path);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
            {t('dash.title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">{t('dash.subtitle')}</p>
        </div>
        <Button
          onClick={() => navigateWithTracking('dashboard.new_sim', '/create')}
          icon={<Beaker className="h-5 w-5" />}
        >
          {t('dash.new_sim')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('dash.stats.total')}
          value={statsLoading ? '-' : String(stats?.total ?? 0)}
          icon={ClipboardList}
          color="blue"
          onClick={() => {
            trackDashboardStatClick('dashboard.stat.total', '/orders');
            navigate('/orders');
          }}
        />
        <StatCard
          title={t('dash.stats.running')}
          value={statsLoading ? '-' : String(stats?.running ?? 0)}
          icon={PlayCircle}
          color="yellow"
          onClick={() => {
            trackDashboardStatClick('dashboard.stat.running', '/orders?status=1');
            navigate('/orders?status=1');
          }}
        />
        <StatCard
          title={t('dash.stats.completed')}
          value={statsLoading ? '-' : String(stats?.completed ?? 0)}
          icon={CheckCircle}
          color="green"
          onClick={() => {
            trackDashboardStatClick('dashboard.stat.completed', '/orders?status=2');
            navigate('/orders?status=2');
          }}
        />
        <StatCard
          title={t('dash.stats.failed')}
          value={statsLoading ? '-' : String(stats?.failed ?? 0)}
          icon={AlertTriangle}
          color="red"
          onClick={() => {
            trackDashboardStatClick('dashboard.stat.failed', '/orders?status=3');
            navigate('/orders?status=3');
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            {t('dash.chart.trend')}
          </h3>
          {trendsLoading ? (
            <div className="flex h-64 items-center justify-center text-slate-400">
              {t('common.loading')}
            </div>
          ) : trendChartData.length > 0 ? (
            <LineChart data={trendChartData} xField="name" yField="value" height={250} />
          ) : (
            <div className="flex h-64 items-center justify-center text-slate-400">
              {t('common.noData')}
            </div>
          )}
        </Card>
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            {t('dash.chart.distribution')}
          </h3>
          {distributionLoading ? (
            <div className="flex h-64 items-center justify-center text-slate-400">
              {t('common.loading')}
            </div>
          ) : distributionChartData.length > 0 ? (
            <BarChart data={distributionChartData} xField="name" yField="value" height={250} />
          ) : (
            <div className="flex h-64 items-center justify-center text-slate-400">
              {t('common.noData')}
            </div>
          )}
        </Card>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          {t('dash.quick.title')}
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map(link => (
            <Card
              key={link.path}
              className="group cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => navigateWithTracking(link.featureKey, link.path)}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`rounded-lg p-3 ${
                    link.color === 'blue'
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : link.color === 'green'
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        : link.color === 'amber'
                          ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300'
                          : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                  }`}
                >
                  <link.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900 transition-colors group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
                    {link.title}
                  </h4>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {link.description}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
