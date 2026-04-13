import { useMemo } from 'react';
import { Outlet, useMatches } from 'react-router-dom';
import { AuthGuard, PermissionGuard, PrivacyAgreementGate } from '../guards';
import { PageSuspense, RouteErrorBoundary } from '../components';
import { useRouteTracking } from '@/features/platform/tracking/useRouteTracking';
import type { Permission } from '@/types';

interface RouteHandle {
  permission?: Permission;
  permissions?: Permission[];
}

export function EmbedProtectedLayout() {
  const matches = useMatches();
  useRouteTracking();

  const currentHandle = useMemo(() => {
    const match = matches[matches.length - 1];
    return (match?.handle as RouteHandle) || {};
  }, [matches]);

  return (
    <AuthGuard>
      <PrivacyAgreementGate>
        <PermissionGuard
          permission={currentHandle.permission}
          permissions={currentHandle.permissions}
        >
          <RouteErrorBoundary>
            <PageSuspense>
              <main className="min-h-screen bg-background text-foreground">
                <Outlet />
              </main>
            </PageSuspense>
          </RouteErrorBoundary>
        </PermissionGuard>
      </PrivacyAgreementGate>
    </AuthGuard>
  );
}
