import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { usePlatformBootstrap } from '../queries/usePlatformBootstrap';
import { trackEvent } from './tracker';

export const useRouteTracking = () => {
  const location = useLocation();
  const { data: bootstrap } = usePlatformBootstrap();
  const lastTrackedRef = useRef('');

  useEffect(() => {
    if (!bootstrap?.trackingEnabled) {
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
  }, [bootstrap?.trackingEnabled, location.pathname, location.search]);
};
