import React from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import { useI18n } from '@/hooks';

const NoPermission: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
        <ExclamationTriangleIcon className="h-10 w-10 text-amber-600" />
      </div>
      <h1 className="mb-2 text-2xl font-bold text-foreground">{t('auth.no_permission.title')}</h1>
      <p className="mb-6 max-w-md text-muted-foreground">{t('auth.no_permission.description')}</p>
      <Link to="/">
        <Button variant="primary">{t('auth.no_permission.back_home')}</Button>
      </Link>
    </div>
  );
};

export default NoPermission;
