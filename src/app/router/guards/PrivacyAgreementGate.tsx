import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePlatformBootstrap } from '@/features/platform/queries/usePlatformBootstrap';

export function PrivacyAgreementGate({ children }: PropsWithChildren) {
  const location = useLocation();
  const { data: bootstrap, isLoading } = usePlatformBootstrap();

  if (location.pathname !== '/privacy' && isLoading && !bootstrap) {
    return null;
  }

  const shouldRedirect =
    location.pathname !== '/privacy' &&
    bootstrap?.privacyPolicy.required === true &&
    bootstrap?.privacyPolicy.accepted === false;

  if (shouldRedirect) {
    return <Navigate to="/privacy" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
