import React, { useState } from 'react';
import { useUIStore } from '@/stores';
import { RESOURCES } from '@/locales';
import { LinkIcon, Squares2X2Icon } from '@heroicons/react/24/outline';

import { ConfigTabs, TabItem } from './components';
import { ConditionManagement } from './components/ConditionManagement';
import { ConditionConfigManagement } from './components/ConditionConfigManagement';

const TABS: TabItem[] = [
  { key: 'conditionManagement', label: '工况管理', icon: <Squares2X2Icon className="w-4 h-4" /> },
  { key: 'conditionConfig', label: '工况组合', icon: <LinkIcon className="w-4 h-4" /> },
];

const RelationsConfig: React.FC = () => {
  const { language } = useUIStore();
  const t = (key: string) => RESOURCES[language][key] || key;
  const [activeTab, setActiveTab] = useState('conditionManagement');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t('cfg.relations') || '关联配置'}
        </h1>
      </div>

      <ConfigTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'conditionManagement' && <ConditionManagement />}
      {activeTab === 'conditionConfig' && <ConditionConfigManagement />}
    </div>
  );
};

export default RelationsConfig;
