import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { usePlatformBootstrap } from '../queries/usePlatformBootstrap';
import { trackEvent } from './tracker';

export const useRouteTracking = () => {
  const location = useLocation();
  const { isAuthenticated, token } = useAuthStore();
  const { data: bootstrap, isSuccess } = usePlatformBootstrap();
  const lastTrackedRef = useRef('');
  const hasAuthToken = !!token && !!localStorage.getItem('auth_token');

  useEffect(() => {
    if (!isAuthenticated || !hasAuthToken || !isSuccess || !bootstrap?.trackingEnabled) {
      return;
    }
    const key = `${location.pathname}${location.search}`;
    if (!key || key === lastTrackedRef.current) {
      return;
    }
    lastTrackedRef.current = key;
    trackEvent({
      eventName: 'page_view',
      eventType: 'navigation',
      pagePath: key,
      metadata: { hash: window.location.hash },
    });
  }, [
    bootstrap?.trackingEnabled,
    hasAuthToken,
    isAuthenticated,
    isSuccess,
    location.pathname,
    location.search,
  ]);
};
