import React, { useEffect } from 'react';
import { RouterProvider, createHashRouter } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { Providers } from '@/app/providers';
import { appRoutes } from '@/app/router';
import { ToastProvider } from '@/components/ui';
import '@/index.css';

// Create hash router with data router features
const router = createHashRouter(appRoutes);

// App content with data initialization
const AppContent: React.FC = () => {
  const { fetchUsers } = useAuthStore();

  // Initialize app data
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
