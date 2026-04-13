import { type ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { type Permission } from '@/types';

const getCookieValue = (name: string) => {
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(';')
    .map(item => item.trim())
    .find(item => item.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : '';
};

export interface AuthGuardProps {
  children: ReactNode;
}

export interface PermissionGuardProps {
  children: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  mode?: 'any' | 'all';
  redirectTo?: string;
  fallback?: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const {
    user,
    isAuthenticated,
    isLoading,
    sessionHydrated,
    setToken,
    verifyToken,
    clearAuthState,
    loginByOptAccessToken,
  } = useAuthStore();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);
  const storedToken = localStorage.getItem('auth_token');

  useEffect(() => {
    const ssoToken = searchParams.get('token');

    if (ssoToken) {
      setToken(ssoToken);
      searchParams.delete('token');
      setSearchParams(searchParams, { replace: true });
      setIsVerifying(true);
      verifyToken().finally(() => setIsVerifying(false));
      return;
    }

    if (!storedToken && location.pathname.startsWith('/embed')) {
      const optAccessToken = getCookieValue('opt_access_token');
      if (optAccessToken && !isLoading && !isVerifying) {
        setIsVerifying(true);
        loginByOptAccessToken(optAccessToken)
          .then(() => verifyToken())
          .finally(() => setIsVerifying(false));
        return;
      }
    }

    if (user && !storedToken && !isLoading && !isVerifying) {
      clearAuthState();
      return;
    }

    if (storedToken && !sessionHydrated && !isLoading && !isVerifying) {
      setIsVerifying(true);
      verifyToken().finally(() => setIsVerifying(false));
    }
  }, [
    clearAuthState,
    isLoading,
    isVerifying,
    location.pathname,
    loginByOptAccessToken,
    searchParams,
    sessionHydrated,
    setSearchParams,
    setToken,
    storedToken,
    user,
    verifyToken,
  ]);

  if (isLoading || isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-slate-500">正在校验登录状态...</p>
        </div>
      </div>
    );
  }

  if (storedToken && !sessionHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-slate-500">正在同步最新用户信息与权限...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function PermissionGuard({
  children,
  permission,
  permissions,
  mode = 'any',
  redirectTo = '/no-permission',
  fallback,
}: PermissionGuardProps) {
  const { hasPermission } = useAuthStore();

  const checkPermission = () => {
    if (permission) {
      return hasPermission(permission);
    }

    if (permissions && permissions.length > 0) {
      return mode === 'all'
        ? permissions.every(item => hasPermission(item))
        : permissions.some(item => hasPermission(item));
    }

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

export interface RoleGuardProps {
  children: ReactNode;
  roles: string[];
  redirectTo?: string;
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
