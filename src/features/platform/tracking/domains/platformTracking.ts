import type { PlatformTrackingMetadata } from '@/types';
import { platformTrackingEvents, resolvePlatformPageKey } from '../catalog/platformTrackingCatalog';
import { trackPlatformEvent } from '../client/platformTrackingClient';

export const trackPlatformPageView = (pathname: string, search = '', hash = '') => {
  const pagePath = `${pathname}${search}`;
  trackPlatformEvent({
    eventName: platformTrackingEvents.pageView,
    eventType: 'navigation',
    pagePath,
    metadata: {
      pageKey: resolvePlatformPageKey(pathname),
      hash: hash || undefined,
    },
  });
};

export const trackAnnouncementView = (announcementId: number, level: string) => {
  trackPlatformEvent({
    eventName: platformTrackingEvents.platformAnnouncementView,
    eventType: 'notice',
    pagePath: window.location.hash || window.location.pathname,
    target: String(announcementId),
    metadata: {
      pageKey: resolvePlatformPageKey(window.location.pathname),
      featureKey: 'platform.announcement.banner',
      moduleKey: 'platform',
      entityId: announcementId,
      level,
    },
  });
};

export const trackAnnouncementDismiss = (announcementId: number) => {
  trackPlatformEvent({
    eventName: platformTrackingEvents.platformAnnouncementDismiss,
    eventType: 'notice',
    pagePath: window.location.hash || window.location.pathname,
    target: String(announcementId),
    metadata: {
      pageKey: resolvePlatformPageKey(window.location.pathname),
      featureKey: 'platform.announcement.dismiss',
      moduleKey: 'platform',
      entityId: announcementId,
    },
  });
};

export const trackAnnouncementClick = (announcementId: number, linkUrl: string) => {
  trackPlatformEvent({
    eventName: platformTrackingEvents.platformAnnouncementClick,
    eventType: 'notice',
    pagePath: window.location.hash || window.location.pathname,
    target: linkUrl,
    metadata: {
      pageKey: resolvePlatformPageKey(window.location.pathname),
      featureKey: 'platform.announcement.link',
      moduleKey: 'platform',
      entityId: announcementId,
    },
  });
};

export const trackPrivacyView = (version?: string) => {
  trackPlatformEvent({
    eventName: platformTrackingEvents.platformPrivacyView,
    eventType: 'privacy',
    pagePath: '/privacy',
    metadata: {
      pageKey: resolvePlatformPageKey('/privacy'),
      featureKey: 'platform.privacy.page',
      moduleKey: 'platform',
      result: 'view',
      version,
    },
  });
};

export const trackPrivacyAccept = (version?: string) => {
  trackPlatformEvent({
    eventName: platformTrackingEvents.platformPrivacyAccept,
    eventType: 'privacy',
    pagePath: '/privacy',
    metadata: {
      pageKey: resolvePlatformPageKey('/privacy'),
      featureKey: 'platform.privacy.accept',
      moduleKey: 'platform',
      result: 'success',
      version,
    },
  });
};

export const trackAnalyticsView = (days: number) => {
  trackPlatformEvent({
    eventName: platformTrackingEvents.platformAnalyticsView,
    eventType: 'analytics',
    pagePath: '/analytics',
    metadata: {
      pageKey: resolvePlatformPageKey('/analytics'),
      featureKey: 'platform.analytics.page',
      moduleKey: 'platform',
      days,
    },
  });
};

export const trackPlatformContentAction = (
  eventName: string,
  featureKey: string,
  metadata?: PlatformTrackingMetadata
) => {
  trackPlatformEvent({
    eventName,
    eventType: 'configuration',
    pagePath: '/config',
    metadata: {
      pageKey: resolvePlatformPageKey('/config'),
      featureKey,
      moduleKey: 'configuration',
      ...metadata,
    },
  });
};
