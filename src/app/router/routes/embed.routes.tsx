import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PageSuspense, RouteErrorBoundary } from '../components';

const OrdersWorkspace = lazy(() => import('@/pages/orders/OrdersWorkspace'));
const Submission = lazy(() => import('@/pages/submission'));

export const embedRoutes: RouteObject[] = [
  {
    path: 'orders',
    element: (
      <RouteErrorBoundary>
        <PageSuspense>
          <OrdersWorkspace />
        </PageSuspense>
      </RouteErrorBoundary>
    ),
    handle: {
      permission: 'VIEW_DASHBOARD',
      noContainer: true,
    },
  },
  {
    path: 'create',
    element: (
      <RouteErrorBoundary>
        <PageSuspense>
          <Submission />
        </PageSuspense>
      </RouteErrorBoundary>
    ),
    handle: {
      permission: 'CREATE_ORDER',
      noContainer: true,
    },
  },
];
