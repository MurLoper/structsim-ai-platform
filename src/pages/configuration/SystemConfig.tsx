import React, { useState } from 'react';
import { Bell, Folder, Settings, Tag } from 'lucide-react';
import { RESOURCES } from '@/locales';
import { useUIStore } from '@/stores';
import { ConfigTabs, TabItem } from './components';
import { SystemConfigManagement } from './components/SystemConfigManagement';
import { PlatformContentManagement } from './components/platform/PlatformContentManagement';
import { ProjectsTab } from './tabs/ProjectsTab';
import { StatusConfigTab } from './tabs/StatusConfigTab';

const TABS: TabItem[] = [
  { key: 'projects', label: '项目管理', icon: <Folder className="h-4 w-4" /> },
  { key: 'status', label: '状态管理', icon: <Tag className="h-4 w-4" /> },
  { key: 'systemConfig', label: '模块管理', icon: <Settings className="h-4 w-4" /> },
  { key: 'platform', label: '平台内容', icon: <Bell className="h-4 w-4" /> },
];

const SystemConfig: React.FC = () => {
  const { language } = useUIStore();
  const t = (key: string) => RESOURCES[language][key] || key;
  const [activeTab, setActiveTab] = useState('projects');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('cfg.system') || '系统配置'}</h1>
      </div>

      <ConfigTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'projects' && <ProjectsTab />}
      {activeTab === 'status' && <StatusConfigTab />}
      {activeTab === 'systemConfig' && <SystemConfigManagement />}
      {activeTab === 'platform' && <PlatformContentManagement />}
    </div>
  );
};

export default SystemConfig;
