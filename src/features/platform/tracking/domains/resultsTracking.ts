import { platformTrackingEvents, platformPageKeys } from '../catalog/platformTrackingCatalog';
import { trackPlatformEvent } from '../client/platformTrackingClient';

export const trackResultsView = (orderId: number) => {
  trackPlatformEvent({
    eventName: platformTrackingEvents.resultsView,
    eventType: 'navigation',
    pagePath: `/results/${orderId}`,
    target: String(orderId),
    metadata: {
      pageKey: platformPageKeys.results,
      featureKey: 'results.page',
      moduleKey: 'results',
      entityId: orderId,
    },
  });
};

export const trackResultsTabChange = (orderId: number, tabKey: string) => {
  trackPlatformEvent({
    eventName: platformTrackingEvents.resultsTabChange,
    eventType: 'navigation',
    pagePath: `/results/${orderId}`,
    target: tabKey,
    metadata: {
      pageKey: platformPageKeys.results,
      featureKey: `results.tab.${tabKey}`,
      moduleKey: 'results',
      entityId: orderId,
    },
  });
};

export const trackResultsConditionFocus = (
  orderId: number,
  conditionId: number,
  source: string
) => {
  trackPlatformEvent({
    eventName: platformTrackingEvents.resultsConditionFocus,
    eventType: 'interaction',
    pagePath: `/results/${orderId}`,
    target: String(conditionId),
    metadata: {
      pageKey: platformPageKeys.results,
      featureKey: 'results.condition.focus',
      moduleKey: 'results',
      entityId: conditionId,
      orderNo: String(orderId),
      source,
    },
  });
};
