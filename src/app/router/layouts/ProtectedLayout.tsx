/**
 * 受保护布局组件
 *
 * 包装需要认证和权限检查的路由
 */
import { lazy, useMemo, useEffect } from 'react';
import { Outlet, useMatches, useLocation } from 'react-router-dom';
import { AuthGuard, PermissionGuard } from '../guards';
import { PageSuspense, RouteErrorBoundary } from '../components';
import type { Permission } from '@/types';

// 懒加载布局
const Layout = lazy(() => import('@/components/layout/Layout'));

interface RouteHandle {
  title?: string;
  permission?: Permission;
  permissions?: Permission[];
  noContainer?: boolean;
  public?: boolean;
}

/**
 * 受保护的应用布局
 * 自动处理认证和权限检查
 */
export function ProtectedLayout() {
  const matches = useMatches();
  const { pathname } = useLocation();

  // 路由切换时滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // 获取当前路由的 handle 配置
  const currentHandle = useMemo(() => {
    const match = matches[matches.length - 1];
    return (match?.handle as RouteHandle) || {};
  }, [matches]);

  const { permission, permissions, noContainer } = currentHandle;

  return (
    <AuthGuard>
      <PermissionGuard permission={permission} permissions={permissions}>
        <RouteErrorBoundary>
          <PageSuspense>
            <Layout noContainer={noContainer}>
              <Outlet />
            </Layout>
          </PageSuspense>
        </RouteErrorBoundary>
      </PermissionGuard>
    </AuthGuard>
  );
}

/**
 * 公开布局组件
 * 不需要认证的路由使用
 */
export function PublicLayout() {
  return (
    <RouteErrorBoundary>
      <PageSuspense>
        <Outlet />
      </PageSuspense>
    </RouteErrorBoundary>
  );
}
