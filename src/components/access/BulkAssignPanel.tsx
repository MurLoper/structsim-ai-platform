import React, { useMemo, useState } from 'react';
import { Button, Card, CardHeader, Select } from '@/components/ui';
import type { Role, PermissionItem } from '@/types';
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
  const selectedRole = useMemo(() => roles.find(r => r.id === roleId), [roles, roleId]);

  const roleOptions = roles.map(role => ({
    value: String(role.id),
    label: role.name,
  }));

  return (
    <Card>
      <CardHeader title="批量授权面板" subtitle="选择角色并批量配置权限" />
      <div className="space-y-4">
        <Select
          label="目标角色"
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
            {selectedRole ? `正在配置：${selectedRole.name}` : '请选择角色'}
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
