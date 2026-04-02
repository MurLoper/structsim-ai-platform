import { useMemo, useState } from 'react';
import { Activity, Bell, FileBarChart2, ShieldCheck, Users } from 'lucide-react';
import { BarChart, LineChart } from '@/components/charts';
import { Button, Card } from '@/components/ui';
import { usePlatformAnalytics } from '@/features/platform/queries/usePlatformAnalytics';

const RANGE_OPTIONS = [7, 14, 30] as const;

const summaryCards = [
  { key: 'totalEvents', label: '总事件数', icon: Activity },
  { key: 'pageViews', label: '页面访问', icon: FileBarChart2 },
  { key: 'uniqueUsers', label: '活跃用户', icon: Users },
  { key: 'announcementViews', label: '公告曝光', icon: Bell },
  { key: 'privacyAcceptances', label: '隐私同意', icon: ShieldCheck },
] as const;

const PlatformAnalyticsPage = () => {
  const [days, setDays] = useState<(typeof RANGE_OPTIONS)[number]>(7);
  const { data, isLoading } = usePlatformAnalytics(days);

  const summary = data?.summary;
  const timeline = data?.timeline || [];
  const topEvents = useMemo(() => data?.topEvents || [], [data?.topEvents]);
  const topPages = useMemo(() => data?.topPages || [], [data?.topPages]);

  const eventChartData = useMemo(
    () => topEvents.map(item => ({ name: item.name, value: item.count })),
    [topEvents]
  );
  const pageChartData = useMemo(
    () => topPages.map(item => ({ name: item.path, value: item.count })),
    [topPages]
  );

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">埋点分析</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            查看公告曝光、页面访问和隐私协议确认等关键行为数据。
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map(item => {
          const Icon = item.icon;
          const value = summary?.[item.key] ?? 0;
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
          <h2 className="mb-4 text-lg font-semibold text-foreground">趋势变化</h2>
          {timeline.length > 0 ? (
            <LineChart data={timeline} xField="date" yField="count" height={280} />
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

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-foreground">页面访问分布</h2>
          {pageChartData.length > 0 ? (
            <BarChart data={pageChartData} xField="name" yField="value" horizontal height={320} />
          ) : (
            <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
              {isLoading ? '页面分布加载中...' : '暂无页面分布数据'}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-foreground">热点明细</h2>
          <div className="space-y-3">
            {topEvents.length === 0 && topPages.length === 0 ? (
              <div className="rounded-2xl bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
                {isLoading ? '统计明细加载中...' : '暂无热点明细'}
              </div>
            ) : (
              <>
                <div>
                  <div className="mb-2 text-sm font-medium text-foreground">事件 TOP 8</div>
                  <div className="space-y-2">
                    {topEvents.map(item => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3 text-sm"
                      >
                        <span className="truncate text-foreground">{item.name}</span>
                        <span className="font-medium text-muted-foreground">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-sm font-medium text-foreground">页面 TOP 8</div>
                  <div className="space-y-2">
                    {topPages.map(item => (
                      <div
                        key={item.path}
                        className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3 text-sm"
                      >
                        <span className="truncate text-foreground">{item.path}</span>
                        <span className="font-medium text-muted-foreground">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PlatformAnalyticsPage;
