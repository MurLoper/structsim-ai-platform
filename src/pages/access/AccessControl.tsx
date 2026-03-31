import React, { useEffect, useMemo, useState } from 'react';
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  KeyIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

import { rbacApi } from '@/api';
import { Badge, Button, Card, CardHeader, Input, Tabs } from '@/components/ui';
import { BulkAssignPanel, PermissionMatrix, PermissionTree } from '@/components/access';
import { VirtualTable } from '@/components/tables/VirtualTable';
import type { ColumnDef } from '@tanstack/react-table';
import type { PermissionItem, Role, User } from '@/types';
import {
  PasswordModal,
  PermissionFormModal,
  RoleFormModal,
  RolePermissionModal,
  UserFormModal,
  UserRoleModal,
} from './components/AccessModals';

const getStatusVariant = (status?: string | number) => {
  if (status === 0 || status === 'disabled' || status === 'inactive') return 'error';
  if (status === 'pending') return 'warning';
  return 'success';
};

const permissionTypeOptions = [
  { value: 'PAGE', label: '页面权限' },
  { value: 'ACTION', label: '操作权限' },
  { value: 'DATA', label: '数据权限' },
  { value: 'OTHER', label: '其他' },
];

type UserFormState = {
  domainAccount: string;
  email: string;
  userName: string;
  realName: string;
  password: string;
  roleIds: number[];
  valid: number;
};

const getUserIdentity = (user: Pick<User, 'domainAccount' | 'id'>) => user.domainAccount || user.id;

const getUserDisplayName = (
  user: Pick<User, 'realName' | 'userName' | 'displayName' | 'domainAccount' | 'id' | 'email'>
) => user.realName || user.userName || user.displayName || getUserIdentity(user) || user.email;

const AccessControl: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  const [isUserModalOpen, setUserModalOpen] = useState(false);
  const [editingUserForm, setEditingUserForm] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<UserFormState>({
    domainAccount: '',
    email: '',
    userName: '',
    realName: '',
    password: '',
    roleIds: [] as number[],
    valid: 1,
  });
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<User | null>(null);
  const [passwordValue, setPasswordValue] = useState('');

  const [isRoleModalOpen, setRoleModalOpen] = useState(false);

  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({ name: '', code: '', description: '' });
  const [rolePermissionTarget, setRolePermissionTarget] = useState<Role | null>(null);
  const [isRolePermissionModalOpen, setRolePermissionModalOpen] = useState(false);
  const [rolePermissionIds, setRolePermissionIds] = useState<number[]>([]);

  const [isPermissionModalOpen, setPermissionModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<PermissionItem | null>(null);
  const [permissionForm, setPermissionForm] = useState({
    name: '',
    code: '',
    type: 'PAGE',
    resource: '',
    description: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes, permsRes] = await Promise.all([
        rbacApi.getUsers(),
        rbacApi.getRoles(),
        rbacApi.getPermissions(),
      ]);
      setUsers(Array.isArray(usersRes?.data) ? usersRes.data : []);
      setRoles(Array.isArray(rolesRes?.data) ? rolesRes.data : []);
      setPermissions(Array.isArray(permsRes?.data) ? permsRes.data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const permissionNameByCode = useMemo(() => {
    const map = new Map<string, string>();
    permissions.forEach(item => map.set(item.code, item.name));
    return map;
  }, [permissions]);

  const isAdminUser = (user: User) =>
    user.roleCodes?.includes('ADMIN') || user.email?.toLowerCase() === 'alice@sim.com';

  const isAdminRole = (role: Role) => role.code === 'ADMIN';

  const roleNameById = useMemo(() => {
    const map = new Map<number, string>();
    roles.forEach(role => map.set(role.id, role.name));
    return map;
  }, [roles]);

  const filteredUsers = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    if (!key) return users;
    return users.filter(u => {
      const name = u.realName || u.userName || u.domainAccount || '';
      return [name, u.email, u.roleNames?.join(' '), u.roleCodes?.join(' ')]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(key));
    });
  }, [users, keyword]);

  const permissionCount = useMemo(() => permissions.length, [permissions]);

  const rolePermissionMap = useMemo(() => {
    const map: Record<number, number[]> = {};
    roles.forEach(role => {
      map[role.id] = role.permissionIds || [];
    });
    return map;
  }, [roles]);

  const openUserRoleModal = (user: User) => {
    setEditingUser(user);
    setSelectedRoleIds(user.roleIds || []);
  };

  const openUserModal = (user?: User) => {
    setEditingUserForm(user || null);
    setUserForm({
      domainAccount: user ? getUserIdentity(user) : '',
      email: user?.email || '',
      userName: user?.userName || '',
      realName: user?.realName || '',
      password: '',
      roleIds: user?.roleIds || [],
      valid: user?.valid ?? 1,
    });
    setUserModalOpen(true);
  };

  const openPasswordModal = (user: User) => {
    setPasswordTarget(user);
    setPasswordValue('');
    setPasswordModalOpen(true);
  };

  const saveUser = async () => {
    const payload = {
      domain_account: userForm.domainAccount.trim(),
      email: userForm.email.trim(),
      user_name: userForm.userName.trim() || null,
      real_name: userForm.realName.trim() || null,
      password: userForm.password || undefined,
      role_ids: userForm.roleIds,
      valid: userForm.valid,
    };
    if (editingUserForm) {
      await rbacApi.updateUser(getUserIdentity(editingUserForm), payload);
    } else {
      await rbacApi.createUser(payload);
    }
    setUserModalOpen(false);
    setEditingUserForm(null);
    await loadData();
  };

  const saveUserRoles = async () => {
    if (!editingUser) return;
    await rbacApi.updateUser(getUserIdentity(editingUser), { role_ids: selectedRoleIds });
    setEditingUser(null);
    await loadData();
  };

  const savePassword = async () => {
    if (!passwordTarget) return;
    await rbacApi.updateUser(getUserIdentity(passwordTarget), { password: passwordValue });
    setPasswordTarget(null);
    setPasswordValue('');
    setPasswordModalOpen(false);
    await loadData();
  };

  const openRoleModal = (role?: Role) => {
    setEditingRole(role || null);
    setRoleForm({
      name: role?.name || '',
      code: role?.code || '',
      description: role?.description || '',
    });
    setRoleModalOpen(true);
  };

  const openRolePermissionModal = (role: Role) => {
    setRolePermissionTarget(role);
    setRolePermissionIds(role.permissionIds || []);
    setRolePermissionModalOpen(true);
  };

  const saveRole = async () => {
    if (editingRole) {
      await rbacApi.updateRole(editingRole.id, { ...roleForm });
    } else {
      await rbacApi.createRole({ ...roleForm });
    }
    setRoleModalOpen(false);
    setEditingRole(null);
    await loadData();
  };

  const saveRolePermissions = async () => {
    if (!rolePermissionTarget) return;
    await rbacApi.updateRole(rolePermissionTarget.id, { permissionIds: rolePermissionIds });
    setRolePermissionTarget(null);
    setRolePermissionIds([]);
    setRolePermissionModalOpen(false);
    await loadData();
  };

  const openPermissionModal = (permission?: PermissionItem) => {
    setEditingPermission(permission || null);
    setPermissionForm({
      name: permission?.name || '',
      code: permission?.code || '',
      type: permission?.type || 'PAGE',
      resource: permission?.resource || '',
      description: permission?.description || '',
    });
    setPermissionModalOpen(true);
  };

  const savePermission = async () => {
    if (editingPermission) {
      await rbacApi.updatePermission(editingPermission.id, { ...permissionForm });
    } else {
      await rbacApi.createPermission({ ...permissionForm });
    }
    setPermissionModalOpen(false);
    setEditingPermission(null);
    await loadData();
  };

  const toggleRolePermission = async (roleId: number, permissionId: number) => {
    const current = rolePermissionMap[roleId] || [];
    const next = current.includes(permissionId)
      ? current.filter(id => id !== permissionId)
      : [...current, permissionId];
    await rbacApi.updateRole(roleId, { permissionIds: next });
    await loadData();
  };

  const userColumns: ColumnDef<User>[] = [
    {
      header: '用户',
      accessorKey: 'domainAccount',
      cell: ({ row }) => {
        const record = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 flex items-center justify-center font-semibold">
              {getUserDisplayName(record).charAt(0)}
            </div>
            <div>
              <div className="font-medium text-slate-900 dark:text-white">
                {getUserDisplayName(record)}
              </div>
              <div className="text-xs text-slate-500">
                {getUserIdentity(record)} {record.email ? `· ${record.email}` : ''}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: '角色',
      id: 'roles',
      size: 180,
      cell: ({ row }) => {
        const record = row.original;
        const roleLabels = record.roleNames?.length
          ? record.roleNames
          : (record.roleIds || []).map(id => roleNameById.get(id) || `角色${id}`);
        return (
          <div className="flex flex-wrap gap-2">
            {(roleLabels || []).map(role => (
              <Badge key={role} variant="info" className="capitalize">
                {role}
              </Badge>
            ))}
            {!roleLabels?.length && <span className="text-xs text-slate-400">未分配</span>}
          </div>
        );
      },
    },
    {
      header: '权限',
      id: 'permissions',
      cell: ({ row }) => {
        const record = row.original;
        if (isAdminUser(record)) {
          return (
            <div className="flex flex-wrap gap-2">
              <Badge size="sm" variant="info">
                管理员
              </Badge>
              <Badge size="sm" variant="warning">
                全部权限
              </Badge>
            </div>
          );
        }
        const permissionCodes = record.permissionCodes || record.permissions || [];
        const permissionNames = permissionCodes.map(code => permissionNameByCode.get(code) || code);
        const display = permissionNames.slice(0, 3);
        const rest = permissionNames.length - display.length;
        return (
          <div className="flex flex-wrap gap-2">
            {display.map(name => (
              <Badge key={name} size="sm">
                {name}
              </Badge>
            ))}
            {rest > 0 && (
              <Badge size="sm" variant="warning">
                +{rest}
              </Badge>
            )}
            {permissionNames.length === 0 && <span className="text-xs text-slate-400">未分配</span>}
          </div>
        );
      },
    },
    {
      header: '状态',
      id: 'status',
      size: 120,
      cell: ({ row }) => {
        const record = row.original;
        return (
          <Badge variant={getStatusVariant(record.valid ?? record.status)}>
            {record.valid === 0 || record.status === 'disabled' || record.status === 'inactive'
              ? '禁用'
              : '启用'}
          </Badge>
        );
      },
    },
    {
      header: '操作',
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
              onClick={() => openUserRoleModal(record)}
              disabled={adminUser}
            >
              授权
            </Button>
            <Button variant="outline" size="sm" onClick={() => openPasswordModal(record)}>
              密码
            </Button>
          </div>
        );
      },
    },
  ];

  const roleColumns: ColumnDef<Role>[] = [
    {
      header: '角色',
      accessorKey: 'name',
      cell: ({ row }) => {
        const record = row.original;
        return (
          <div>
            <div className="font-medium text-slate-900 dark:text-white">{record.name}</div>
            {record.description && (
              <div className="text-xs text-slate-500">{record.description}</div>
            )}
          </div>
        );
      },
    },
    {
      header: '编码',
      id: 'code',
      size: 160,
      cell: ({ row }) => <Badge size="sm">{row.original.code || '—'}</Badge>,
    },
    {
      header: '权限数',
      id: 'permissionCount',
      size: 120,
      cell: ({ row }) => (
        <span className="text-sm text-slate-600 dark:text-slate-300">
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
              onClick={() => openRoleModal(record)}
              disabled={adminRole}
            >
              编辑
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openRolePermissionModal(record)}
              disabled={adminRole}
            >
              配权限
            </Button>
          </div>
        );
      },
    },
  ];

  const permissionColumns: ColumnDef<PermissionItem>[] = [
    {
      header: '权限点',
      accessorKey: 'name',
      cell: ({ row }) => {
        const record = row.original;
        return (
          <div>
            <div className="font-medium text-slate-900 dark:text-white">{record.name}</div>
            {record.description && (
              <div className="text-xs text-slate-500">{record.description}</div>
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
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {row.original.resource || '—'}
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
      size: 120,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => openPermissionModal(row.original)}>
            编辑
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">访问权限</h1>
          <p className="text-slate-500 mt-1">统一管理用户、角色与权限，保证访问安全与可追溯</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            刷新数据
          </Button>
          <Button
            variant="outline"
            onClick={() => openUserModal()}
            icon={<PlusIcon className="w-4 h-4" />}
          >
            新增用户
          </Button>
          <Button onClick={() => openRoleModal()} icon={<PlusIcon className="w-4 h-4" />}>
            新增角色
          </Button>
          <Button
            variant="outline"
            onClick={() => openPermissionModal()}
            icon={<PlusIcon className="w-4 h-4" />}
          >
            新增权限
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader
            title="用户规模"
            subtitle="当前已纳管用户"
            icon={<UserGroupIcon className="w-5 h-5" />}
          />
          <div className="text-3xl font-semibold text-slate-900 dark:text-white">
            {users.length}
          </div>
        </Card>
        <Card>
          <CardHeader
            title="权限点"
            subtitle="系统内权限总量"
            icon={<KeyIcon className="w-5 h-5" />}
          />
          <div className="text-3xl font-semibold text-slate-900 dark:text-white">
            {permissionCount}
          </div>
        </Card>
        <Card>
          <CardHeader
            title="访问策略"
            subtitle="核心模块控制状态"
            icon={<ShieldCheckIcon className="w-5 h-5" />}
          />
          <div className="text-sm text-slate-500">已启用路由权限守卫与登录态校验</div>
        </Card>
      </div>

      <Card padding="none">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <Tabs
            items={[
              { key: 'users', label: '用户权限', icon: <UserGroupIcon className="w-4 h-4" /> },
              { key: 'roles', label: '角色管理', icon: <ShieldCheckIcon className="w-4 h-4" /> },
              { key: 'perms', label: '权限点', icon: <KeyIcon className="w-4 h-4" /> },
            ]}
            activeKey={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {activeTab === 'users' && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
              <div className="max-w-md w-full">
                <Input
                  placeholder="搜索用户、邮箱或角色"
                  value={keyword}
                  onChange={event => setKeyword(event.target.value)}
                  leftIcon={<MagnifyingGlassIcon className="w-4 h-4" />}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => openUserModal()}>
                  新增用户
                </Button>
                <Button variant="outline" size="sm" onClick={() => openRoleModal()}>
                  新增角色
                </Button>
              </div>
            </div>

            <VirtualTable
              columns={userColumns}
              data={filteredUsers}
              getRowId={record => String(record.id)}
              loading={loading}
              emptyText="暂无用户数据"
              containerHeight={420}
              rowHeight={56}
              enableSorting={false}
            />
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">角色列表</h2>
                <p className="text-sm text-slate-500">配置角色与权限集合，支持批量授权</p>
              </div>
              <Button
                variant="outline"
                onClick={() => openRoleModal()}
                icon={<PlusIcon className="w-4 h-4" />}
              >
                新增角色
              </Button>
            </div>

            <VirtualTable
              columns={roleColumns}
              data={roles}
              getRowId={record => String(record.id)}
              loading={loading}
              emptyText="暂无角色"
              containerHeight={360}
              rowHeight={52}
              enableSorting={false}
            />

            <BulkAssignPanel
              roles={roles}
              permissions={permissions}
              onApply={async (roleId, permissionIds) => {
                await rbacApi.updateRole(roleId, { permissionIds });
                await loadData();
              }}
            />

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                权限矩阵
                <Badge size="sm">{permissions.length}</Badge>
              </div>
              <PermissionMatrix
                roles={roles}
                permissions={permissions}
                rolePermissionMap={rolePermissionMap}
                onToggle={toggleRolePermission}
              />
            </div>
          </div>
        )}

        {activeTab === 'perms' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">权限点管理</h2>
                <p className="text-sm text-slate-500">统一维护权限点、类型与资源归属</p>
              </div>
              <Button
                variant="outline"
                onClick={() => openPermissionModal()}
                icon={<PlusIcon className="w-4 h-4" />}
              >
                新增权限
              </Button>
            </div>

            <VirtualTable
              columns={permissionColumns}
              data={permissions}
              getRowId={record => String(record.id)}
              loading={loading}
              emptyText="暂无权限点"
              containerHeight={360}
              rowHeight={52}
              enableSorting={false}
            />

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                权限树
                <Badge size="sm">{permissions.length}</Badge>
              </div>
              <PermissionTree permissions={permissions} selectedIds={[]} readOnly />
            </div>
          </div>
        )}
      </Card>

      <UserRoleModal
        editingUser={editingUser}
        roles={roles}
        selectedRoleIds={selectedRoleIds}
        onClose={() => setEditingUser(null)}
        onSave={saveUserRoles}
        onToggleRole={(roleId, checked) =>
          setSelectedRoleIds(prev =>
            checked ? prev.filter(id => id !== roleId) : [...prev, roleId]
          )
        }
        getUserDisplayName={getUserDisplayName}
      />

      <UserFormModal
        isOpen={isUserModalOpen}
        editingUserForm={editingUserForm}
        userForm={userForm}
        roles={roles}
        onClose={() => {
          setUserModalOpen(false);
          setEditingUserForm(null);
        }}
        onSave={saveUser}
        onFieldChange={(field, value) => setUserForm(prev => ({ ...prev, [field]: value }))}
        onToggleRole={(roleId, checked) =>
          setUserForm(prev => ({
            ...prev,
            roleIds: checked ? prev.roleIds.filter(id => id !== roleId) : [...prev.roleIds, roleId],
          }))
        }
      />

      <PasswordModal
        isOpen={isPasswordModalOpen}
        passwordTarget={passwordTarget}
        passwordValue={passwordValue}
        onClose={() => {
          setPasswordModalOpen(false);
          setPasswordTarget(null);
        }}
        onSave={savePassword}
        onChange={setPasswordValue}
        getUserDisplayName={getUserDisplayName}
      />

      <RoleFormModal
        isOpen={isRoleModalOpen}
        editingRole={editingRole}
        roleForm={roleForm}
        onClose={() => {
          setRoleModalOpen(false);
          setEditingRole(null);
        }}
        onSave={saveRole}
        onFieldChange={(field, value) => setRoleForm(prev => ({ ...prev, [field]: value }))}
      />

      <RolePermissionModal
        isOpen={isRolePermissionModalOpen}
        rolePermissionTarget={rolePermissionTarget}
        rolePermissionIds={rolePermissionIds}
        permissions={permissions}
        onClose={() => {
          setRolePermissionTarget(null);
          setRolePermissionModalOpen(false);
        }}
        onSave={saveRolePermissions}
        onChange={setRolePermissionIds}
      />

      <PermissionFormModal
        isOpen={isPermissionModalOpen}
        editingPermission={editingPermission}
        permissionForm={permissionForm}
        permissionTypeOptions={permissionTypeOptions}
        onClose={() => setPermissionModalOpen(false)}
        onSave={savePermission}
        onFieldChange={(field, value) => setPermissionForm(prev => ({ ...prev, [field]: value }))}
      />
    </div>
  );
};

export default AccessControl;
