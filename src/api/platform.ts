import { api } from './client';
import type {
  PlatformAdminContent,
  PlatformAnalyticsFailures,
  PlatformAnalyticsFeatures,
  PlatformAnalyticsFunnels,
  PlatformAnalyticsSummary,
  PlatformAnnouncement,
  PlatformAnnouncementPayload,
  PlatformBootstrap,
  PlatformSettingsUpdatePayload,
  PlatformTrackingEventInput,
  PrivacyPolicyDetail,
} from '@/types';

export const platformApi = {
  getBootstrap: () => api.get<PlatformBootstrap>('/platform/bootstrap'),
  getPrivacyPolicy: () => api.get<PrivacyPolicyDetail>('/platform/privacy-policy'),
  acceptPrivacyPolicy: (policyVersion?: string) =>
    api.post<{ accepted: boolean; policyVersion: string; acceptedAt: number }>(
      '/platform/privacy-policy/accept',
      policyVersion ? { policyVersion } : {}
    ),
  trackEvents: (events: PlatformTrackingEventInput[]) =>
    api.post<{ acceptedCount: number; trackingEnabled: boolean }>('/platform/events', { events }),
  getAnalyticsSummary: (days: number) =>
    api.get<PlatformAnalyticsSummary>('/platform/analytics/summary', { params: { days } }),
  getAnalyticsFeatures: (days: number) =>
    api.get<PlatformAnalyticsFeatures>('/platform/analytics/features', { params: { days } }),
  getAnalyticsFunnels: (days: number) =>
    api.get<PlatformAnalyticsFunnels>('/platform/analytics/funnels', { params: { days } }),
  getAnalyticsFailures: (days: number) =>
    api.get<PlatformAnalyticsFailures>('/platform/analytics/failures', { params: { days } }),
  getAdminContent: () => api.get<PlatformAdminContent>('/platform/admin/content'),
  updateAdminContent: (payload: PlatformSettingsUpdatePayload) =>
    api.put<{ settings: PlatformAdminContent['settings'] }>('/platform/admin/content', payload),
  createAnnouncement: (payload: PlatformAnnouncementPayload) =>
    api.post<PlatformAnnouncement>('/platform/admin/announcements', payload),
  updateAnnouncement: (announcementId: number, payload: PlatformAnnouncementPayload) =>
    api.put<PlatformAnnouncement>(`/platform/admin/announcements/${announcementId}`, payload),
  deleteAnnouncement: (announcementId: number) =>
    api.delete(`/platform/admin/announcements/${announcementId}`),
};
