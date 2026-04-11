import React, { useMemo } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import type { ColumnDef } from '@tanstack/react-table';
import { BulkAssignPanel, PermissionMatrix } from '@/components/access';
import { Badge, Button } from '@/components/ui';
import { VirtualTable } from '@/components/tables/VirtualTable';
import { useI18n } from '@/hooks/useI18n';
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
  const { t } = useI18n();

  const columns = useMemo<ColumnDef<Role>[]>(
    () => [
      {
        header: t('access.role.name'),
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
        header: t('common.code'),
        id: 'code',
        size: 160,
        cell: ({ row }) => <Badge size="sm">{row.original.code || '--'}</Badge>,
      },
      {
        header: t('access.role.permission_count'),
        id: 'permissionCount',
        size: 120,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {(row.original.permissionIds || []).length}
          </span>
        ),
      },
      {
        header: t('common.status'),
        id: 'status',
        size: 120,
        cell: ({ row }) => (
          <Badge variant={getStatusVariant(row.original.valid)}>
            {row.original.valid === 0 ? t('access.status.disabled') : t('access.status.enabled')}
          </Badge>
        ),
      },
      {
        header: t('common.actions'),
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
                {t('common.edit')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenRolePermissionModal(record)}
                disabled={adminRole}
              >
                {t('cfg.permissions.role.configure_permissions')}
              </Button>
            </div>
          );
        },
      },
    ],
    [onOpenRoleModal, onOpenRolePermissionModal, t]
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('access.role.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('access.role.description_text')}</p>
        </div>
        <Button variant="outline" onClick={onCreateRole} icon={<PlusIcon className="h-4 w-4" />}>
          {t('cfg.permissions.role.create')}
        </Button>
      </div>

      <VirtualTable
        columns={columns}
        data={roles}
        getRowId={record => String(record.id)}
        loading={loading}
        emptyText={t('access.role.empty')}
        containerHeight={360}
        rowHeight={52}
        enableSorting={false}
      />

      <BulkAssignPanel roles={roles} permissions={permissions} onApply={onBulkApplyPermissions} />

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          {t('access.role.matrix')}
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
