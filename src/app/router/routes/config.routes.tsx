/**
 * 配置中心路由模块
 */
import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PageSuspense, RouteErrorBoundary } from '../components';

// 懒加载页面
const Configuration = lazy(() => import('@/pages/configuration/Configuration'));

/**
 * 配置管理相关路由
 */
export const configRoutes: RouteObject[] = [
  {
    path: 'config',
    element: (
      <RouteErrorBoundary>
        <PageSuspense>
          <Configuration />
        </PageSuspense>
      </RouteErrorBoundary>
    ),
    handle: {
      title: '配置中心',
      permission: 'MANAGE_CONFIG',
    },
  },
];
