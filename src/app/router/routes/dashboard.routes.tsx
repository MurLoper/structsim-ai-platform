/**
 * 工作台路由模块
 */
import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PageSuspense, RouteErrorBoundary } from '../components';

// 懒加载页面
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'));
const Results = lazy(() => import('@/pages/dashboard/Results'));

/**
 * 工作台相关路由
 */
export const dashboardRoutes: RouteObject[] = [
  {
    index: true,
    element: (
      <RouteErrorBoundary>
        <PageSuspense>
          <Dashboard />
        </PageSuspense>
      </RouteErrorBoundary>
    ),
    handle: {
      title: '工作台',
      permission: 'VIEW_DASHBOARD',
    },
  },
  {
    path: 'results/:id',
    element: (
      <RouteErrorBoundary>
        <PageSuspense>
          <Results />
        </PageSuspense>
      </RouteErrorBoundary>
    ),
    handle: {
      title: '结果查看',
      permission: 'VIEW_RESULTS',
    },
  },
];
