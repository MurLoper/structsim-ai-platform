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
  // 旧路径兼容
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
  // 新路径 - 配置中心
  {
    path: 'configuration',
    children: [
      {
        index: true,
        element: (
          <RouteErrorBoundary>
            <PageSuspense>
              <Configuration />
            </PageSuspense>
          </RouteErrorBoundary>
        ),
        handle: { title: '配置中心', permission: 'CONFIG_VIEW' },
      },
      {
        path: 'projects',
        element: (
          <RouteErrorBoundary>
            <PageSuspense>
              <Configuration />
            </PageSuspense>
          </RouteErrorBoundary>
        ),
        handle: { title: '项目管理', permission: 'CONFIG_VIEW' },
      },
      {
        path: 'sim-types',
        element: (
          <RouteErrorBoundary>
            <PageSuspense>
              <Configuration />
            </PageSuspense>
          </RouteErrorBoundary>
        ),
        handle: { title: '仿真类型', permission: 'CONFIG_VIEW' },
      },
      {
        path: 'parameters',
        element: (
          <RouteErrorBoundary>
            <PageSuspense>
              <Configuration />
            </PageSuspense>
          </RouteErrorBoundary>
        ),
        handle: { title: '参数配置', permission: 'CONFIG_VIEW' },
      },
      {
        path: 'outputs',
        element: (
          <RouteErrorBoundary>
            <PageSuspense>
              <Configuration />
            </PageSuspense>
          </RouteErrorBoundary>
        ),
        handle: { title: '输出配置', permission: 'CONFIG_VIEW' },
      },
      {
        path: 'solvers',
        element: (
          <RouteErrorBoundary>
            <PageSuspense>
              <Configuration />
            </PageSuspense>
          </RouteErrorBoundary>
        ),
        handle: { title: '求解器', permission: 'CONFIG_VIEW' },
      },
    ],
  },
];
