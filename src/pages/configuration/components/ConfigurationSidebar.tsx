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

interface ConfigurationSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const configCategories = [
  {
    key: 'basic',
    label: '基础配置',
    icon: <Box className="h-4 w-4" />,
    items: [
      { key: 'simTypes', label: '仿真类型', icon: <Box className="h-5 w-5" /> },
      { key: 'params', label: '参数定义', icon: <SlidersHorizontal className="h-5 w-5" /> },
      { key: 'solvers', label: '求解器', icon: <SlidersHorizontal className="h-5 w-5" /> },
      { key: 'conditions', label: '工况定义', icon: <FlaskConical className="h-5 w-5" /> },
      { key: 'outputs', label: '输出定义', icon: <BarChart3 className="h-5 w-5" /> },
      { key: 'foldTypes', label: '姿态类型', icon: <Box className="h-5 w-5" /> },
    ],
  },
  {
    key: 'groups',
    label: '组合配置',
    icon: <Folder className="h-4 w-4" />,
    items: [
      { key: 'paramGroups', label: '参数组合', icon: <SlidersHorizontal className="h-5 w-5" /> },
      { key: 'outputGroups', label: '输出组合', icon: <FlaskConical className="h-5 w-5" /> },
    ],
  },
  {
    key: 'relations',
    label: '关联配置',
    icon: <Link className="h-4 w-4" />,
    items: [
      { key: 'configRelations', label: '配置关联管理', icon: <Link className="h-5 w-5" /> },
      { key: 'foldTypeSimTypes', label: '姿态仿真类型', icon: <Link className="h-5 w-5" /> },
    ],
  },
  {
    key: 'system',
    label: '系统配置',
    icon: <Folder className="h-4 w-4" />,
    items: [
      { key: 'projects', label: '项目管理', icon: <Folder className="h-5 w-5" /> },
      { key: 'projectSimTypes', label: '项目仿真类型', icon: <Link className="h-5 w-5" /> },
      { key: 'statusConfig', label: '状态配置', icon: <Tag className="h-5 w-5" /> },
      { key: 'systemConfig', label: '系统配置', icon: <Box className="h-5 w-5" /> },
      { key: 'workflow', label: '工作流', icon: <RefreshCw className="h-5 w-5" /> },
    ],
  },
];

export const ConfigurationSidebar = ({ activeTab, onTabChange }: ConfigurationSidebarProps) => {
  return (
    <div className="lg:col-span-1">
      <Card>
        <div className="p-4">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white eyecare:text-foreground">
            配置分类
          </h2>
          <div className="space-y-2">
            {configCategories.map(category => (
              <div key={category.key} className="space-y-1">
                <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300 eyecare:text-foreground">
                  {category.icon}
                  <span>{category.label}</span>
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
                      <span>{item.label}</span>
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
