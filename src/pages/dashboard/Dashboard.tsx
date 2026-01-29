import React, { useMemo, useCallback } from 'react';
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
  FileText,
  Settings,
} from 'lucide-react';
import {
  useOrderStatistics,
  useOrderTrends,
  useStatusDistribution,
} from '@/features/orders/queries/useStatistics';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useUIStore();

  // 统计数据
  const { data: statsResponse, isLoading: statsLoading } = useOrderStatistics();
  const { data: trendsResponse, isLoading: trendsLoading } = useOrderTrends(7);
  const { data: distributionResponse, isLoading: distributionLoading } = useStatusDistribution();

  // 解包统计数据
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

  // 快捷入口配置
  const quickLinks = [
    {
      title: t('dash.quick.orders'),
      description: t('dash.quick.orders_desc'),
      icon: FileText,
      path: '/orders',
      color: 'blue',
    },
    {
      title: t('dash.quick.new_sim'),
      description: t('dash.quick.new_sim_desc'),
      icon: Beaker,
      path: '/create',
      color: 'green',
    },
    {
      title: t('dash.quick.config'),
      description: t('dash.quick.config_desc'),
      icon: Settings,
      path: '/config',
      color: 'purple',
    },
  ];

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
          onClick={() => navigate('/orders')}
        />
        <StatCard
          title={t('dash.stats.running')}
          value={statsLoading ? '-' : String(stats?.running ?? 0)}
          icon={PlayCircle}
          color="yellow"
          onClick={() => navigate('/orders?status=1')}
        />
        <StatCard
          title={t('dash.stats.completed')}
          value={statsLoading ? '-' : String(stats?.completed ?? 0)}
          icon={CheckCircle}
          color="green"
          onClick={() => navigate('/orders?status=2')}
        />
        <StatCard
          title={t('dash.stats.failed')}
          value={statsLoading ? '-' : String(stats?.failed ?? 0)}
          icon={AlertTriangle}
          color="red"
          onClick={() => navigate('/orders?status=3')}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {t('dash.chart.trend')}
          </h3>
          {trendsLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-400">
              {t('common.loading')}
            </div>
          ) : trendChartData.length > 0 ? (
            <LineChart data={trendChartData} xField="name" yField="value" height={250} />
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">
              {t('common.noData')}
            </div>
          )}
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {t('dash.chart.distribution')}
          </h3>
          {distributionLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-400">
              {t('common.loading')}
            </div>
          ) : distributionChartData.length > 0 ? (
            <BarChart data={distributionChartData} xField="name" yField="value" height={250} />
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">
              {t('common.noData')}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          {t('dash.quick.title')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickLinks.map(link => (
            <Card
              key={link.path}
              className="cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => navigate(link.path)}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-lg ${
                    link.color === 'blue'
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : link.color === 'green'
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                  }`}
                >
                  <link.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {link.title}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {link.description}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
