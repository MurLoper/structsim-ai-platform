import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { Card } from '@/components/ui';
import { usePlatformBootstrap } from '@/features/platform/queries/usePlatformBootstrap';
import { useI18n } from '@/hooks';
import {
  trackAnnouncementClick,
  trackAnnouncementDismiss,
  trackAnnouncementView,
} from '@/features/platform/tracking/domains/platformTracking';

const DISMISSED_ANNOUNCEMENTS_KEY = 'platform:dismissedAnnouncements';

const readDismissedIds = (): number[] => {
  try {
    const raw = localStorage.getItem(DISMISSED_ANNOUNCEMENTS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(item => Number(item)).filter(Number.isFinite) : [];
  } catch {
    return [];
  }
};

const levelMeta = {
  info: {
    icon: Info,
    cardClassName:
      'border-sky-200 bg-sky-50/80 text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100',
    badgeClassName: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200',
  },
  success: {
    icon: CircleCheck,
    cardClassName:
      'border-emerald-200 bg-emerald-50/80 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100',
    badgeClassName: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  },
  warning: {
    icon: CircleAlert,
    cardClassName:
      'border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100',
    badgeClassName: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
  },
  error: {
    icon: CircleAlert,
    cardClassName:
      'border-rose-200 bg-rose-50/80 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-100',
    badgeClassName: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
  },
} as const;

export function LayoutAnnouncementBanner() {
  const { t } = useI18n();
  const { data: bootstrap } = usePlatformBootstrap();
  const [dismissedIds, setDismissedIds] = useState<number[]>(() => readDismissedIds());
  const viewedAnnouncementIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    setDismissedIds(readDismissedIds());
  }, []);

  const announcements = useMemo(
    () =>
      (bootstrap?.activeAnnouncements || []).filter(
        announcement => !announcement.dismissible || !dismissedIds.includes(announcement.id)
      ),
    [bootstrap?.activeAnnouncements, dismissedIds]
  );

  useEffect(() => {
    if (!bootstrap?.trackingEnabled) {
      return;
    }

    announcements.forEach(announcement => {
      if (viewedAnnouncementIdsRef.current.has(announcement.id)) {
        return;
      }
      viewedAnnouncementIdsRef.current.add(announcement.id);
      trackAnnouncementView(announcement.id, announcement.level);
    });
  }, [announcements, bootstrap?.trackingEnabled]);

  const handleDismiss = useCallback(
    (announcementId: number) => {
      const nextDismissedIds = Array.from(new Set([...dismissedIds, announcementId]));
      setDismissedIds(nextDismissedIds);
      localStorage.setItem(DISMISSED_ANNOUNCEMENTS_KEY, JSON.stringify(nextDismissedIds));
      trackAnnouncementDismiss(announcementId);
    },
    [dismissedIds]
  );

  if (announcements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 p-4 pb-0">
      {announcements.map(announcement => {
        const meta = levelMeta[announcement.level] || levelMeta.info;
        const Icon = meta.icon;

        return (
          <Card
            key={announcement.id}
            className={`rounded-2xl border shadow-none ${meta.cardClassName}`}
            padding="none"
          >
            <div className="flex items-start gap-3 px-4 py-3">
              <div className={`mt-0.5 rounded-full p-2 ${meta.badgeClassName}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium dark:bg-black/10">
                    <Bell className="h-3.5 w-3.5" />
                    {t('platform.content.announcement.banner_label')}
                  </span>
                  <h3 className="text-sm font-semibold">{announcement.title}</h3>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{announcement.content}</p>
                {announcement.linkText && announcement.linkUrl && (
                  <a
                    href={announcement.linkUrl}
                    onClick={() => trackAnnouncementClick(announcement.id, announcement.linkUrl!)}
                    target={announcement.linkUrl.startsWith('http') ? '_blank' : undefined}
                    rel={announcement.linkUrl.startsWith('http') ? 'noreferrer' : undefined}
                    className="mt-3 inline-flex text-sm font-medium text-brand-600 hover:text-brand-500"
                  >
                    {announcement.linkText}
                  </a>
                )}
              </div>
              {announcement.dismissible && (
                <button
                  type="button"
                  onClick={() => handleDismiss(announcement.id)}
                  className="rounded-lg p-1.5 text-current/60 transition-colors hover:bg-black/5 hover:text-current dark:hover:bg-white/10"
                  aria-label={t('platform.content.announcement.dismiss')}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
