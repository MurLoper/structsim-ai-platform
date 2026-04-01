import React from 'react';
import type { RelationTab, RelationTabConfig } from './types';

const relationTabBaseClass = 'rounded-lg px-4 py-2 transition-colors';
const relationTabInactiveClass =
  'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 eyecare:bg-muted';

interface RelationTabBarProps {
  activeTab: RelationTab;
  tabs: RelationTabConfig[];
  onChange: (tab: RelationTab) => void;
}

export const RelationTabBar: React.FC<RelationTabBarProps> = ({ activeTab, tabs, onChange }) => (
  <div className="mb-4 flex gap-2">
    {tabs.map(tab => (
      <button
        key={tab.tab}
        type="button"
        onClick={() => onChange(tab.tab)}
        className={`${relationTabBaseClass} ${
          activeTab === tab.tab ? 'bg-blue-600 text-white' : relationTabInactiveClass
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);
