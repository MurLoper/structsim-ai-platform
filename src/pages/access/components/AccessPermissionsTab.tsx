import React, { useMemo } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import type { ColumnDef } from '@tanstack/react-table';
import { PermissionTree } from '@/components/access';
import { Badge, Button } from '@/components/ui';
import { VirtualTable } from '@/components/tables/VirtualTable';
import { useI18n } from '@/hooks/useI18n';
import type { PermissionItem } from '@/types';
import { getStatusVariant } from '../utils/accessUserIdentity';

type AccessPermissionsTabProps = {
  loading: boolean;
  permissions: PermissionItem[];
  onCreatePermission: () => void;
  onOpenPermissionModal: (permission?: PermissionItem) => void;
};

export const AccessPermissionsTab: React.FC<AccessPermissionsTabProps> = ({
  loading,
  permissions,
  onCreatePermission,
  onOpenPermissionModal,
}) => {
  const { t } = useI18n();

  const columns = useMemo<ColumnDef<PermissionItem>[]>(
    () => [
      {
        header: t('access.permission.name'),
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
        size: 180,
        cell: ({ row }) => <Badge size="sm">{row.original.code}</Badge>,
      },
      {
        header: t('common.type'),
        id: 'type',
        size: 120,
        cell: ({ row }) => <Badge size="sm">{row.original.type || 'OTHER'}</Badge>,
      },
      {
        header: t('access.permission.resource'),
        id: 'resource',
        size: 180,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.resource || '--'}</span>
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
        size: 120,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => onOpenPermissionModal(row.original)}>
              {t('common.edit')}
            </Button>
          </div>
        ),
      },
    ],
    [onOpenPermissionModal, t]
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('access.permission.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('access.permission.description_text')}</p>
        </div>
        <Button
          variant="outline"
          onClick={onCreatePermission}
          icon={<PlusIcon className="h-4 w-4" />}
        >
          {t('access.permission.create')}
        </Button>
      </div>

      <VirtualTable
        columns={columns}
        data={permissions}
        getRowId={record => String(record.id)}
        loading={loading}
        emptyText={t('access.permission.empty')}
        containerHeight={360}
        rowHeight={52}
        enableSorting={false}
      />

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          {t('access.permission.tree')}
          <Badge size="sm">{permissions.length}</Badge>
        </div>
        <PermissionTree permissions={permissions} selectedIds={[]} readOnly />
      </div>
    </div>
  );
};
