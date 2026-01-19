/**
 * 访问权限路由模块
 */
import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

// 懒加载页面
const AccessControl = lazy(() => import('@/pages/access/AccessControl'));

/**
 * 访问权限相关路由
 */
export const accessRoutes: RouteObject[] = [
  {
    path: 'access',
    element: <AccessControl />,
    handle: {
      title: '访问权限',
      permission: 'MANAGE_USERS',
    },
  },
];
