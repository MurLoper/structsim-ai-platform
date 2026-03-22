import React, { useMemo } from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui';
import type { PermissionItem } from '@/types';

interface PermissionTreeProps {
  permissions: PermissionItem[];
  selectedIds?: number[];
  onChange?: (ids: number[]) => void;
  readOnly?: boolean;
}

const typeLabels: Record<string, string> = {
  PAGE: '页面权限',
  ACTION: '操作权限',
  DATA: '数据权限',
  OTHER: '其他权限',
};

export const PermissionTree: React.FC<PermissionTreeProps> = ({
  permissions,
  selectedIds = [],
  onChange,
  readOnly = false,
}) => {
  const grouped = useMemo(() => {
    const groups: Record<string, PermissionItem[]> = {};
    permissions.forEach(item => {
      const type = item.type || 'OTHER';
      if (!groups[type]) groups[type] = [];
      groups[type].push(item);
    });
    return groups;
  }, [permissions]);

  const toggle = (id: number) => {
    if (readOnly) return;
    const exists = selectedIds.includes(id);
    const next = exists ? selectedIds.filter(item => item !== id) : [...selectedIds, id];
    onChange?.(next);
  };

  const sortedTypes = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-4">
      {sortedTypes.map(type => (
        <div key={type} className="rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <ChevronRightIcon className="h-4 w-4" />
              {typeLabels[type] || type}
            </div>
            <Badge size="sm">{grouped[type].length}</Badge>
          </div>
          <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
            {grouped[type].map(item => {
              const checked = selectedIds.includes(item.id);
              return (
                <label
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:border-brand-300 dark:border-slate-700 dark:hover:border-brand-700"
                >
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-brand-600"
                    checked={checked}
                    onChange={() => toggle(item.id)}
                    disabled={readOnly}
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {item.name}
                      <span className="ml-2 text-xs text-slate-400">{item.code}</span>
                    </div>
                    {item.description && (
                      <div className="mt-1 text-xs text-slate-500">{item.description}</div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
