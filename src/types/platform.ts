export type AnnouncementLevel = 'info' | 'success' | 'warning' | 'error';

export interface PlatformAnnouncement {
  id: number;
  title: string;
  content: string;
  level: AnnouncementLevel;
  isActive: boolean;
  dismissible: boolean;
  sort: number;
  startAt?: number | null;
  endAt?: number | null;
  linkText?: string | null;
  linkUrl?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: number;
  updatedAt?: number;
}

export interface PrivacyPolicySummary {
  required: boolean;
  title: string;
  version: string;
  summary: string;
  accepted: boolean;
  acceptedAt?: number | null;
}

export interface PrivacyPolicyDetail extends PrivacyPolicySummary {
  content: string;
}

export interface PlatformBootstrap {
  announcementPollIntervalSeconds: number;
  trackingEnabled: boolean;
  activeAnnouncements: PlatformAnnouncement[];
  privacyPolicy: PrivacyPolicySummary;
}

export interface PlatformAdminContent {
  settings: {
    announcementPollIntervalSeconds: number;
    trackingEnabled: boolean;
    privacyPolicyRequired: boolean;
    privacyPolicyTitle: string;
    privacyPolicyVersion: string;
    privacyPolicySummary: string;
    privacyPolicyContent: string;
  };
  announcements: PlatformAnnouncement[];
}

export interface PlatformSettingsUpdatePayload {
  announcementPollIntervalSeconds?: number;
  trackingEnabled?: boolean;
  privacyPolicyRequired?: boolean;
  privacyPolicyTitle?: string;
  privacyPolicyVersion?: string;
  privacyPolicySummary?: string;
  privacyPolicyContent?: string;
}

export interface PlatformAnnouncementPayload {
  title: string;
  content: string;
  level: AnnouncementLevel;
  isActive: boolean;
  dismissible: boolean;
  sort: number;
  startAt?: number | null;
  endAt?: number | null;
  linkText?: string | null;
  linkUrl?: string | null;
}

export interface PlatformTrackingEventInput {
  eventName: string;
  eventType?: string;
  pagePath?: string;
  target?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
  occurredAt?: number;
}

export interface PlatformAnalyticsSummary {
  summary: {
    days: number;
    totalEvents: number;
    uniqueUsers: number;
    pageViews: number;
    privacyAcceptances: number;
    announcementViews: number;
  };
  timeline: Array<{ date: string; count: number }>;
  topEvents: Array<{ name: string; count: number }>;
  topPages: Array<{ path: string; count: number }>;
}
