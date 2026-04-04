import { platformTrackingEvents, platformPageKeys } from '../catalog/platformTrackingCatalog';
import { trackPlatformEvent } from '../client/platformTrackingClient';

export const trackConfigurationSave = (featureKey: string, result: 'success' | 'failure') => {
  trackPlatformEvent({
    eventName: platformTrackingEvents.configurationSave,
    eventType: 'configuration',
    pagePath: '/config',
    metadata: {
      pageKey: platformPageKeys.configuration,
      featureKey,
      moduleKey: 'configuration',
      result,
    },
  });
};

export const trackAnnouncementSave = (action: 'create' | 'update', announcementId?: number) => {
  trackPlatformEvent({
    eventName: platformTrackingEvents.configurationAnnouncementSave,
    eventType: 'configuration',
    pagePath: '/config',
    target: action,
    metadata: {
      pageKey: platformPageKeys.configuration,
      featureKey: `configuration.announcement.${action}`,
      moduleKey: 'configuration',
      entityId: announcementId,
      result: 'success',
    },
  });
};

export const trackAnnouncementDelete = (announcementId: number) => {
  trackPlatformEvent({
    eventName: platformTrackingEvents.configurationAnnouncementDelete,
    eventType: 'configuration',
    pagePath: '/config',
    target: String(announcementId),
    metadata: {
      pageKey: platformPageKeys.configuration,
      featureKey: 'configuration.announcement.delete',
      moduleKey: 'configuration',
      entityId: announcementId,
      result: 'success',
    },
  });
};
