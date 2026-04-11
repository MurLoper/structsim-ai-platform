import { platformApi } from '@/api/platform';
import type { PlatformTrackingEventInput, PlatformTrackingMetadata } from '@/types';
import { getTrackingSessionId, hasTrackingToken } from './platformTrackingSession';

const MAX_BATCH_SIZE = 20;
const MAX_QUEUE_LENGTH = 200;
const FLUSH_DELAY_MS = 3000;

let queue: PlatformTrackingEventInput[] = [];
let flushTimer: number | null = null;
let isFlushing = false;
let lifecycleBound = false;

const scheduleFlush = () => {
  if (flushTimer !== null) {
    return;
  }

  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    void flushPlatformTrackingEvents();
  }, FLUSH_DELAY_MS);
};

const normalizeMetadata = (metadata?: PlatformTrackingMetadata) => {
  if (!metadata) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined && value !== null)
  );
};

const getTrackingOccurredAt = () => Math.floor(Date.now() / 1000);

export const flushPlatformTrackingEvents = async () => {
  if (isFlushing || queue.length === 0) {
    return;
  }

  if (!hasTrackingToken()) {
    queue = [];
    return;
  }

  isFlushing = true;
  const batch = queue.slice(0, MAX_BATCH_SIZE);
  queue = queue.slice(batch.length);

  try {
    await platformApi.trackEvents(batch);
  } catch {
    queue = [...batch, ...queue].slice(-MAX_QUEUE_LENGTH);
  } finally {
    isFlushing = false;
    if (queue.length > 0) {
      scheduleFlush();
    }
  }
};

export const trackPlatformEvent = (event: PlatformTrackingEventInput) => {
  if (!hasTrackingToken()) {
    return;
  }

  queue.push({
    eventType: event.eventType || 'interaction',
    ...event,
    sessionId: event.sessionId || getTrackingSessionId(),
    occurredAt: event.occurredAt || getTrackingOccurredAt(),
    metadata: normalizeMetadata(event.metadata),
  });

  if (queue.length >= MAX_BATCH_SIZE) {
    void flushPlatformTrackingEvents();
    return;
  }

  scheduleFlush();
};

if (typeof window !== 'undefined' && !lifecycleBound) {
  lifecycleBound = true;
  window.addEventListener('pagehide', () => {
    void flushPlatformTrackingEvents();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void flushPlatformTrackingEvents();
    }
  });
}
