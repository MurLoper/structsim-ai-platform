import { Pencil, Trash2 } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import type { TranslationParams } from '@/locales';
import type { MenuItem, Role, User } from '@/types';
import type { MenuRow, TableColumn } from './permissionsConfigTypes';
import { getUserDisplayName, getUserIdentity } from './permissionsConfigData';

type Translator = (key: string, params?: TranslationParams) => string;

export const buildUserColumns = ({
  onEdit,
  onDelete,
  t,
}: {
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  t: Translator;
}): TableColumn<User>[] => [
  {
    key: 'domainAccount',
    title: t('cfg.permissions.col.account_info'),
    render: (_: unknown, record: User) => (
      <div className="space-y-1">
        <div className="font-medium text-foreground">{getUserIdentity(record) || '-'}</div>
        <div className="text-xs text-muted-foreground">{record.email}</div>
      </div>
    ),
  },
  {
    key: 'realName',
    title: t('cfg.permissions.col.user_info'),
    render: (_: unknown, record: User) => (
      <div className="space-y-1">
        <div className="font-medium text-foreground">{getUserDisplayName(record) || '-'}</div>
        <div className="text-xs text-muted-foreground">
          {record.department || t('cfg.permissions.unset_department')}
        </div>
      </div>
    ),
  },
  {
    key: 'roleNames',
    title: t('cfg.permissions.col.roles'),
    render: (_: unknown, record: User) => (
      <div className="flex flex-wrap gap-2">
        {(record.roleNames || []).length > 0 ? (
          (record.roleNames || []).map(roleName => (
            <Badge key={roleName} size="sm" variant="info">
              {roleName}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">{t('cfg.permissions.unassigned')}</span>
        )}
      </div>
    ),
  },
  {
    key: 'dailyRoundLimit',
    title: t('cfg.permissions.col.daily_round_limit'),
    render: (_: unknown, record: User) => record.dailyRoundLimit ?? '-',
  },
  {
    key: 'valid',
    title: t('common.status'),
    render: (value: unknown) =>
      Number(value) === 1 ? (
        <Badge size="sm" variant="success">
          {t('common.enabled')}
        </Badge>
      ) : (
        <Badge size="sm">{t('common.disabled')}</Badge>
      ),
  },
  {
    key: 'actions',
    title: t('common.actions'),
    align: 'right',
    render: (_: unknown, record: User) => (
      <div className="flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          icon={<Pencil className="h-4 w-4" />}
          onClick={() => onEdit(record)}
        >
          {t('common.edit')}
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<Trash2 className="h-4 w-4" />}
          onClick={() => void onDelete(record)}
        >
          {t('common.delete')}
        </Button>
      </div>
    ),
  },
];

export const buildRoleColumns = ({
  onEdit,
  onDelete,
  t,
}: {
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  t: Translator;
}): TableColumn<Role>[] => [
  {
    key: 'name',
    title: t('cfg.permissions.col.roles'),
    render: (_: unknown, record: Role) => (
      <div className="space-y-1">
        <div className="font-medium text-foreground">{record.name}</div>
        <div className="text-xs text-muted-foreground">
          {record.code || t('cfg.permissions.unconfigured_code')}
        </div>
      </div>
    ),
  },
  {
    key: 'permissionIds',
    title: t('cfg.permissions.col.permission_count'),
    render: (_: unknown, record: Role) => (record.permissionIds || []).length,
  },
  {
    key: 'maxCpuCores',
    title: t('cfg.permissions.col.resource_quota'),
    render: (_: unknown, record: Role) => (
      <div className="space-y-1 text-sm">
        <div>{t('cfg.permissions.cpu_limit_value', { value: record.maxCpuCores ?? 192 })}</div>
        <div>{t('cfg.permissions.batch_limit_value', { value: record.maxBatchSize ?? 200 })}</div>
      </div>
    ),
  },
  {
    key: 'dailyRoundLimitDefault',
    title: t('cfg.permissions.col.daily_round_default'),
    render: (value: unknown) => <span>{value ? String(value) : '-'}</span>,
  },
  {
    key: 'valid',
    title: t('common.status'),
    render: (value: unknown) =>
      Number(value) === 1 ? (
        <Badge size="sm" variant="success">
          {t('common.enabled')}
        </Badge>
      ) : (
        <Badge size="sm">{t('common.disabled')}</Badge>
      ),
  },
  {
    key: 'actions',
    title: t('common.actions'),
    align: 'right',
    render: (_: unknown, record: Role) => (
      <div className="flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          icon={<Pencil className="h-4 w-4" />}
          onClick={() => onEdit(record)}
        >
          {t('common.edit')}
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<Trash2 className="h-4 w-4" />}
          onClick={() => void onDelete(record)}
        >
          {t('common.delete')}
        </Button>
      </div>
    ),
  },
];

export const buildMenuColumns = ({
  onEdit,
  onDelete,
  t,
}: {
  onEdit: (menu: MenuItem) => void;
  onDelete: (menu: MenuItem) => void;
  t: Translator;
}): TableColumn<MenuRow>[] => [
  {
    key: 'name',
    title: t('cfg.permissions.col.menu_name'),
    render: (_: unknown, record: MenuRow) => (
      <div className="space-y-1" style={{ paddingLeft: `${record.depth * 20}px` }}>
        <div className="font-medium text-foreground">{record.name}</div>
        <div className="text-xs text-muted-foreground">
          {record.titleI18nKey || t('cfg.permissions.no_i18n_key')}
        </div>
      </div>
    ),
  },
  {
    key: 'path',
    title: t('cfg.permissions.col.route_component'),
    render: (_: unknown, record: MenuRow) => (
      <div className="space-y-1 text-sm">
        <div>{record.path || '-'}</div>
        <div className="text-xs text-muted-foreground">{record.component || '-'}</div>
      </div>
    ),
  },
  {
    key: 'menuType',
    title: t('cfg.permissions.col.type_permission'),
    render: (_: unknown, record: MenuRow) => (
      <div className="space-y-1">
        <Badge size="sm" variant="info">
          {record.menuType || 'MENU'}
        </Badge>
        <div className="text-xs text-muted-foreground">
          {record.permissionCode || t('cfg.permissions.no_permission_code')}
        </div>
      </div>
    ),
  },
  {
    key: 'sort',
    title: t('cfg.permissions.col.sort_status'),
    render: (_: unknown, record: MenuRow) => (
      <div className="space-y-1">
        <div className="text-sm">
          {t('common.sort')}: {record.sort}
        </div>
        <div className="flex items-center gap-2">
          {record.hidden ? (
            <Badge size="sm">{t('cfg.permissions.hidden')}</Badge>
          ) : (
            <Badge size="sm" variant="success">
              {t('cfg.permissions.visible')}
            </Badge>
          )}
          {Number(record.valid) === 1 ? (
            <Badge size="sm" variant="success">
              {t('common.enabled')}
            </Badge>
          ) : (
            <Badge size="sm">{t('common.disabled')}</Badge>
          )}
        </div>
      </div>
    ),
  },
  {
    key: 'actions',
    title: t('common.actions'),
    align: 'right',
    render: (_: unknown, record: MenuRow) => (
      <div className="flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          icon={<Pencil className="h-4 w-4" />}
          onClick={() => onEdit(record)}
        >
          {t('common.edit')}
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<Trash2 className="h-4 w-4" />}
          onClick={() => void onDelete(record)}
        >
          {t('common.delete')}
        </Button>
      </div>
    ),
  },
];
