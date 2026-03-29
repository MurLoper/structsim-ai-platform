/**
 * 申请单路由模块
 */
import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PageSuspense, RouteErrorBoundary } from '../components';

// 懒加载页面
const OrdersWorkspace = lazy(() => import('@/pages/orders/OrdersWorkspace'));

/**
 * 申请单相关路由
 */
export const ordersRoutes: RouteObject[] = [
  {
    index: true,
    element: (
      <RouteErrorBoundary>
        <PageSuspense>
          <OrdersWorkspace />
        </PageSuspense>
      </RouteErrorBoundary>
    ),
    handle: {
      title: '申请单列表',
      permission: 'VIEW_DASHBOARD',
      noContainer: true,
    },
  },
];
