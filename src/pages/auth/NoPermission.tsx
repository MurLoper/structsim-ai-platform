import React from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';

const NoPermission: React.FC = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
      <ExclamationTriangleIcon className="h-10 w-10 text-amber-600" />
    </div>
    <h1 className="mb-2 text-2xl font-bold text-foreground">无访问权限</h1>
    <p className="mb-6 max-w-md text-muted-foreground">
      您当前没有访问此页面的权限。如果您认为这是配置错误，请联系管理员处理。
    </p>
    <Link to="/">
      <Button variant="primary">返回首页</Button>
    </Link>
  </div>
);

export default NoPermission;
