/**
 * 配置中心路由模块
 */
import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { PageSuspense, RouteErrorBoundary } from '../components';

// 懒加载页面 - 新配置页面
const BasicConfig = lazy(() => import('@/pages/configuration/BasicConfig'));
const GroupsConfig = lazy(() => import('@/pages/configuration/GroupsConfig'));
const RelationsConfig = lazy(() => import('@/pages/configuration/RelationsConfig'));
const SystemConfig = lazy(() => import('@/pages/configuration/SystemConfig'));
const PermissionsConfig = lazy(() => import('@/pages/configuration/PermissionsConfig'));

/**
 * 配置管理相关路由
 */
export const configRoutes: RouteObject[] = [
  // 配置中心 - 重定向到基础配置
  {
    path: 'config',
    children: [
      {
        index: true,
        element: <Navigate to="/config/basic" replace />,
      },
      {
        path: 'basic',
        element: (
          <RouteErrorBoundary>
            <PageSuspense>
              <BasicConfig />
            </PageSuspense>
          </RouteErrorBoundary>
        ),
        handle: { title: '基础配置', permission: 'CONFIG_VIEW' },
      },
      {
        path: 'groups',
        element: (
          <RouteErrorBoundary>
            <PageSuspense>
              <GroupsConfig />
            </PageSuspense>
          </RouteErrorBoundary>
        ),
        handle: { title: '组合配置', permission: 'CONFIG_VIEW' },
      },
      {
        path: 'relations',
        element: (
          <RouteErrorBoundary>
            <PageSuspense>
              <RelationsConfig />
            </PageSuspense>
          </RouteErrorBoundary>
        ),
        handle: { title: '关联配置', permission: 'CONFIG_VIEW' },
      },
      {
        path: 'system',
        element: (
          <RouteErrorBoundary>
            <PageSuspense>
              <SystemConfig />
            </PageSuspense>
          </RouteErrorBoundary>
        ),
        handle: { title: '系统配置', permission: 'CONFIG_VIEW' },
      },
      {
        path: 'permissions',
        element: (
          <RouteErrorBoundary>
            <PageSuspense>
              <PermissionsConfig />
            </PageSuspense>
          </RouteErrorBoundary>
        ),
        handle: { title: '权限配置', permission: 'CONFIG_VIEW' },
      },
    ],
  },
];
