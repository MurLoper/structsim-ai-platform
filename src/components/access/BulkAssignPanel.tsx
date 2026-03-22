import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, CardHeader, Select } from '@/components/ui';
import type { PermissionItem, Role } from '@/types';
import { PermissionTree } from './PermissionTree';

interface BulkAssignPanelProps {
  roles: Role[];
  permissions: PermissionItem[];
  onApply: (roleId: number, permissionIds: number[]) => Promise<void> | void;
}

export const BulkAssignPanel: React.FC<BulkAssignPanelProps> = ({
  roles,
  permissions,
  onApply,
}) => {
  const [roleId, setRoleId] = useState<number | null>(roles[0]?.id ?? null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    if (roles.length === 0) {
      setRoleId(null);
      return;
    }
    if (!roles.some(role => role.id === roleId)) {
      setRoleId(roles[0]?.id ?? null);
    }
  }, [roles, roleId]);

  const selectedRole = useMemo(() => roles.find(role => role.id === roleId), [roles, roleId]);
  const roleOptions = roles.map(role => ({
    value: String(role.id),
    label: role.name,
  }));

  return (
    <Card>
      <CardHeader title="批量授权面板" subtitle="选择目标权限组后，批量勾选并覆盖权限配置。" />
      <div className="space-y-4">
        <Select
          label="目标权限组"
          options={roleOptions}
          value={roleId ? String(roleId) : ''}
          onChange={event => setRoleId(Number(event.target.value))}
        />

        <PermissionTree
          permissions={permissions}
          selectedIds={selectedIds}
          onChange={setSelectedIds}
        />

        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {selectedRole ? `正在为 ${selectedRole.name} 配置权限` : '请先选择目标权限组'}
          </div>
          <Button
            onClick={() => roleId && onApply(roleId, selectedIds)}
            disabled={!roleId || selectedIds.length === 0}
          >
            应用授权
          </Button>
        </div>
      </div>
    </Card>
  );
};
