import React, { useEffect } from 'react';
import { RouterProvider, createHashRouter } from 'react-router-dom';
import { useAuthStore, useConfigStore } from '@/stores';
import { Providers } from '@/app/providers';
import { appRoutes } from '@/app/router';
import { PageLoader, ToastProvider } from '@/components/ui';
import '@/index.css';

// Create hash router with data router features
const router = createHashRouter(appRoutes);

// App content with data initialization
const AppContent: React.FC = () => {
  const { fetchUsers } = useAuthStore();
  const { fetchAllConfig, isLoading } = useConfigStore();

  // Initialize app data
  useEffect(() => {
    fetchUsers();
    fetchAllConfig();
  }, [fetchUsers, fetchAllConfig]);

  if (isLoading) {
    return <PageLoader message="Loading application..." />;
  }

  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
};

// Main App component with Providers
const App: React.FC = () => {
  return (
    <Providers>
      <AppContent />
    </Providers>
  );
};

export default App;
