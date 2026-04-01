import React from 'react';
import { Card } from '@/components/ui';
import type { SimTypeListProps } from './types';

export const RelationSimTypeList: React.FC<SimTypeListProps> = ({
  loading,
  simTypes,
  selectedSimType,
  onSelect,
}) => (
  <Card>
    <div className="border-b p-4 dark:border-slate-700">
      <h3 className="text-lg font-semibold">仿真类型</h3>
    </div>
    <div className="space-y-2 p-4">
      {loading ? (
        <div className="py-8 text-center text-slate-500">加载中...</div>
      ) : simTypes.length === 0 ? (
        <div className="py-8 text-center text-slate-500">暂无仿真类型</div>
      ) : (
        simTypes.map(simType => (
          <button
            key={simType.id}
            type="button"
            onClick={() => onSelect(simType)}
            className={`w-full rounded-lg p-3 text-left transition-colors ${
              selectedSimType?.id === simType.id
                ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 eyecare:hover:bg-muted'
            }`}
          >
            <div className="font-medium text-slate-900 dark:text-white eyecare:text-foreground">
              {simType.name}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {simType.code} | {simType.category}
            </div>
          </button>
        ))
      )}
    </div>
  </Card>
);
