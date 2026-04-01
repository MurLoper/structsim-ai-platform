import React from 'react';
import { Plus, Shield } from 'lucide-react';
import { BulkAssignPanel, PermissionMatrix } from '@/components/access';
import { Button, Card, CardHeader, Table } from '@/components/ui';
import type { PermissionItem, Role } from '@/types';
import type { TableColumn } from './permissionsConfigTypes';

interface PermissionsRolesWorkspaceProps {
  loading: boolean;
  roles: Role[];
  permissions: PermissionItem[];
  columns: TableColumn<Role>[];
  rolePermissionMap: Record<number, number[]>;
  onCreate: () => void;
  onToggleRolePermission: (roleId: number, permissionId: number) => Promise<void>;
  onBulkApplyPermissions: (roleId: number, permissionIds: number[]) => Promise<void>;
}

export const PermissionsRolesWorkspace: React.FC<PermissionsRolesWorkspaceProps> = ({
  loading,
  roles,
  permissions,
  columns,
  rolePermissionMap,
  onCreate,
  onToggleRolePermission,
  onBulkApplyPermissions,
}) => (
  <div className="space-y-6">
    <Card padding="none">
      <div className="p-6 pb-0">
        <CardHeader
          title="权限组管理"
          subtitle="配置提单权限、资源额度和默认轮次，方便后续切换到真实流程。"
          icon={<Shield className="h-5 w-5" />}
          action={
            <Button icon={<Plus className="h-4 w-4" />} onClick={onCreate}>
              新建权限组
            </Button>
          }
        />
      </div>
      <Table
        columns={columns}
        data={roles}
        rowKey="id"
        loading={loading}
        emptyText="暂无权限组数据"
      />
    </Card>

    <Card>
      <CardHeader
        title="权限矩阵"
        subtitle="支持按角色逐个勾选权限，便于快速整理提单、详情页和结果页所需权限。"
        icon={<Shield className="h-5 w-5" />}
      />
      <PermissionMatrix
        roles={roles}
        permissions={permissions}
        rolePermissionMap={rolePermissionMap}
        onToggle={onToggleRolePermission}
      />
    </Card>

    <BulkAssignPanel roles={roles} permissions={permissions} onApply={onBulkApplyPermissions} />
  </div>
);
