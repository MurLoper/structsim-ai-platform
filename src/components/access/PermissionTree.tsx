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
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(item);
    });
    return groups;
  }, [permissions]);

  const toggle = (id: number) => {
    if (readOnly) {
      return;
    }
    const exists = selectedIds.includes(id);
    const next = exists ? selectedIds.filter(item => item !== id) : [...selectedIds, id];
    onChange?.(next);
  };

  return (
    <div className="space-y-4">
      {Object.keys(grouped)
        .sort((a, b) => a.localeCompare(b))
        .map(type => (
          <div key={type} className="rounded-lg border border-border">
            <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
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
                    className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:border-brand-300"
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-brand-600"
                      checked={checked}
                      onChange={() => toggle(item.id)}
                      disabled={readOnly}
                    />
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {item.name}
                        <span className="ml-2 text-xs text-muted-foreground">{item.code}</span>
                      </div>
                      {item.description && (
                        <div className="mt-1 text-xs text-muted-foreground">{item.description}</div>
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
