import React, { useState } from 'react';
import { useUIStore } from '@/stores';
import { RESOURCES } from '@/locales';
import { FolderIcon, Cog6ToothIcon, TagIcon } from '@heroicons/react/24/outline';

import { ConfigTabs, TabItem } from './components';
import { ProjectsTab } from './tabs/ProjectsTab';
import { StatusConfigTab } from './tabs/StatusConfigTab';
import { SystemConfigManagement } from './components/SystemConfigManagement';

const TABS: TabItem[] = [
  { key: 'projects', label: '项目管理', icon: <FolderIcon className="w-4 h-4" /> },
  { key: 'status', label: '状态管理', icon: <TagIcon className="w-4 h-4" /> },
  { key: 'systemConfig', label: '模块管理', icon: <Cog6ToothIcon className="w-4 h-4" /> },
];

const SystemConfig: React.FC = () => {
  const { language } = useUIStore();
  const t = (key: string) => RESOURCES[language][key] || key;
  const [activeTab, setActiveTab] = useState('projects');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t('cfg.system') || '系统配置'}
        </h1>
      </div>

      <ConfigTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'projects' && <ProjectsTab />}
      {activeTab === 'status' && <StatusConfigTab />}
      {activeTab === 'systemConfig' && <SystemConfigManagement />}
    </div>
  );
};

export default SystemConfig;
