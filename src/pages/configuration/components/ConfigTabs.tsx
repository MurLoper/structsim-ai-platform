import React from 'react';
import clsx from 'clsx';

export interface TabItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  permission?: string;
}

interface ConfigTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (key: string) => void;
}

export const ConfigTabs: React.FC<ConfigTabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
      <nav className="flex space-x-4 -mb-px">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={clsx(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.key
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};
