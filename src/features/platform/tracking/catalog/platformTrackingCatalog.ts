export const platformPageKeys = {
  dashboard: 'dashboard.home',
  orders: 'orders.list',
  submission: 'submission.editor',
  results: 'results.page',
  analytics: 'platform.analytics',
  privacy: 'platform.privacy',
  configuration: 'configuration.workspace',
  access: 'access.workspace',
} as const;

export const platformTrackingEvents = {
  pageView: 'page_view',
  dashboardShortcutClick: 'dashboard.shortcut_click',
  dashboardStatClick: 'dashboard.stat_click',
  ordersFilterApply: 'orders.filter_apply',
  ordersFilterReset: 'orders.filter_reset',
  ordersResultOpen: 'orders.result_open',
  ordersEditOpen: 'orders.edit_open',
  ordersBaseDirCopy: 'orders.base_dir_copy',
  ordersPageChange: 'orders.page_change',
  ordersPageSizeChange: 'orders.page_size_change',
  submissionDrawerOpen: 'submission.drawer_open',
  submissionSubmitSuccess: 'submission.submit_success',
  submissionSubmitFailure: 'submission.submit_failure',
  resultsView: 'results.view',
  resultsTabChange: 'results.tab_change',
  resultsConditionFocus: 'results.condition_focus',
  resultsExport: 'results.export',
  configurationSave: 'configuration.save',
  configurationAnnouncementSave: 'configuration.announcement_save',
  configurationAnnouncementDelete: 'configuration.announcement_delete',
  platformAnnouncementView: 'platform.announcement_view',
  platformAnnouncementDismiss: 'platform.announcement_dismiss',
  platformAnnouncementClick: 'platform.announcement_click',
  platformPrivacyView: 'platform.privacy_view',
  platformPrivacyAccept: 'platform.privacy_accept',
  platformAnalyticsView: 'platform.analytics_view',
} as const;

export type PlatformTrackingEventName =
  (typeof platformTrackingEvents)[keyof typeof platformTrackingEvents];

export type PlatformPageKey = (typeof platformPageKeys)[keyof typeof platformPageKeys];

export const resolvePlatformPageKey = (pathname: string): PlatformPageKey | string => {
  if (pathname === '/' || pathname === '/dashboard') {
    return platformPageKeys.dashboard;
  }
  if (pathname.startsWith('/orders')) {
    return platformPageKeys.orders;
  }
  if (pathname.startsWith('/create')) {
    return platformPageKeys.submission;
  }
  if (pathname.startsWith('/results')) {
    return platformPageKeys.results;
  }
  if (pathname.startsWith('/analytics')) {
    return platformPageKeys.analytics;
  }
  if (pathname.startsWith('/privacy')) {
    return platformPageKeys.privacy;
  }
  if (pathname.startsWith('/config')) {
    return platformPageKeys.configuration;
  }
  if (pathname.startsWith('/access')) {
    return platformPageKeys.access;
  }
  return pathname || 'unknown';
};
