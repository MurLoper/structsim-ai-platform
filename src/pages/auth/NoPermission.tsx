import React from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';

const NoPermission: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mb-6">
        <ExclamationTriangleIcon className="w-10 h-10 text-amber-600" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h1>
      <p className="text-slate-500 mb-6 max-w-md">
        You don't have permission to access this page. Please contact your administrator if you
        believe this is an error.
      </p>
      <Link to="/">
        <Button variant="primary">Go to Dashboard</Button>
      </Link>
    </div>
  );
};

export default NoPermission;
