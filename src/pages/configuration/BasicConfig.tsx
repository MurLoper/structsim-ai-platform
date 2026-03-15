import React, { useState } from 'react';
import { useUIStore } from '@/stores';
import { RESOURCES } from '@/locales';
import {
  CubeIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  BeakerIcon,
  CpuChipIcon,
  ServerIcon,
} from '@heroicons/react/24/outline';

import { ConfigTabs, TabItem } from './components';
import {
  SimTypesTab,
  ParamDefsTab,
  OutputDefsTab,
  SolversTab,
  SolverResourcesTab,
  FoldTypesTab,
  CareDevicesTab,
} from './tabs';

const TABS: TabItem[] = [
  { key: 'foldTypes', label: '姿态类型', icon: <BeakerIcon className="w-4 h-4" /> },
  { key: 'simTypes', label: '仿真类型', icon: <CubeIcon className="w-4 h-4" /> },
  { key: 'params', label: '参数定义', icon: <AdjustmentsHorizontalIcon className="w-4 h-4" /> },
  { key: 'outputs', label: '输出定义', icon: <ChartBarIcon className="w-4 h-4" /> },
  { key: 'solvers', label: '求解器', icon: <AdjustmentsHorizontalIcon className="w-4 h-4" /> },
  { key: 'solverResources', label: '资源池', icon: <ServerIcon className="w-4 h-4" /> },
  { key: 'careDevices', label: '关注器件', icon: <CpuChipIcon className="w-4 h-4" /> },
];

const BasicConfig: React.FC = () => {
  const { language } = useUIStore();
  const t = (key: string) => RESOURCES[language][key] || key;
  const [activeTab, setActiveTab] = useState('foldTypes');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white eyecare:text-foreground">
          {t('cfg.basic') || '基础配置'}
        </h1>
      </div>

      <ConfigTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'simTypes' && <SimTypesTab />}
      {activeTab === 'params' && <ParamDefsTab />}
      {activeTab === 'outputs' && <OutputDefsTab />}
      {activeTab === 'solvers' && <SolversTab />}
      {activeTab === 'solverResources' && <SolverResourcesTab />}
      {activeTab === 'foldTypes' && <FoldTypesTab />}
      {activeTab === 'careDevices' && <CareDevicesTab />}
    </div>
  );
};

export default BasicConfig;
