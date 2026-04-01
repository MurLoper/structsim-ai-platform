import React, { useMemo } from 'react';
import clsx from 'clsx';
import { Badge } from '@/components/ui';
import type { PermissionItem, Role } from '@/types';

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
  const rolePermissionSets = useMemo(() => {
    const map = new Map<number, Set<number>>();
    roles.forEach(role => {
      map.set(role.id, new Set(rolePermissionMap[role.id] || []));
    });
    return map;
  }, [rolePermissionMap, roles]);

  return (
    <div className="overflow-auto rounded-lg border border-border">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-muted text-muted-foreground">
            <th className="px-4 py-3 text-left font-semibold">权限</th>
            {roles.map(role => (
              <th key={role.id} className="px-4 py-3 text-center font-semibold">
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
            <tr key={permission.id} className="border-t border-border">
              <td className="px-4 py-3">
                <div className="font-medium text-foreground">{permission.name}</div>
                <div className="text-xs text-muted-foreground">{permission.code}</div>
              </td>
              {roles.map(role => {
                const checked = rolePermissionSets.get(role.id)?.has(permission.id) ?? false;
                return (
                  <td key={role.id} className="px-4 py-3 text-center">
                    <button
                      type="button"
                      className={clsx(
                        'h-5 w-5 rounded-full border transition-colors',
                        checked ? 'border-brand-600 bg-brand-600' : 'border-border',
                        readOnly && 'cursor-not-allowed opacity-60'
                      )}
                      onClick={() => !readOnly && onToggle?.(role.id, permission.id)}
                      aria-label={`${role.name}-${permission.name}`}
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
