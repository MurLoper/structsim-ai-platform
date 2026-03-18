import React from 'react';
import { useUIStore } from '@/stores';
import { RESOURCES } from '@/locales';
import { ConditionConfigManagement } from './components/ConditionConfigManagement';

const RelationsConfig: React.FC = () => {
  const { language } = useUIStore();
  const t = (key: string) => RESOURCES[language][key] || key;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white eyecare:text-foreground">
          {t('cfg.relations') || '工况配置'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 eyecare:text-muted-foreground">
          管理姿态 × 仿真类型的工况组合及其默认配置
        </p>
      </div>

      <ConditionConfigManagement />
    </div>
  );
};

export default RelationsConfig;
