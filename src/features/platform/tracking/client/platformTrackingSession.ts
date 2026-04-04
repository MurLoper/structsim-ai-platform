const TRACKING_SESSION_KEY = 'platform_tracking_session_id';

export const getTrackingSessionId = () => {
  const cached = sessionStorage.getItem(TRACKING_SESSION_KEY);
  if (cached) {
    return cached;
  }

  const next = Math.random().toString(36).slice(2, 12);
  sessionStorage.setItem(TRACKING_SESSION_KEY, next);
  return next;
};

export const hasTrackingToken = () => !!localStorage.getItem('auth_token');
