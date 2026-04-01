import React from 'react';
import { Download, Filter, Plus, Search, X } from 'lucide-react';
import {
  managementFieldClass,
  managementPrimaryButtonClass,
  managementSearchInputClass,
} from '../managementSurfaceTokens';

type ProjectOption = {
  id: number;
  name: string;
};

type ParamGroupToolbarProps = {
  searchTerm: string;
  filterProjectId: number | '';
  projects: ProjectOption[];
  onSearchTermChange: (value: string) => void;
  onFilterProjectIdChange: (value: number | '') => void;
  onDownloadTemplate: () => void;
  onCreateGroup: () => void;
};

export const ParamGroupToolbar: React.FC<ParamGroupToolbarProps> = ({
  searchTerm,
  filterProjectId,
  projects,
  onSearchTermChange,
  onFilterProjectIdChange,
  onDownloadTemplate,
  onCreateGroup,
}) => (
  <div className="border-b p-4 dark:border-slate-700">
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h3 className="text-lg font-semibold">参数组管理</h3>
        <p className="mt-1 text-sm text-slate-500">
          统一维护参数组、参数默认值、DOE 配置与项目关联关系。
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onDownloadTemplate}
          className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <Download className="h-4 w-4" />
          下载模板
        </button>
        <button onClick={onCreateGroup} className={managementPrimaryButtonClass}>
          <Plus className="h-4 w-4" />
          新建参数组
        </button>
      </div>
    </div>

    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="搜索参数组名称、参数名称或参数 Key..."
          value={searchTerm}
          onChange={event => onSearchTermChange(event.target.value)}
          className={managementSearchInputClass}
        />
        {searchTerm && (
          <button
            onClick={() => onSearchTermChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <select
          value={filterProjectId}
          onChange={event =>
            onFilterProjectIdChange(event.target.value === '' ? '' : Number(event.target.value))
          }
          className={`${managementFieldClass} text-sm`}
        >
          <option value="">全部项目</option>
          <option value={-1}>全局参数组（未关联项目）</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

        {filterProjectId !== '' && (
          <button
            onClick={() => onFilterProjectIdChange('')}
            className="rounded-lg px-2 py-2 text-slate-400 hover:text-slate-600"
            title="清除项目过滤"
          >
            <Filter className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  </div>
);
