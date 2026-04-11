import React from 'react';
import {
  Folder,
  SlidersHorizontal,
  RefreshCw,
  FlaskConical,
  BarChart3,
  Box,
  Link,
  Tag,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { useI18n } from '@/hooks/useI18n';

interface ConfigurationSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const configCategories = [
  {
    key: 'basic',
    labelKey: 'cfg.basic',
    icon: <Box className="h-4 w-4" />,
    items: [
      { key: 'simTypes', labelKey: 'cfg.sidebar.sim_types', icon: <Box className="h-5 w-5" /> },
      {
        key: 'params',
        labelKey: 'cfg.sidebar.params',
        icon: <SlidersHorizontal className="h-5 w-5" />,
      },
      {
        key: 'solvers',
        labelKey: 'cfg.sidebar.solvers',
        icon: <SlidersHorizontal className="h-5 w-5" />,
      },
      {
        key: 'conditions',
        labelKey: 'cfg.sidebar.conditions',
        icon: <FlaskConical className="h-5 w-5" />,
      },
      {
        key: 'outputs',
        labelKey: 'cfg.sidebar.outputs',
        icon: <BarChart3 className="h-5 w-5" />,
      },
      { key: 'foldTypes', labelKey: 'cfg.sidebar.fold_types', icon: <Box className="h-5 w-5" /> },
    ],
  },
  {
    key: 'groups',
    labelKey: 'cfg.groups',
    icon: <Folder className="h-4 w-4" />,
    items: [
      {
        key: 'paramGroups',
        labelKey: 'cfg.sidebar.param_groups',
        icon: <SlidersHorizontal className="h-5 w-5" />,
      },
      {
        key: 'outputGroups',
        labelKey: 'cfg.sidebar.output_groups',
        icon: <FlaskConical className="h-5 w-5" />,
      },
    ],
  },
  {
    key: 'relations',
    labelKey: 'cfg.relations',
    icon: <Link className="h-4 w-4" />,
    items: [
      {
        key: 'configRelations',
        labelKey: 'cfg.sidebar.relation_management',
        icon: <Link className="h-5 w-5" />,
      },
      {
        key: 'foldTypeSimTypes',
        labelKey: 'cfg.sidebar.fold_type_sim_types',
        icon: <Link className="h-5 w-5" />,
      },
    ],
  },
  {
    key: 'system',
    labelKey: 'cfg.system',
    icon: <Folder className="h-4 w-4" />,
    items: [
      { key: 'projects', labelKey: 'cfg.sidebar.projects', icon: <Folder className="h-5 w-5" /> },
      {
        key: 'projectSimTypes',
        labelKey: 'cfg.sidebar.project_sim_types',
        icon: <Link className="h-5 w-5" />,
      },
      {
        key: 'statusConfig',
        labelKey: 'cfg.sidebar.status_config',
        icon: <Tag className="h-5 w-5" />,
      },
      { key: 'systemConfig', labelKey: 'cfg.system', icon: <Box className="h-5 w-5" /> },
      {
        key: 'workflow',
        labelKey: 'cfg.sidebar.workflow',
        icon: <RefreshCw className="h-5 w-5" />,
      },
    ],
  },
];

export const ConfigurationSidebar = ({ activeTab, onTabChange }: ConfigurationSidebarProps) => {
  const { t } = useI18n();

  return (
    <div className="lg:col-span-1">
      <Card>
        <div className="p-4">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white eyecare:text-foreground">
            {t('cfg.sidebar.title')}
          </h2>
          <div className="space-y-2">
            {configCategories.map(category => (
              <div key={category.key} className="space-y-1">
                <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300 eyecare:text-foreground">
                  {category.icon}
                  <span>{t(category.labelKey)}</span>
                </div>
                <div className="ml-4 space-y-1">
                  {category.items.map(item => (
                    <button
                      key={item.key}
                      onClick={() => onTabChange(item.key)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                        activeTab === item.key
                          ? 'bg-blue-50 font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700 eyecare:text-muted-foreground eyecare:hover:bg-muted/50'
                      }`}
                    >
                      {item.icon}
                      <span>{t(item.labelKey)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
