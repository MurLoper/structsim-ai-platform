import React from 'react';
import { RouterProvider, createHashRouter } from 'react-router-dom';
import { Providers } from '@/app/providers';
import { appRoutes } from '@/app/router';
import { ToastProvider } from '@/components/ui';
import '@/index.css';

// Create hash router with data router features
const router = createHashRouter(appRoutes);

// App content with data initialization
const AppContent: React.FC = () => {
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
