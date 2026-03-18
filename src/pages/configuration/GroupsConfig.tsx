import React, { useState } from 'react';
import { useUIStore } from '@/stores';
import { RESOURCES } from '@/locales';
import { SlidersHorizontal, FlaskConical } from 'lucide-react';

import { ConfigTabs, TabItem } from './components';
import { ParamGroupsManagement } from './components/ParamGroupsManagement';
import { OutputGroupsManagement } from './components/OutputGroupsManagement';

const TABS: TabItem[] = [
  {
    key: 'paramGroups',
    label: '参数组合',
    icon: <SlidersHorizontal className="w-4 h-4" />,
  },
  { key: 'outputGroups', label: '输出组合', icon: <FlaskConical className="w-4 h-4" /> },
];

const GroupsConfig: React.FC = () => {
  const { language } = useUIStore();
  const t = (key: string) => RESOURCES[language][key] || key;
  const [activeTab, setActiveTab] = useState('paramGroups');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white eyecare:text-foreground">
          {t('cfg.groups') || '组合配置'}
        </h1>
      </div>

      <ConfigTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'paramGroups' && <ParamGroupsManagement />}
      {activeTab === 'outputGroups' && <OutputGroupsManagement />}
    </div>
  );
};

export default GroupsConfig;
