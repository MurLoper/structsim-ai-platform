/**
 * 权限守卫组件
 *
 * 控制路由访问权限，未授权时重定向
 */
import { type ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
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
 * 检查用户是否已登录，支持SSO回调token验证
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isAuthenticated, isLoading, setToken, verifyToken } = useAuthStore();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // 检查URL参数中是否有SSO回调的token
    const ssoToken = searchParams.get('token');
    if (ssoToken) {
      // 保存token并清除URL参数
      setToken(ssoToken);
      searchParams.delete('token');
      setSearchParams(searchParams, { replace: true });
      // 验证token
      setIsVerifying(true);
      verifyToken().finally(() => setIsVerifying(false));
      return;
    }

    // 如果有token但没有用户信息，尝试验证
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken && !user && !isLoading && !isVerifying) {
      setIsVerifying(true);
      verifyToken().finally(() => setIsVerifying(false));
    }
  }, [searchParams, setSearchParams, setToken, verifyToken, user, isLoading, isVerifying]);

  // 正在验证中，显示加载状态
  if (isLoading || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">验证登录状态...</p>
        </div>
      </div>
    );
  }

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

  if (!user || !user.role || !roles.includes(user.role)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
