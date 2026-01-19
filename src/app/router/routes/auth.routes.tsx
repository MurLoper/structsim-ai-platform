/**
 * 认证路由模块
 */
import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

// 懒加载页面
const Login = lazy(() => import('@/pages/auth/Login'));
const NoPermission = lazy(() => import('@/pages/auth/NoPermission'));

/**
 * 认证相关路由 (公开访问)
 */
export const authRoutes: RouteObject[] = [
  {
    path: '/login',
    element: <Login />,
    handle: {
      title: '登录',
      public: true,
    },
  },
  {
    path: '/no-permission',
    element: <NoPermission />,
    handle: {
      title: '无权限',
      public: true,
    },
  },
];
