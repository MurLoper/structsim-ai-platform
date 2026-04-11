import React, { useMemo } from 'react';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, Button, Input } from '@/components/ui';
import { VirtualTable } from '@/components/tables/VirtualTable';
import { useI18n } from '@/hooks/useI18n';
import type { User } from '@/types';
import type { PermissionLookup, RoleLookup } from '../types';
import { getStatusVariant, isAdminUser } from '../utils/accessUserIdentity';

type AccessUsersTabProps = {
  loading: boolean;
  keyword: string;
  users: User[];
  roleNameById: RoleLookup;
  permissionNameByCode: PermissionLookup;
  onKeywordChange: (value: string) => void;
  onCreateUser: () => void;
  onCreateRole: () => void;
  onOpenUserRoleModal: (user: User) => void;
  onOpenPasswordModal: (user: User) => void;
  getUserIdentity: (user: Pick<User, 'domainAccount' | 'id'>) => string | number;
  getUserDisplayName: (
    user: Pick<User, 'realName' | 'userName' | 'displayName' | 'domainAccount' | 'id' | 'email'>
  ) => string | number;
};

export const AccessUsersTab: React.FC<AccessUsersTabProps> = ({
  loading,
  keyword,
  users,
  roleNameById,
  permissionNameByCode,
  onKeywordChange,
  onCreateUser,
  onCreateRole,
  onOpenUserRoleModal,
  onOpenPasswordModal,
  getUserIdentity,
  getUserDisplayName,
}) => {
  const { t } = useI18n();

  const filteredUsers = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return users;
    }

    return users.filter(user => {
      const name = user.realName || user.userName || user.domainAccount || '';
      return [name, user.email, user.roleNames?.join(' '), user.roleCodes?.join(' ')]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(normalizedKeyword));
    });
  }, [keyword, users]);

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        header: t('access.user.title'),
        accessorKey: 'domainAccount',
        cell: ({ row }) => {
          const record = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-600 dark:bg-brand-900/30">
                {String(getUserDisplayName(record)).charAt(0)}
              </div>
              <div>
                <div className="font-medium text-foreground">{getUserDisplayName(record)}</div>
                <div className="text-xs text-muted-foreground">
                  {getUserIdentity(record)}
                  {record.email ? ` / ${record.email}` : ''}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        header: t('access.role.config'),
        id: 'roles',
        size: 180,
        cell: ({ row }) => {
          const record = row.original;
          const roleLabels = record.roleNames?.length
            ? record.roleNames
            : (record.roleIds || []).map(
                id => roleNameById.get(id) || t('access.role.fallback', { id })
              );
          return (
            <div className="flex flex-wrap gap-2">
              {roleLabels.map(role => (
                <Badge key={role} variant="info" className="capitalize">
                  {role}
                </Badge>
              ))}
              {!roleLabels.length && (
                <span className="text-xs text-muted-foreground">{t('access.role.unassigned')}</span>
              )}
            </div>
          );
        },
      },
      {
        header: t('access.permission.name'),
        id: 'permissions',
        cell: ({ row }) => {
          const record = row.original;
          if (isAdminUser(record)) {
            return (
              <div className="flex flex-wrap gap-2">
                <Badge size="sm" variant="info">
                  {t('access.permission.admin')}
                </Badge>
                <Badge size="sm" variant="warning">
                  {t('access.permission.all')}
                </Badge>
              </div>
            );
          }

          const permissionCodes = record.permissionCodes || record.permissions || [];
          const permissionNames = permissionCodes.map(
            code => permissionNameByCode.get(code) || code
          );
          const preview = permissionNames.slice(0, 3);
          const restCount = permissionNames.length - preview.length;

          return (
            <div className="flex flex-wrap gap-2">
              {preview.map(name => (
                <Badge key={name} size="sm">
                  {name}
                </Badge>
              ))}
              {restCount > 0 && (
                <Badge size="sm" variant="warning">
                  +{restCount}
                </Badge>
              )}
              {permissionNames.length === 0 && (
                <span className="text-xs text-muted-foreground">
                  {t('access.permission.unassigned')}
                </span>
              )}
            </div>
          );
        },
      },
      {
        header: t('common.status'),
        id: 'status',
        size: 120,
        cell: ({ row }) => {
          const record = row.original;
          return (
            <Badge variant={getStatusVariant(record.valid ?? record.status)}>
              {record.valid === 0 || record.status === 'disabled' || record.status === 'inactive'
                ? t('access.status.disabled')
                : t('access.status.enabled')}
            </Badge>
          );
        },
      },
      {
        header: t('common.actions'),
        id: 'actions',
        size: 140,
        cell: ({ row }) => {
          const record = row.original;
          const adminUser = isAdminUser(record);
          return (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenUserRoleModal(record)}
                disabled={adminUser}
              >
                {t('access.actions.authorize')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => onOpenPasswordModal(record)}>
                {t('access.actions.password')}
              </Button>
            </div>
          );
        },
      },
    ],
    [
      getUserDisplayName,
      getUserIdentity,
      onOpenPasswordModal,
      onOpenUserRoleModal,
      permissionNameByCode,
      roleNameById,
      t,
    ]
  );

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="w-full max-w-md">
          <Input
            placeholder={t('access.user.search_placeholder')}
            value={keyword}
            onChange={event => onKeywordChange(event.target.value)}
            leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCreateUser}>
            {t('access.user.create')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateRole}
            icon={<PlusIcon className="h-4 w-4" />}
          >
            {t('access.role.config')}
          </Button>
        </div>
      </div>

      <VirtualTable
        columns={columns}
        data={filteredUsers}
        getRowId={record => String(record.id)}
        loading={loading}
        emptyText={t('access.user.empty')}
        containerHeight={420}
        rowHeight={56}
        enableSorting={false}
      />
    </div>
  );
};
