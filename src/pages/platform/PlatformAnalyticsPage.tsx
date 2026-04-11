import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Bell, FileBarChart2, ShieldCheck, Users } from 'lucide-react';
import { BarChart, LineChart } from '@/components/charts';
import { Button, Card } from '@/components/ui';
import { usePlatformAnalytics } from '@/features/platform/queries/usePlatformAnalytics';
import {
  formatPlatformAnalyticsConversionLabel,
  formatPlatformAnalyticsRangeLabel,
  formatPlatformAnalyticsStepLabel,
  getPlatformAnalyticsEventLabel,
  getPlatformAnalyticsFeatureLabel,
  getPlatformAnalyticsFunnelLabel,
  getPlatformAnalyticsPageLabel,
} from '@/features/platform/analytics/platformAnalyticsLabels';
import { trackAnalyticsView } from '@/features/platform/tracking/domains/platformTracking';
import { useI18n } from '@/hooks';

const RANGE_OPTIONS = [7, 14, 30] as const;

const PlatformAnalyticsPage = () => {
  const { t } = useI18n();
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
      { key: 'totalEvents', label: t('platform.analytics.card.total_events'), icon: Activity },
      { key: 'pageViews', label: t('platform.analytics.card.page_views'), icon: FileBarChart2 },
      { key: 'uniqueUsers', label: t('platform.analytics.card.unique_users'), icon: Users },
      {
        key: 'announcementViews',
        label: t('platform.analytics.card.announcement_views'),
        icon: Bell,
      },
      {
        key: 'privacyAcceptances',
        label: t('platform.analytics.card.privacy_acceptances'),
        icon: ShieldCheck,
      },
      {
        key: 'failureEvents',
        label: t('platform.analytics.card.failure_events'),
        icon: AlertTriangle,
      },
    ],
    [t]
  );

  const eventChartData = useMemo(
    () =>
      summary?.topEvents.map(item => ({
        name: getPlatformAnalyticsEventLabel(t, item.name),
        value: item.count,
      })) || [],
    [summary?.topEvents, t]
  );
  const pageChartData = useMemo(
    () =>
      features?.pages.slice(0, 10).map(item => ({
        name: getPlatformAnalyticsPageLabel(t, item.pageKey),
        value: item.count,
      })) || [],
    [features?.pages, t]
  );
  const featureChartData = useMemo(
    () =>
      features?.features.slice(0, 12).map(item => ({
        name: getPlatformAnalyticsFeatureLabel(t, item.featureKey),
        value: item.count,
      })) || [],
    [features?.features, t]
  );
  const failureChartData = useMemo(
    () =>
      failures?.topFailedEvents.map(item => ({
        name: getPlatformAnalyticsEventLabel(t, item.name),
        value: item.count,
      })) || [],
    [failures?.topFailedEvents, t]
  );

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">
            {t('platform.analytics.title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('platform.analytics.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-muted p-1">
          {RANGE_OPTIONS.map(option => (
            <Button
              key={option}
              variant={days === option ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setDays(option)}
            >
              {formatPlatformAnalyticsRangeLabel(t, option)}
            </Button>
          ))}
        </div>
      </div>

      {isForbidden && (
        <Card className="rounded-2xl border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">{t('platform.analytics.forbidden_title')}</h2>
            <p className="text-sm text-current/80">{t('platform.analytics.forbidden_desc')}</p>
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
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                {t('platform.analytics.section.event_trend')}
              </h2>
              {summary?.timeline && summary.timeline.length > 0 ? (
                <LineChart data={summary.timeline} xField="date" yField="count" height={280} />
              ) : (
                <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                  {isLoading
                    ? t('platform.analytics.loading.trend')
                    : t('platform.analytics.empty.trend')}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                {t('platform.analytics.section.top_events')}
              </h2>
              {eventChartData.length > 0 ? (
                <BarChart data={eventChartData} xField="name" yField="value" height={280} />
              ) : (
                <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                  {isLoading
                    ? t('platform.analytics.loading.events')
                    : t('platform.analytics.empty.events')}
                </div>
              )}
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                {t('platform.analytics.section.page_usage')}
              </h2>
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
                  {isLoading
                    ? t('platform.analytics.loading.pages')
                    : t('platform.analytics.empty.pages')}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                {t('platform.analytics.section.feature_usage')}
              </h2>
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
                  {isLoading
                    ? t('platform.analytics.loading.features')
                    : t('platform.analytics.empty.features')}
                </div>
              )}
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                {t('platform.analytics.section.funnels')}
              </h2>
              <div className="space-y-4">
                {(funnels?.funnels || []).map(funnel => (
                  <div key={funnel.key} className="rounded-2xl bg-muted/40 p-4">
                    <div className="mb-3 text-sm font-semibold text-foreground">
                      {getPlatformAnalyticsFunnelLabel(t, funnel.key)}
                    </div>
                    <div className="space-y-2">
                      {funnel.steps.map(step => (
                        <div
                          key={`${funnel.key}-${step.index}`}
                          className="flex items-center justify-between rounded-xl bg-background px-3 py-2 text-sm"
                        >
                          <div className="min-w-0">
                            <div className="font-medium text-foreground">
                              {formatPlatformAnalyticsStepLabel(t, step.index)} ·{' '}
                              {step.featureKey
                                ? getPlatformAnalyticsFeatureLabel(t, step.featureKey)
                                : getPlatformAnalyticsEventLabel(t, step.eventName)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {getPlatformAnalyticsEventLabel(t, step.eventName)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-foreground">{step.count}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatPlatformAnalyticsConversionLabel(t, step.conversionRate)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {!isLoading && (!funnels?.funnels || funnels.funnels.length === 0) && (
                  <div className="rounded-2xl bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
                    {t('platform.analytics.empty.funnels')}
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                {t('platform.analytics.section.failures')}
              </h2>
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
                  {isLoading
                    ? t('platform.analytics.loading.failures')
                    : t('platform.analytics.empty.failures')}
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
