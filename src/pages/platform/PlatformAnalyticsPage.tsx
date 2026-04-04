import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Bell, FileBarChart2, ShieldCheck, Users } from 'lucide-react';
import { BarChart, LineChart } from '@/components/charts';
import { Button, Card } from '@/components/ui';
import { usePlatformAnalytics } from '@/features/platform/queries/usePlatformAnalytics';
import { trackAnalyticsView } from '@/features/platform/tracking/domains/platformTracking';

const RANGE_OPTIONS = [7, 14, 30] as const;

const PlatformAnalyticsPage = () => {
  const [days, setDays] = useState<(typeof RANGE_OPTIONS)[number]>(7);
  const { summary, features, funnels, failures, isLoading, error } = usePlatformAnalytics(days);

  useEffect(() => {
    trackAnalyticsView(days);
  }, [days]);

  const statusCode =
    typeof error === 'object' && error && 'response' in error
      ? (error as { response?: { status?: number } }).response?.status
      : undefined;
  const isForbidden = statusCode === 403;

  const summaryCards = useMemo(
    () => [
      { key: 'totalEvents', label: '总事件数', icon: Activity },
      { key: 'pageViews', label: '页面访问', icon: FileBarChart2 },
      { key: 'uniqueUsers', label: '活跃用户', icon: Users },
      { key: 'announcementViews', label: '公告曝光', icon: Bell },
      { key: 'privacyAcceptances', label: '隐私确认', icon: ShieldCheck },
      { key: 'failureEvents', label: '失败事件', icon: AlertTriangle },
    ],
    []
  );

  const eventChartData = useMemo(
    () => summary?.topEvents.map(item => ({ name: item.name, value: item.count })) || [],
    [summary?.topEvents]
  );
  const pageChartData = useMemo(
    () =>
      features?.pages.slice(0, 10).map(item => ({ name: item.pageKey, value: item.count })) || [],
    [features?.pages]
  );
  const featureChartData = useMemo(
    () =>
      features?.features.slice(0, 12).map(item => ({ name: item.featureKey, value: item.count })) ||
      [],
    [features?.features]
  );
  const failureChartData = useMemo(
    () => failures?.topFailedEvents.map(item => ({ name: item.name, value: item.count })) || [],
    [failures?.topFailedEvents]
  );

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">埋点分析</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            查看页面访问、功能使用、关键流程转化和失败热点。
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-muted p-1">
          {RANGE_OPTIONS.map(option => (
            <Button
              key={option}
              variant={days === option ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setDays(option)}
            >
              最近 {option} 天
            </Button>
          ))}
        </div>
      </div>

      {isForbidden && (
        <Card className="rounded-2xl border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">无权查看埋点分析</h2>
            <p className="text-sm text-current/80">
              当前账号缺少 VIEW_DASHBOARD 权限，无法访问平台埋点分析页面。
            </p>
          </div>
        </Card>
      )}

      {!isForbidden && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {summaryCards.map(item => {
              const Icon = item.icon;
              const value = summary?.summary?.[item.key as keyof typeof summary.summary] ?? 0;
              return (
                <Card key={item.key} className="rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">{item.label}</div>
                      <div className="mt-3 text-3xl font-semibold text-foreground">
                        {isLoading ? '--' : value}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-900/20 dark:text-brand-300">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <h2 className="mb-4 text-lg font-semibold text-foreground">事件趋势</h2>
              {summary?.timeline && summary.timeline.length > 0 ? (
                <LineChart data={summary.timeline} xField="date" yField="count" height={280} />
              ) : (
                <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                  {isLoading ? '趋势数据加载中...' : '暂无趋势数据'}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="mb-4 text-lg font-semibold text-foreground">高频事件</h2>
              {eventChartData.length > 0 ? (
                <BarChart data={eventChartData} xField="name" yField="value" height={280} />
              ) : (
                <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                  {isLoading ? '事件数据加载中...' : '暂无事件数据'}
                </div>
              )}
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <h2 className="mb-4 text-lg font-semibold text-foreground">页面使用排行</h2>
              {pageChartData.length > 0 ? (
                <BarChart
                  data={pageChartData}
                  xField="name"
                  yField="value"
                  horizontal
                  height={320}
                />
              ) : (
                <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
                  {isLoading ? '页面排行加载中...' : '暂无页面使用数据'}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="mb-4 text-lg font-semibold text-foreground">功能使用排行</h2>
              {featureChartData.length > 0 ? (
                <BarChart
                  data={featureChartData}
                  xField="name"
                  yField="value"
                  horizontal
                  height={320}
                />
              ) : (
                <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
                  {isLoading ? '功能排行加载中...' : '暂无功能使用数据'}
                </div>
              )}
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <h2 className="mb-4 text-lg font-semibold text-foreground">流程转化</h2>
              <div className="space-y-4">
                {(funnels?.funnels || []).map(funnel => (
                  <div key={funnel.key} className="rounded-2xl bg-muted/40 p-4">
                    <div className="mb-3 text-sm font-semibold text-foreground">{funnel.title}</div>
                    <div className="space-y-2">
                      {funnel.steps.map(step => (
                        <div
                          key={`${funnel.key}-${step.index}`}
                          className="flex items-center justify-between rounded-xl bg-background px-3 py-2 text-sm"
                        >
                          <div className="min-w-0">
                            <div className="font-medium text-foreground">
                              Step {step.index} · {step.featureKey || step.eventName}
                            </div>
                            <div className="text-xs text-muted-foreground">{step.eventName}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-foreground">{step.count}</div>
                            <div className="text-xs text-muted-foreground">
                              转化 {step.conversionRate}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {!isLoading && (!funnels?.funnels || funnels.funnels.length === 0) && (
                  <div className="rounded-2xl bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
                    暂无流程转化数据
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <h2 className="mb-4 text-lg font-semibold text-foreground">失败热点</h2>
              {failureChartData.length > 0 ? (
                <BarChart
                  data={failureChartData}
                  xField="name"
                  yField="value"
                  horizontal
                  height={320}
                />
              ) : (
                <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
                  {isLoading ? '失败热点加载中...' : '暂无失败事件'}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default PlatformAnalyticsPage;
