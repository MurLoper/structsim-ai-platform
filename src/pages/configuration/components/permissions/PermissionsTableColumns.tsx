import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import type { MenuItem, Role, User } from '@/types';
import type { MenuRow, TableColumn } from './permissionsConfigTypes';
import { getUserDisplayName, getUserIdentity } from './permissionsConfigData';

export const buildUserColumns = ({
  onEdit,
  onDelete,
}: {
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}): TableColumn<User>[] => [
  {
    key: 'domainAccount',
    title: '账号信息',
    render: (_: unknown, record: User) => (
      <div className="space-y-1">
        <div className="font-medium text-foreground">{getUserIdentity(record) || '-'}</div>
        <div className="text-xs text-muted-foreground">{record.email}</div>
      </div>
    ),
  },
  {
    key: 'realName',
    title: '用户信息',
    render: (_: unknown, record: User) => (
      <div className="space-y-1">
        <div className="font-medium text-foreground">{getUserDisplayName(record) || '-'}</div>
        <div className="text-xs text-muted-foreground">{record.department || '未设置部门'}</div>
      </div>
    ),
  },
  {
    key: 'roleNames',
    title: '权限组',
    render: (_: unknown, record: User) => (
      <div className="flex flex-wrap gap-2">
        {(record.roleNames || []).length > 0 ? (
          (record.roleNames || []).map(roleName => (
            <Badge key={roleName} size="sm" variant="info">
              {roleName}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">未分配</span>
        )}
      </div>
    ),
  },
  {
    key: 'dailyRoundLimit',
    title: '日轮次上限',
    render: (_: unknown, record: User) => record.dailyRoundLimit ?? '-',
  },
  {
    key: 'valid',
    title: '状态',
    render: (value: unknown) =>
      Number(value) === 1 ? (
        <Badge size="sm" variant="success">
          启用
        </Badge>
      ) : (
        <Badge size="sm">停用</Badge>
      ),
  },
  {
    key: 'actions',
    title: '操作',
    align: 'right',
    render: (_: unknown, record: User) => (
      <div className="flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          icon={<Pencil className="h-4 w-4" />}
          onClick={() => onEdit(record)}
        >
          编辑
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<Trash2 className="h-4 w-4" />}
          onClick={() => void onDelete(record)}
        >
          删除
        </Button>
      </div>
    ),
  },
];

export const buildRoleColumns = ({
  onEdit,
  onDelete,
}: {
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
}): TableColumn<Role>[] => [
  {
    key: 'name',
    title: '权限组',
    render: (_: unknown, record: Role) => (
      <div className="space-y-1">
        <div className="font-medium text-foreground">{record.name}</div>
        <div className="text-xs text-muted-foreground">{record.code || '未配置编码'}</div>
      </div>
    ),
  },
  {
    key: 'permissionIds',
    title: '权限数量',
    render: (_: unknown, record: Role) => (record.permissionIds || []).length,
  },
  {
    key: 'maxCpuCores',
    title: '资源额度',
    render: (_: unknown, record: Role) => (
      <div className="space-y-1 text-sm">
        <div>CPU 上限: {record.maxCpuCores ?? 192}</div>
        <div>批量上限: {record.maxBatchSize ?? 200}</div>
      </div>
    ),
  },
  {
    key: 'dailyRoundLimitDefault',
    title: '日轮次默认值',
    render: (value: unknown) => <span>{value ? String(value) : '-'}</span>,
  },
  {
    key: 'valid',
    title: '状态',
    render: (value: unknown) =>
      Number(value) === 1 ? (
        <Badge size="sm" variant="success">
          启用
        </Badge>
      ) : (
        <Badge size="sm">停用</Badge>
      ),
  },
  {
    key: 'actions',
    title: '操作',
    align: 'right',
    render: (_: unknown, record: Role) => (
      <div className="flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          icon={<Pencil className="h-4 w-4" />}
          onClick={() => onEdit(record)}
        >
          编辑
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<Trash2 className="h-4 w-4" />}
          onClick={() => void onDelete(record)}
        >
          删除
        </Button>
      </div>
    ),
  },
];

export const buildMenuColumns = ({
  onEdit,
  onDelete,
}: {
  onEdit: (menu: MenuItem) => void;
  onDelete: (menu: MenuItem) => void;
}): TableColumn<MenuRow>[] => [
  {
    key: 'name',
    title: '菜单名称',
    render: (_: unknown, record: MenuRow) => (
      <div className="space-y-1" style={{ paddingLeft: `${record.depth * 20}px` }}>
        <div className="font-medium text-foreground">{record.name}</div>
        <div className="text-xs text-muted-foreground">
          {record.titleI18nKey || '未配置 i18n key'}
        </div>
      </div>
    ),
  },
  {
    key: 'path',
    title: '路由与组件',
    render: (_: unknown, record: MenuRow) => (
      <div className="space-y-1 text-sm">
        <div>{record.path || '-'}</div>
        <div className="text-xs text-muted-foreground">{record.component || '-'}</div>
      </div>
    ),
  },
  {
    key: 'menuType',
    title: '类型 / 权限',
    render: (_: unknown, record: MenuRow) => (
      <div className="space-y-1">
        <Badge size="sm" variant="info">
          {record.menuType || 'MENU'}
        </Badge>
        <div className="text-xs text-muted-foreground">{record.permissionCode || '无权限码'}</div>
      </div>
    ),
  },
  {
    key: 'sort',
    title: '排序 / 状态',
    render: (_: unknown, record: MenuRow) => (
      <div className="space-y-1">
        <div className="text-sm">排序: {record.sort}</div>
        <div className="flex items-center gap-2">
          {record.hidden ? (
            <Badge size="sm">隐藏</Badge>
          ) : (
            <Badge size="sm" variant="success">
              显示
            </Badge>
          )}
          {Number(record.valid) === 1 ? (
            <Badge size="sm" variant="success">
              启用
            </Badge>
          ) : (
            <Badge size="sm">停用</Badge>
          )}
        </div>
      </div>
    ),
  },
  {
    key: 'actions',
    title: '操作',
    align: 'right',
    render: (_: unknown, record: MenuRow) => (
      <div className="flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          icon={<Pencil className="h-4 w-4" />}
          onClick={() => onEdit(record)}
        >
          编辑
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<Trash2 className="h-4 w-4" />}
          onClick={() => void onDelete(record)}
        >
          删除
        </Button>
      </div>
    ),
  },
];
