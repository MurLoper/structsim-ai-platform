import { platformApi } from '@/api/platform';
import type { PlatformTrackingEventInput } from '@/types';

const MAX_BATCH_SIZE = 20;
const FLUSH_DELAY = 3000;
const SESSION_KEY = 'platform_tracking_session_id';

let queue: PlatformTrackingEventInput[] = [];
let flushTimer: number | null = null;
let isFlushing = false;
let pageLifecycleBound = false;

const getSessionId = () => {
  const cached = sessionStorage.getItem(SESSION_KEY);
  if (cached) {
    return cached;
  }
  const next = Math.random().toString(36).slice(2, 12);
  sessionStorage.setItem(SESSION_KEY, next);
  return next;
};

const scheduleFlush = () => {
  if (flushTimer !== null) {
    return;
  }
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    void flushTrackedEvents();
  }, FLUSH_DELAY);
};

export const flushTrackedEvents = async () => {
  if (isFlushing || queue.length === 0) {
    return;
  }

  if (!localStorage.getItem('auth_token')) {
    queue = [];
    return;
  }

  isFlushing = true;
  const batch = queue.slice(0, MAX_BATCH_SIZE);
  queue = queue.slice(batch.length);

  try {
    await platformApi.trackEvents(batch);
  } catch {
    queue = [...batch, ...queue].slice(-200);
  } finally {
    isFlushing = false;
    if (queue.length > 0) {
      scheduleFlush();
    }
  }
};

export const trackEvent = (event: PlatformTrackingEventInput) => {
  if (!localStorage.getItem('auth_token')) {
    return;
  }

  queue.push({
    eventType: 'interaction',
    ...event,
    sessionId: event.sessionId || getSessionId(),
    occurredAt: event.occurredAt || Date.now(),
  });

  if (queue.length >= MAX_BATCH_SIZE) {
    void flushTrackedEvents();
    return;
  }
  scheduleFlush();
};

if (typeof window !== 'undefined' && !pageLifecycleBound) {
  pageLifecycleBound = true;
  window.addEventListener('pagehide', () => {
    void flushTrackedEvents();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void flushTrackedEvents();
    }
  });
}
