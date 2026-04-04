import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { usePlatformBootstrap } from '../queries/usePlatformBootstrap';
import { trackPlatformPageView } from './domains/platformTracking';

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

    const routeKey = `${location.pathname}${location.search}`;
    if (!routeKey || routeKey === lastTrackedRef.current) {
      return;
    }

    lastTrackedRef.current = routeKey;
    trackPlatformPageView(location.pathname, location.search, window.location.hash);
  }, [
    bootstrap?.trackingEnabled,
    hasAuthToken,
    isAuthenticated,
    isSuccess,
    location.pathname,
    location.search,
  ]);
};
