import { platformTrackingEvents, platformPageKeys } from '../catalog/platformTrackingCatalog';
import { trackPlatformEvent } from '../client/platformTrackingClient';

export const trackSubmissionDrawerOpen = (
  drawerMode: string,
  conditionId?: number | null,
  foldTypeId?: number | null,
  simTypeId?: number | null
) => {
  trackPlatformEvent({
    eventName: platformTrackingEvents.submissionDrawerOpen,
    eventType: 'interaction',
    pagePath: '/create',
    target: drawerMode,
    metadata: {
      pageKey: platformPageKeys.submission,
      featureKey: `submission.drawer.${drawerMode}`,
      moduleKey: 'submission',
      entityId: conditionId || undefined,
      foldTypeId: foldTypeId || undefined,
      simTypeId: simTypeId || undefined,
    },
  });
};

export const trackSubmissionSubmitSuccess = (
  projectId: number,
  conditionCount: number,
  rounds: number
) => {
  trackPlatformEvent({
    eventName: platformTrackingEvents.submissionSubmitSuccess,
    eventType: 'submit',
    pagePath: '/create',
    metadata: {
      pageKey: platformPageKeys.submission,
      featureKey: 'submission.submit',
      moduleKey: 'submission',
      projectId,
      step: conditionCount,
      durationMs: rounds,
      result: 'success',
    },
  });
};

export const trackSubmissionSubmitFailure = (
  projectId: number | null | undefined,
  message: string
) => {
  trackPlatformEvent({
    eventName: platformTrackingEvents.submissionSubmitFailure,
    eventType: 'submit',
    pagePath: '/create',
    metadata: {
      pageKey: platformPageKeys.submission,
      featureKey: 'submission.submit',
      moduleKey: 'submission',
      projectId: projectId || undefined,
      result: 'failure',
      message,
    },
  });
};
