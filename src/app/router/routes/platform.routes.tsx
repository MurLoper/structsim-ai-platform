import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PageSuspense, RouteErrorBoundary } from '../components';

const PrivacyPolicyPage = lazy(() => import('@/pages/platform/PrivacyPolicyPage'));
const PlatformAnalyticsPage = lazy(() => import('@/pages/platform/PlatformAnalyticsPage'));

export const platformRoutes: RouteObject[] = [
  {
    path: 'privacy',
    element: (
      <RouteErrorBoundary>
        <PageSuspense>
          <PrivacyPolicyPage />
        </PageSuspense>
      </RouteErrorBoundary>
    ),
    handle: {
      title: '隐私协议',
    },
  },
  {
    path: 'analytics',
    element: (
      <RouteErrorBoundary>
        <PageSuspense>
          <PlatformAnalyticsPage />
        </PageSuspense>
      </RouteErrorBoundary>
    ),
    handle: {
      title: '埋点分析',
      permission: 'VIEW_DASHBOARD',
    },
  },
];
