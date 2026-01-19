/**
 * 提单路由模块
 */
import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

// 懒加载页面
const Submission = lazy(() => import('@/pages/submission'));

/**
 * 提单相关路由
 */
export const submissionRoutes: RouteObject[] = [
  {
    path: 'create',
    element: <Submission />,
    handle: {
      title: '在线提单',
      permission: 'CREATE_ORDER',
      noContainer: true,
    },
  },
];
