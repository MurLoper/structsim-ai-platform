import React from 'react';
import { RouteObject, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { Permission } from '@/types';

// Lazy load pages for code splitting
const Layout = React.lazy(() => import('@/components/layout/Layout'));
const Login = React.lazy(() => import('@/pages/auth/Login'));
const Dashboard = React.lazy(() => import('@/pages/dashboard/Dashboard'));
const Results = React.lazy(() => import('@/pages/dashboard/Results'));
const Submission = React.lazy(() => import('@/pages/submission'));
const Configuration = React.lazy(() => import('@/pages/configuration/Configuration'));
const NoPermission = React.lazy(() => import('@/pages/auth/NoPermission'));

// Protected route wrapper
interface ProtectedRouteProps {
  children: React.ReactNode;
  perm?: Permission;
}

function ProtectedRoute({ children, perm }: ProtectedRouteProps) {
  const { user, hasPermission } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (perm && !hasPermission(perm)) {
    return <Navigate to="/no-permission" replace />;
  }

  return <>{children}</>;
}

// Suspense wrapper for lazy loaded components
interface SuspenseWrapperProps {
  children: React.ReactNode;
}

function SuspenseWrapper({ children }: SuspenseWrapperProps) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="spinner w-8 h-8" />
        </div>
      }
    >
      {children}
    </React.Suspense>
  );
}

export const routes: RouteObject[] = [
  {
    path: '/login',
    element: (
      <SuspenseWrapper>
        <Login />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/no-permission',
    element: (
      <SuspenseWrapper>
        <Layout>
          <NoPermission />
        </Layout>
      </SuspenseWrapper>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute perm="VIEW_DASHBOARD">
        <SuspenseWrapper>
          <Layout>
            <Dashboard />
          </Layout>
        </SuspenseWrapper>
      </ProtectedRoute>
    ),
  },
  {
    path: '/create',
    element: (
      <ProtectedRoute perm="CREATE_ORDER">
        <SuspenseWrapper>
          <Layout noContainer>
            <Submission />
          </Layout>
        </SuspenseWrapper>
      </ProtectedRoute>
    ),
  },
  {
    path: '/config',
    element: (
      <ProtectedRoute perm="MANAGE_CONFIG">
        <SuspenseWrapper>
          <Layout>
            <Configuration />
          </Layout>
        </SuspenseWrapper>
      </ProtectedRoute>
    ),
  },
  {
    path: '/results/:id',
    element: (
      <ProtectedRoute perm="VIEW_RESULTS">
        <SuspenseWrapper>
          <Layout>
            <Results />
          </Layout>
        </SuspenseWrapper>
      </ProtectedRoute>
    ),
  },
];
