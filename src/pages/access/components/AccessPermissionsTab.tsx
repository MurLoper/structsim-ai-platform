import React, { useMemo } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import type { ColumnDef } from '@tanstack/react-table';
import { PermissionTree } from '@/components/access';
import { Badge, Button } from '@/components/ui';
import { VirtualTable } from '@/components/tables/VirtualTable';
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
  const columns = useMemo<ColumnDef<PermissionItem>[]>(
    () => [
      {
        header: '权限点',
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
        size: 180,
        cell: ({ row }) => <Badge size="sm">{row.original.code}</Badge>,
      },
      {
        header: '类型',
        id: 'type',
        size: 120,
        cell: ({ row }) => <Badge size="sm">{row.original.type || 'OTHER'}</Badge>,
      },
      {
        header: '资源',
        id: 'resource',
        size: 180,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.resource || '--'}</span>
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
        size: 120,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => onOpenPermissionModal(row.original)}>
              编辑
            </Button>
          </div>
        ),
      },
    ],
    [onOpenPermissionModal]
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">权限点管理</h2>
          <p className="text-sm text-muted-foreground">统一维护权限点、类型和资源标识。</p>
        </div>
        <Button
          variant="outline"
          onClick={onCreatePermission}
          icon={<PlusIcon className="w-4 h-4" />}
        >
          新增权限
        </Button>
      </div>

      <VirtualTable
        columns={columns}
        data={permissions}
        getRowId={record => String(record.id)}
        loading={loading}
        emptyText="暂无权限点"
        containerHeight={360}
        rowHeight={52}
        enableSorting={false}
      />

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          权限树
          <Badge size="sm">{permissions.length}</Badge>
        </div>
        <PermissionTree permissions={permissions} selectedIds={[]} readOnly />
      </div>
    </div>
  );
};
