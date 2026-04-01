import React, { useMemo } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import type { ColumnDef } from '@tanstack/react-table';
import { BulkAssignPanel, PermissionMatrix } from '@/components/access';
import { Badge, Button } from '@/components/ui';
import { VirtualTable } from '@/components/tables/VirtualTable';
import type { PermissionItem, Role } from '@/types';
import type { AccessRolePermissionMap } from '../types';
import { getStatusVariant, isAdminRole } from '../utils/accessUserIdentity';

type AccessRolesTabProps = {
  loading: boolean;
  roles: Role[];
  permissions: PermissionItem[];
  rolePermissionMap: AccessRolePermissionMap;
  onCreateRole: () => void;
  onOpenRoleModal: (role?: Role) => void;
  onOpenRolePermissionModal: (role: Role) => void;
  onToggleRolePermission: (roleId: number, permissionId: number) => Promise<void>;
  onBulkApplyPermissions: (roleId: number, permissionIds: number[]) => Promise<void>;
};

export const AccessRolesTab: React.FC<AccessRolesTabProps> = ({
  loading,
  roles,
  permissions,
  rolePermissionMap,
  onCreateRole,
  onOpenRoleModal,
  onOpenRolePermissionModal,
  onToggleRolePermission,
  onBulkApplyPermissions,
}) => {
  const columns = useMemo<ColumnDef<Role>[]>(
    () => [
      {
        header: '角色',
        accessorKey: 'name',
        cell: ({ row }) => {
          const record = row.original;
          return (
            <div>
              <div className="font-medium text-foreground">{record.name}</div>
              {record.description && (
                <div className="text-xs text-muted-foreground">{record.description}</div>
              )}
            </div>
          );
        },
      },
      {
        header: '编码',
        id: 'code',
        size: 160,
        cell: ({ row }) => <Badge size="sm">{row.original.code || '--'}</Badge>,
      },
      {
        header: '权限数',
        id: 'permissionCount',
        size: 120,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {(row.original.permissionIds || []).length}
          </span>
        ),
      },
      {
        header: '状态',
        id: 'status',
        size: 120,
        cell: ({ row }) => (
          <Badge variant={getStatusVariant(row.original.valid)}>
            {row.original.valid === 0 ? '禁用' : '启用'}
          </Badge>
        ),
      },
      {
        header: '操作',
        id: 'actions',
        size: 180,
        cell: ({ row }) => {
          const record = row.original;
          const adminRole = isAdminRole(record);
          return (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenRoleModal(record)}
                disabled={adminRole}
              >
                编辑
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenRolePermissionModal(record)}
                disabled={adminRole}
              >
                配置权限
              </Button>
            </div>
          );
        },
      },
    ],
    [onOpenRoleModal, onOpenRolePermissionModal]
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">角色列表</h2>
          <p className="text-sm text-muted-foreground">
            配置角色与权限集合，支持批量授权和逐项校验。
          </p>
        </div>
        <Button variant="outline" onClick={onCreateRole} icon={<PlusIcon className="w-4 h-4" />}>
          新增角色
        </Button>
      </div>

      <VirtualTable
        columns={columns}
        data={roles}
        getRowId={record => String(record.id)}
        loading={loading}
        emptyText="暂无角色"
        containerHeight={360}
        rowHeight={52}
        enableSorting={false}
      />

      <BulkAssignPanel roles={roles} permissions={permissions} onApply={onBulkApplyPermissions} />

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          权限矩阵
          <Badge size="sm">{permissions.length}</Badge>
        </div>
        <PermissionMatrix
          roles={roles}
          permissions={permissions}
          rolePermissionMap={rolePermissionMap}
          onToggle={onToggleRolePermission}
        />
      </div>
    </div>
  );
};
