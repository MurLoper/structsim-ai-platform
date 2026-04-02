import React from 'react';
import { Filter, Plus, Search, X } from 'lucide-react';
import {
  managementFieldClass,
  managementPrimaryButtonClass,
  managementSearchInputClass,
} from '../managementSurfaceTokens';

interface OutputGroupsToolbarProps {
  searchTerm: string;
  filterProjectId: number | '';
  projects: Array<{ id: number; name: string }>;
  onSearchChange: (value: string) => void;
  onFilterProjectChange: (value: number | '') => void;
  onCreate: () => void;
}

export const OutputGroupsToolbar: React.FC<OutputGroupsToolbarProps> = ({
  searchTerm,
  filterProjectId,
  projects,
  onSearchChange,
  onFilterProjectChange,
  onCreate,
}) => {
  return (
    <div className="border-b border-border p-4">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-semibold text-foreground">工况输出组合管理</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            管理工况输出组合，并维护组合内的输出响应配置。
          </p>
        </div>
        <button onClick={onCreate} className={managementPrimaryButtonClass}>
          <Plus className="h-4 w-4" />
          新建组合
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={event => onSearchChange(event.target.value)}
            placeholder="搜索组合名称或输出..."
            className={managementSearchInputClass}
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <select
            value={filterProjectId}
            onChange={event =>
              onFilterProjectChange(event.target.value === '' ? '' : Number(event.target.value))
            }
            className={`${managementFieldClass} text-sm`}
          >
            <option value="">全部项目</option>
            <option value={-1}>全局（无项目）</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          {filterProjectId !== '' && (
            <button
              onClick={() => onFilterProjectChange('')}
              className="rounded-lg px-2 py-2 text-muted-foreground transition-colors hover:text-foreground"
              title="清除过滤"
            >
              <Filter className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
