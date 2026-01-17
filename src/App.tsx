import React, { useEffect } from 'react';
import { HashRouter, useRoutes, useLocation } from 'react-router-dom';
import { useUIStore, useAuthStore, useConfigStore } from '@/stores';
import { routes } from '@/routes';
import { PageLoader } from '@/components/ui';
import '@/index.css';

// Scroll to top on route change
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Routes component
const AppRoutes: React.FC = () => {
  const element = useRoutes(routes);
  return element;
};

// Main App component
const App: React.FC = () => {
  const { theme } = useUIStore();
  const { fetchUsers, user } = useAuthStore();
  const { fetchAllConfig, isLoading } = useConfigStore();

  // Initialize app data
  useEffect(() => {
    fetchUsers();
    fetchAllConfig();
  }, [fetchUsers, fetchAllConfig]);

  // Apply theme on mount and change
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'eyecare');
    root.removeAttribute('data-theme');

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'eyecare') {
      root.setAttribute('data-theme', 'eyecare');
    }
  }, [theme]);

  if (isLoading) {
    return <PageLoader message="Loading application..." />;
  }

  return (
    <HashRouter>
      <ScrollToTop />
      <AppRoutes />
    </HashRouter>
  );
};

export default App;
