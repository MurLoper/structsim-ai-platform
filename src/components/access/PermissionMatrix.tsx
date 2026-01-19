import React from 'react';
import clsx from 'clsx';
import { Badge } from '@/components/ui';
import type { Role, PermissionItem } from '@/types';

interface PermissionMatrixProps {
  roles: Role[];
  permissions: PermissionItem[];
  rolePermissionMap: Record<number, number[]>;
  onToggle?: (roleId: number, permissionId: number) => void;
  readOnly?: boolean;
}

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  roles,
  permissions,
  rolePermissionMap,
  onToggle,
  readOnly = false,
}) => {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <th className="text-left px-4 py-3 font-semibold">权限</th>
            {roles.map(role => (
              <th key={role.id} className="px-4 py-3 font-semibold text-center">
                <div className="flex flex-col items-center gap-1">
                  <span>{role.name}</span>
                  {role.code && <Badge size="sm">{role.code}</Badge>}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {permissions.map(permission => (
            <tr key={permission.id} className="border-t border-slate-200 dark:border-slate-700">
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900 dark:text-white">{permission.name}</div>
                <div className="text-xs text-slate-400">{permission.code}</div>
              </td>
              {roles.map(role => {
                const checked = (rolePermissionMap[role.id] || []).includes(permission.id);
                return (
                  <td key={role.id} className="px-4 py-3 text-center">
                    <button
                      className={clsx(
                        'w-5 h-5 rounded-full border transition-colors',
                        checked
                          ? 'bg-brand-600 border-brand-600'
                          : 'border-slate-300 dark:border-slate-600',
                        readOnly && 'cursor-not-allowed opacity-60'
                      )}
                      onClick={() => !readOnly && onToggle?.(role.id, permission.id)}
                      aria-label={`${role.name}-${permission.name}`}
                      type="button"
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
