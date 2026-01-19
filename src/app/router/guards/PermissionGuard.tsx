/**
 * 权限守卫组件
 *
 * 控制路由访问权限，未授权时重定向
 */
import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { type Permission } from '@/types';

export interface AuthGuardProps {
  children: ReactNode;
}

export interface PermissionGuardProps {
  children: ReactNode;
  /** 需要的权限 */
  permission?: Permission;
  /** 需要的权限列表 (满足任一即可) */
  permissions?: Permission[];
  /** 权限检查模式: 'any' 满足任一, 'all' 满足全部 */
  mode?: 'any' | 'all';
  /** 无权限时的跳转路径 */
  redirectTo?: string;
  /** 无权限时显示的组件 (替代重定向) */
  fallback?: ReactNode;
}

/**
 * 认证守卫
 * 检查用户是否已登录，未登录则重定向到登录页
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    // 保存当前路径，登录后可返回
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/**
 * 权限守卫
 * 检查用户是否有指定权限
 */
export function PermissionGuard({
  children,
  permission,
  permissions,
  mode = 'any',
  redirectTo = '/no-permission',
  fallback,
}: PermissionGuardProps) {
  const { hasPermission } = useAuthStore();

  // 检查权限
  const checkPermission = (): boolean => {
    // 单个权限检查
    if (permission) {
      return hasPermission(permission);
    }

    // 多个权限检查
    if (permissions && permissions.length > 0) {
      if (mode === 'all') {
        return permissions.every(p => hasPermission(p));
      }
      return permissions.some(p => hasPermission(p));
    }

    // 没有指定权限要求，默认通过
    return true;
  };

  if (!checkPermission()) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

/**
 * 组合守卫: 认证 + 权限
 */
export function ProtectedRoute({
  children,
  permission,
  permissions,
  mode,
  redirectTo,
  fallback,
}: PermissionGuardProps) {
  return (
    <AuthGuard>
      <PermissionGuard
        permission={permission}
        permissions={permissions}
        mode={mode}
        redirectTo={redirectTo}
        fallback={fallback}
      >
        {children}
      </PermissionGuard>
    </AuthGuard>
  );
}

/**
 * 角色守卫
 * 根据用户角色控制访问
 */
export interface RoleGuardProps {
  children: ReactNode;
  /** 允许的角色列表 */
  roles: string[];
  /** 无权限时的跳转路径 */
  redirectTo?: string;
  /** 无权限时显示的组件 */
  fallback?: ReactNode;
}

export function RoleGuard({
  children,
  roles,
  redirectTo = '/no-permission',
  fallback,
}: RoleGuardProps) {
  const { user } = useAuthStore();

  if (!user || !roles.includes(user.role)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
