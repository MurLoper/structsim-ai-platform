import React from 'react';
import { Plus, Search } from 'lucide-react';
import type { ParamDef } from '@/api';
import { managementSearchInputClass } from '../managementSurfaceTokens';

type ParamGroupAvailableParamListProps = {
  searchTerm: string;
  paramDefs: ParamDef[];
  availableParams: ParamDef[];
  onSearchTermChange: (value: string) => void;
  onAddParam: (paramDefId: number) => void;
};

export const ParamGroupAvailableParamList: React.FC<ParamGroupAvailableParamListProps> = ({
  searchTerm,
  paramDefs,
  availableParams,
  onSearchTermChange,
  onAddParam,
}) => (
  <div>
    <label className="mb-2 block text-sm font-medium">添加参数</label>
    <div className="relative mb-2">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        placeholder="搜索参数名或 Key..."
        value={searchTerm}
        onChange={e => onSearchTermChange(e.target.value)}
        className={managementSearchInputClass}
      />
    </div>
    <div className="max-h-[200px] overflow-y-auto rounded-lg border dark:border-slate-600">
      {availableParams.length === 0 ? (
        <div className="px-3 py-4 text-center text-sm text-slate-400">
          {searchTerm
            ? '未找到匹配参数'
            : paramDefs.length === 0
              ? '暂无参数定义，请先在“参数定义”中创建参数'
              : '所有参数已添加'}
        </div>
      ) : (
        availableParams.map(param => (
          <button
            key={param.id}
            type="button"
            onClick={() => onAddParam(param.id)}
            className="flex w-full items-center gap-3 border-b px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-blue-50 dark:border-slate-600 dark:hover:bg-blue-900/20"
          >
            <Plus className="h-4 w-4 shrink-0 text-blue-500" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{param.name}</div>
              <div className="text-xs text-slate-500">{param.key}</div>
            </div>
            {param.unit && <span className="shrink-0 text-xs text-slate-400">{param.unit}</span>}
            {(param.minVal != null || param.maxVal != null) && (
              <span className="shrink-0 text-xs text-slate-400">
                [{param.minVal ?? '-'}, {param.maxVal ?? '+'}]
              </span>
            )}
            {param.defaultVal && (
              <span className="shrink-0 text-xs text-blue-400">默认: {param.defaultVal}</span>
            )}
          </button>
        ))
      )}
    </div>
  </div>
);
