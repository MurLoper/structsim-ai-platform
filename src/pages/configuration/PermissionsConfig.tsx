import React, { useState } from 'react';
import { useUIStore } from '@/stores';
import { RESOURCES } from '@/locales';
import { UserGroupIcon, ShieldCheckIcon, Squares2X2Icon } from '@heroicons/react/24/outline';

import { ConfigTabs, TabItem } from './components';
import { Card, CardHeader } from '@/components/ui';

const TABS: TabItem[] = [
  { key: 'users', label: '用户管理', icon: <UserGroupIcon className="w-4 h-4" /> },
  { key: 'roles', label: '角色管理', icon: <ShieldCheckIcon className="w-4 h-4" /> },
  { key: 'menus', label: '菜单管理', icon: <Squares2X2Icon className="w-4 h-4" /> },
];

const PermissionsConfig: React.FC = () => {
  const { language } = useUIStore();
  const t = (key: string) => RESOURCES[language][key] || key;
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t('cfg.permissions') || '权限配置'}
        </h1>
      </div>

      <ConfigTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'users' && (
        <Card>
          <CardHeader title="用户管理" icon={<UserGroupIcon className="w-5 h-5" />} />
          <div className="p-8 text-center text-slate-500">用户管理功能开发中...</div>
        </Card>
      )}

      {activeTab === 'roles' && (
        <Card>
          <CardHeader title="角色管理" icon={<ShieldCheckIcon className="w-5 h-5" />} />
          <div className="p-8 text-center text-slate-500">角色管理功能开发中...</div>
        </Card>
      )}

      {activeTab === 'menus' && (
        <Card>
          <CardHeader title="菜单管理" icon={<Squares2X2Icon className="w-5 h-5" />} />
          <div className="p-8 text-center text-slate-500">菜单管理功能开发中...</div>
        </Card>
      )}
    </div>
  );
};

export default PermissionsConfig;
