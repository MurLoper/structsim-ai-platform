/**
 * 应用路由配置
 *
 * 统一管理所有路由，支持懒加载和权限控制
 */
import type { RouteObject } from 'react-router-dom';
import { ProtectedLayout, PublicLayout } from './layouts';
import { PageSuspense, RouteErrorBoundary } from './components';

// 导入路由模块
import { authRoutes, dashboardRoutes, configRoutes, submissionRoutes } from './routes';

/**
 * 应用路由表
 */
export const appRoutes: RouteObject[] = [
  // 公开路由 (登录、无权限等)
  ...authRoutes.map(route => ({
    ...route,
    element: (
      <RouteErrorBoundary>
        <PageSuspense>{route.element}</PageSuspense>
      </RouteErrorBoundary>
    ),
  })),

  // 受保护路由 (需要认证)
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      // 工作台
      ...dashboardRoutes,
      // 配置中心
      ...configRoutes,
      // 提单
      ...submissionRoutes,
    ],
  },
];

/**
 * 路由元信息类型
 */
export interface RouteHandle {
  /** 页面标题 */
  title?: string;
  /** 需要的权限 */
  permission?: string;
  /** 需要的权限列表 */
  permissions?: string[];
  /** 是否不使用容器 */
  noContainer?: boolean;
  /** 是否公开路由 */
  public?: boolean;
  /** 面包屑配置 */
  breadcrumb?: {
    label: string;
    path?: string;
  };
}

/**
 * 声明路由 handle 类型
 */
declare module 'react-router-dom' {
  interface IndexRouteObject {
    handle?: RouteHandle;
  }
  interface NonIndexRouteObject {
    handle?: RouteHandle;
  }
}
