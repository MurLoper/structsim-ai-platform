const translateOrFallback = (t: (key: string) => string, key: string, fallback: string) => {
  const translated = t(key);
  return translated === key ? fallback : translated;
};

const replaceTemplateValue = (template: string, token: string, value: string | number) =>
  template.replace(`{${token}}`, String(value));

export const formatPlatformAnalyticsRangeLabel = (t: (key: string) => string, days: number) =>
  replaceTemplateValue(t('platform.analytics.range_days'), 'days', days);

export const formatPlatformAnalyticsStepLabel = (t: (key: string) => string, index: number) =>
  replaceTemplateValue(t('platform.analytics.step'), 'index', index);

export const formatPlatformAnalyticsConversionLabel = (t: (key: string) => string, rate: number) =>
  replaceTemplateValue(t('platform.analytics.conversion'), 'rate', rate);

export const getPlatformAnalyticsEventLabel = (t: (key: string) => string, eventName: string) =>
  translateOrFallback(t, `platform.analytics.event.${eventName}`, eventName);

export const getPlatformAnalyticsPageLabel = (t: (key: string) => string, pageKey: string) =>
  translateOrFallback(t, `platform.analytics.page.${pageKey}`, pageKey);

export const getPlatformAnalyticsFeatureLabel = (t: (key: string) => string, featureKey: string) =>
  translateOrFallback(t, `platform.analytics.feature.${featureKey}`, featureKey);

export const getPlatformAnalyticsFunnelLabel = (t: (key: string) => string, funnelKey: string) =>
  translateOrFallback(t, `platform.analytics.funnel.${funnelKey}`, funnelKey);
