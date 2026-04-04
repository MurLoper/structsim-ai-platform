import { platformTrackingEvents, platformPageKeys } from '../catalog/platformTrackingCatalog';
import { trackPlatformEvent } from '../client/platformTrackingClient';

export const trackDashboardShortcutClick = (featureKey: string, targetPath: string) => {
  trackPlatformEvent({
    eventName: platformTrackingEvents.dashboardShortcutClick,
    eventType: 'navigation',
    pagePath: '/',
    target: targetPath,
    metadata: {
      pageKey: platformPageKeys.dashboard,
      featureKey,
      moduleKey: 'dashboard',
    },
  });
};

export const trackDashboardStatClick = (featureKey: string, targetPath: string) => {
  trackPlatformEvent({
    eventName: platformTrackingEvents.dashboardStatClick,
    eventType: 'navigation',
    pagePath: '/',
    target: targetPath,
    metadata: {
      pageKey: platformPageKeys.dashboard,
      featureKey,
      moduleKey: 'dashboard',
    },
  });
};
