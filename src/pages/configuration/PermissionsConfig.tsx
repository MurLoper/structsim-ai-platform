import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MenuSquare, Pencil, Plus, RefreshCw, Shield, Trash2, Users } from 'lucide-react';
import { BulkAssignPanel, PermissionMatrix } from '@/components/access';
import { Badge, Button, Card, CardHeader, Table, useToast } from '@/components/ui';
import { rbacApi } from '@/api/rbac';
import { useMenuStore } from '@/stores/menuStore';
import type { MenuItem, PermissionItem, Role, User } from '@/types';
import { ConfigTabs, type TabItem } from './components';
import {
  MenuFormModal,
  RoleFormModal,
  UserFormModal,
  type MenuFormState,
  type RoleFormState,
  type UserFormState,
} from './components/permissions/PermissionsFormModals';

type ActiveTab = 'users' | 'roles' | 'menus';

type MenuRow = MenuItem & { depth: number };
type TableColumn<T extends object> = {
  key: string;
  title: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
};

const TABS: TabItem[] = [
  { key: 'users', label: '用户管理', icon: <Users className="w-4 h-4" /> },
  { key: 'roles', label: '权限组管理', icon: <Shield className="w-4 h-4" /> },
  { key: 'menus', label: '菜单管理', icon: <MenuSquare className="w-4 h-4" /> },
];

const MENU_TYPE_OPTIONS = [
  { value: 'DIRECTORY', label: '目录' },
  { value: 'MENU', label: '菜单' },
  { value: 'BUTTON', label: '按钮' },
];

const createEmptyUserForm = (): UserFormState => ({
  email: '',
  domainAccount: '',
  lcUserId: '',
  userName: '',
  realName: '',
  department: '',
  dailyRoundLimit: '',
  roleIds: [],
  valid: true,
});

const createEmptyRoleForm = (): RoleFormState => ({
  name: '',
  code: '',
  description: '',
  permissionIds: [],
  maxCpuCores: '192',
  maxBatchSize: '200',
  dailyRoundLimitDefault: '500',
  nodeList: '',
  sort: '100',
  valid: true,
});

const createEmptyMenuForm = (): MenuFormState => ({
  parentId: '0',
  name: '',
  titleI18nKey: '',
  icon: '',
  path: '',
  component: '',
  menuType: 'MENU',
  permissionCode: '',
  hidden: false,
  valid: true,
  sort: '100',
});

const normalizeMenu = (menu: MenuItem): MenuItem => ({
  ...menu,
  parentId: menu.parentId ?? 0,
  menuType: menu.menuType || 'MENU',
  hidden: Boolean(menu.hidden),
  valid: menu.valid ?? 1,
  children: menu.children ?? [],
});

const buildFlatMenuRows = (items: MenuItem[]): MenuRow[] => {
  const normalized = items.map(normalizeMenu);
  const childrenMap = new Map<number, MenuItem[]>();
  const roots: MenuItem[] = [];

  normalized.forEach(item => {
    const parentId = item.parentId ?? 0;
    if (parentId > 0) {
      const bucket = childrenMap.get(parentId) ?? [];
      bucket.push(item);
      childrenMap.set(parentId, bucket);
      return;
    }
    roots.push(item);
  });

  const sortMenus = (menus: MenuItem[]) =>
    [...menus].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.id - b.id);

  const rows: MenuRow[] = [];
  const walk = (menu: MenuItem, depth: number) => {
    rows.push({ ...menu, depth });
    const children = sortMenus(childrenMap.get(menu.id) ?? []);
    children.forEach(child => walk(child, depth + 1));
  };

  sortMenus(roots).forEach(root => walk(root, 0));
  return rows;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null) {
    const maybeMessage = (error as { message?: string }).message;
    if (maybeMessage) return maybeMessage;
    const response = (error as { response?: { data?: { msg?: string; message?: string } } })
      .response;
    if (response?.data?.msg) return response.data.msg;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
};

const getUserIdentity = (user: Pick<User, 'domainAccount' | 'id'>) => user.domainAccount || user.id;

const getUserDisplayName = (
  user: Pick<User, 'realName' | 'userName' | 'displayName' | 'domainAccount' | 'id' | 'email'>
) => user.realName || user.userName || user.displayName || getUserIdentity(user) || user.email;

const PermissionsConfig: React.FC = () => {
  const { showToast } = useToast();
  const clearMenus = useMenuStore(state => state.clearMenus);
  const fetchMenus = useMenuStore(state => state.fetchMenus);

  const [activeTab, setActiveTab] = useState<ActiveTab>('users');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [menuModalOpen, setMenuModalOpen] = useState(false);

  const [userForm, setUserForm] = useState<UserFormState>(createEmptyUserForm());
  const [roleForm, setRoleForm] = useState<RoleFormState>(createEmptyRoleForm());
  const [menuForm, setMenuForm] = useState<MenuFormState>(createEmptyMenuForm());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes, permissionsRes, menusRes] = await Promise.all([
        rbacApi.getUsers(),
        rbacApi.getRoles(),
        rbacApi.getPermissions(),
        rbacApi.getMenus(),
      ]);
      setUsers(usersRes.data || []);
      setRoles(rolesRes.data || []);
      setPermissions(permissionsRes.data || []);
      setMenus((menusRes.data || []).map(normalizeMenu));
    } catch (error) {
      showToast('error', getErrorMessage(error, '加载权限配置失败'));
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const refreshSidebarMenus = useCallback(async () => {
    try {
      clearMenus();
      await fetchMenus();
    } catch (error) {
      console.error('刷新侧边栏菜单失败', error);
    }
  }, [clearMenus, fetchMenus]);

  const handleDeleteUser = useCallback(
    async (user: User) => {
      if (
        !window.confirm(
          `确定删除用户“${user.realName || user.userName || user.domainAccount || user.email}”吗？`
        )
      ) {
        return;
      }
      try {
        await rbacApi.deleteUser(getUserIdentity(user));
        showToast('success', '用户已删除');
        await loadData();
      } catch (error) {
        showToast('error', getErrorMessage(error, '删除用户失败'));
      }
    },
    [loadData, showToast]
  );

  const handleDeleteRole = useCallback(
    async (role: Role) => {
      if (!window.confirm(`确定删除权限组“${role.name}”吗？`)) {
        return;
      }
      try {
        await rbacApi.deleteRole(role.id);
        showToast('success', '权限组已删除');
        await loadData();
      } catch (error) {
        showToast('error', getErrorMessage(error, '删除权限组失败'));
      }
    },
    [loadData, showToast]
  );

  const handleDeleteMenu = useCallback(
    async (menu: MenuItem) => {
      if (!window.confirm(`确定删除菜单“${menu.name}”吗？如果有子菜单，需要先删除子菜单。`)) {
        return;
      }
      try {
        await rbacApi.deleteMenu(menu.id);
        showToast('success', '菜单已删除');
        await loadData();
        await refreshSidebarMenus();
      } catch (error) {
        showToast('error', getErrorMessage(error, '删除菜单失败'));
      }
    },
    [loadData, refreshSidebarMenus, showToast]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const menuParentOptions = useMemo(
    () => [
      { value: '0', label: '作为顶级菜单' },
      ...buildFlatMenuRows(menus)
        .filter(item => item.id !== menuForm.id)
        .map(item => ({
          value: String(item.id),
          label: `${'\u3000'.repeat(item.depth)}${item.name}`,
        })),
    ],
    [menus, menuForm.id]
  );

  const rolePermissionMap = useMemo(
    () =>
      roles.reduce<Record<number, number[]>>((acc, role) => {
        acc[role.id] = role.permissionIds || [];
        return acc;
      }, {}),
    [roles]
  );

  const menuRows = useMemo(() => buildFlatMenuRows(menus), [menus]);

  const userColumns = useMemo<TableColumn<User>[]>(
    () => [
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
        align: 'right' as const,
        render: (_: unknown, record: User) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              icon={<Pencil className="w-4 h-4" />}
              onClick={() => openEditUser(record)}
            >
              编辑
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={() => void handleDeleteUser(record)}
            >
              删除
            </Button>
          </div>
        ),
      },
    ],
    [handleDeleteUser]
  );

  const roleColumns = useMemo<TableColumn<Role>[]>(
    () => [
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
        align: 'right' as const,
        render: (_: unknown, record: Role) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              icon={<Pencil className="w-4 h-4" />}
              onClick={() => openEditRole(record)}
            >
              编辑
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={() => void handleDeleteRole(record)}
            >
              删除
            </Button>
          </div>
        ),
      },
    ],
    [handleDeleteRole]
  );

  const menuColumns = useMemo<TableColumn<MenuRow>[]>(
    () => [
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
            <div className="text-xs text-muted-foreground">
              {record.permissionCode || '无权限码'}
            </div>
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
        align: 'right' as const,
        render: (_: unknown, record: MenuRow) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              icon={<Pencil className="w-4 h-4" />}
              onClick={() => openEditMenu(record)}
            >
              编辑
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={() => void handleDeleteMenu(record)}
            >
              删除
            </Button>
          </div>
        ),
      },
    ],
    [handleDeleteMenu]
  );

  const openCreateUser = () => {
    setUserForm(createEmptyUserForm());
    setUserModalOpen(true);
  };

  const openEditUser = (user: User) => {
    setUserForm({
      id: getUserIdentity(user),
      email: user.email || '',
      domainAccount: getUserIdentity(user),
      lcUserId: user.lcUserId || '',
      userName: user.userName || '',
      realName: user.realName || '',
      department: user.department || '',
      dailyRoundLimit:
        user.dailyRoundLimit === undefined || user.dailyRoundLimit === null
          ? ''
          : String(user.dailyRoundLimit),
      roleIds: user.roleIds || user.roleIdList || [],
      valid: Number(user.valid ?? 1) === 1,
    });
    setUserModalOpen(true);
  };

  const openCreateRole = () => {
    setRoleForm(createEmptyRoleForm());
    setRoleModalOpen(true);
  };

  const openEditRole = (role: Role) => {
    setRoleForm({
      id: role.id,
      name: role.name || '',
      code: role.code || '',
      description: role.description || '',
      permissionIds: role.permissionIds || [],
      maxCpuCores: String(role.maxCpuCores ?? 192),
      maxBatchSize: String(role.maxBatchSize ?? 200),
      dailyRoundLimitDefault: String(role.dailyRoundLimitDefault ?? 500),
      nodeList: (role.nodeList || []).join(','),
      sort: String(role.sort ?? 100),
      valid: Number(role.valid ?? 1) === 1,
    });
    setRoleModalOpen(true);
  };

  const openCreateMenu = () => {
    setMenuForm(createEmptyMenuForm());
    setMenuModalOpen(true);
  };

  const openEditMenu = (menu: MenuItem) => {
    setMenuForm({
      id: menu.id,
      parentId: String(menu.parentId ?? 0),
      name: menu.name || '',
      titleI18nKey: menu.titleI18nKey || '',
      icon: menu.icon || '',
      path: menu.path || '',
      component: menu.component || '',
      menuType: menu.menuType || 'MENU',
      permissionCode: menu.permissionCode || '',
      hidden: Boolean(menu.hidden),
      valid: Number(menu.valid ?? 1) === 1,
      sort: String(menu.sort ?? 100),
    });
    setMenuModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!userForm.email.trim() || !userForm.domainAccount.trim()) {
      showToast('warning', '请至少填写邮箱和域账号');
      return;
    }

    const payload = {
      email: userForm.email.trim(),
      domain_account: userForm.domainAccount.trim(),
      lc_user_id: userForm.lcUserId.trim() || null,
      user_name: userForm.userName.trim() || null,
      real_name: userForm.realName.trim() || null,
      department: userForm.department.trim() || null,
      role_ids: userForm.roleIds,
      daily_round_limit: userForm.dailyRoundLimit ? Number(userForm.dailyRoundLimit) : null,
      valid: userForm.valid ? 1 : 0,
    };

    setSaving(true);
    try {
      if (userForm.id) {
        await rbacApi.updateUser(userForm.id, payload);
        showToast('success', '用户信息已更新');
      } else {
        await rbacApi.createUser(payload);
        showToast('success', '用户已创建');
      }
      setUserModalOpen(false);
      await loadData();
    } catch (error) {
      showToast('error', getErrorMessage(error, '保存用户失败'));
    } finally {
      setSaving(false);
    }
  };

  const parseNodeList = (value: string) =>
    value
      .split(/[，,\s]+/)
      .map(item => item.trim())
      .filter(Boolean)
      .map(item => Number(item))
      .filter(item => Number.isFinite(item));

  const handleSaveRole = async () => {
    if (!roleForm.name.trim()) {
      showToast('warning', '请输入权限组名称');
      return;
    }

    const payload = {
      name: roleForm.name.trim(),
      code: roleForm.code.trim() || null,
      description: roleForm.description.trim() || null,
      permission_ids: roleForm.permissionIds,
      max_cpu_cores: Number(roleForm.maxCpuCores || 192),
      max_batch_size: Number(roleForm.maxBatchSize || 200),
      daily_round_limit_default: Number(roleForm.dailyRoundLimitDefault || 500),
      node_list: parseNodeList(roleForm.nodeList),
      sort: Number(roleForm.sort || 100),
      valid: roleForm.valid ? 1 : 0,
    };

    setSaving(true);
    try {
      if (roleForm.id) {
        await rbacApi.updateRole(roleForm.id, payload);
        showToast('success', '权限组已更新');
      } else {
        await rbacApi.createRole(payload);
        showToast('success', '权限组已创建');
      }
      setRoleModalOpen(false);
      await loadData();
    } catch (error) {
      showToast('error', getErrorMessage(error, '保存权限组失败'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRolePermission = async (roleId: number, permissionId: number) => {
    const targetRole = roles.find(item => item.id === roleId);
    if (!targetRole) return;

    const currentIds = targetRole.permissionIds || [];
    const nextIds = currentIds.includes(permissionId)
      ? currentIds.filter(id => id !== permissionId)
      : [...currentIds, permissionId];

    try {
      await rbacApi.updateRole(roleId, { permission_ids: nextIds });
      showToast('success', `已更新 ${targetRole.name} 的权限配置`);
      await loadData();
    } catch (error) {
      showToast('error', getErrorMessage(error, '更新权限矩阵失败'));
    }
  };

  const handleBulkApplyPermissions = async (roleId: number, permissionIds: number[]) => {
    const targetRole = roles.find(item => item.id === roleId);
    if (!targetRole) return;

    try {
      await rbacApi.updateRole(roleId, { permission_ids: permissionIds });
      showToast('success', `已批量更新 ${targetRole.name} 的权限配置`);
      await loadData();
    } catch (error) {
      showToast('error', getErrorMessage(error, '批量授权失败'));
    }
  };

  const handleSaveMenu = async () => {
    if (!menuForm.name.trim()) {
      showToast('warning', '请输入菜单名称');
      return;
    }

    const payload = {
      parent_id: Number(menuForm.parentId || 0),
      name: menuForm.name.trim(),
      title_i18n_key: menuForm.titleI18nKey.trim() || null,
      icon: menuForm.icon.trim() || null,
      path: menuForm.path.trim() || null,
      component: menuForm.component.trim() || null,
      menu_type: menuForm.menuType,
      permission_code: menuForm.permissionCode.trim() || null,
      hidden: menuForm.hidden ? 1 : 0,
      valid: menuForm.valid ? 1 : 0,
      sort: Number(menuForm.sort || 100),
    };

    setSaving(true);
    try {
      if (menuForm.id) {
        await rbacApi.updateMenu(menuForm.id, payload);
        showToast('success', '菜单已更新');
      } else {
        await rbacApi.createMenu(payload);
        showToast('success', '菜单已创建');
      }
      setMenuModalOpen(false);
      await loadData();
      await refreshSidebarMenus();
    } catch (error) {
      showToast('error', getErrorMessage(error, '保存菜单失败'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white eyecare:text-foreground">
            权限配置
          </h1>
          <p className="text-sm text-muted-foreground">
            先基于真实 RBAC 接口打通用户、权限组、菜单配置链路，便于提单、复显和 Mock
            结果联调。{' '}
          </p>
        </div>
        <Button
          variant="outline"
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={() => void loadData()}
          loading={loading}
        >
          刷新数据
        </Button>
      </div>

      <ConfigTabs
        tabs={TABS}
        activeTab={activeTab}
        onChange={key => setActiveTab(key as ActiveTab)}
      />

      {activeTab === 'users' && (
        <Card padding="none">
          <div className="p-6 pb-0">
            <CardHeader
              title="用户管理"
              subtitle="配置提单用户、角色归属和日轮次上限，确保申请单可正常构造和复显。"
              icon={<Users className="w-5 h-5" />}
              action={
                <Button icon={<Plus className="w-4 h-4" />} onClick={openCreateUser}>
                  新建用户
                </Button>
              }
            />
          </div>
          <Table
            columns={userColumns}
            data={users}
            rowKey={record => String(record.id)}
            loading={loading}
            emptyText="暂无用户数据"
          />
        </Card>
      )}

      {activeTab === 'roles' && (
        <div className="space-y-6">
          <Card padding="none">
            <div className="p-6 pb-0">
              <CardHeader
                title="权限组管理"
                subtitle="配置提单权限、资源额度和默认日轮次，后续只需要替换接口中的业务逻辑即可切到真实流程。"
                icon={<Shield className="w-5 h-5" />}
                action={
                  <Button icon={<Plus className="w-4 h-4" />} onClick={openCreateRole}>
                    新建权限组
                  </Button>
                }
              />
            </div>
            <Table
              columns={roleColumns}
              data={roles}
              rowKey="id"
              loading={loading}
              emptyText="暂无权限组数据"
            />
          </Card>

          <Card>
            <CardHeader
              title="权限矩阵"
              subtitle="支持按角色逐个点选权限，便于快速整理提单、详情页和结果页所需权限。"
              icon={<Shield className="w-5 h-5" />}
            />
            <PermissionMatrix
              roles={roles}
              permissions={permissions}
              rolePermissionMap={rolePermissionMap}
              onToggle={handleToggleRolePermission}
            />
          </Card>

          <BulkAssignPanel
            roles={roles}
            permissions={permissions}
            onApply={handleBulkApplyPermissions}
          />
        </div>
      )}

      {activeTab === 'menus' && (
        <Card padding="none">
          <div className="p-6 pb-0">
            <CardHeader
              title="菜单管理"
              subtitle="通过真实菜单接口维护前端导航结构，当前阶段后端先填充 mock 数据，后续直接替换接口实现。"
              icon={<MenuSquare className="w-5 h-5" />}
              action={
                <Button icon={<Plus className="w-4 h-4" />} onClick={openCreateMenu}>
                  新建菜单
                </Button>
              }
            />
          </div>
          <Table
            columns={menuColumns}
            data={menuRows}
            rowKey="id"
            loading={loading}
            emptyText="暂无菜单数据"
          />
        </Card>
      )}

      <UserFormModal
        isOpen={userModalOpen}
        form={userForm}
        roles={roles}
        saving={saving}
        onClose={() => setUserModalOpen(false)}
        onSave={() => void handleSaveUser()}
        onChange={setUserForm}
      />

      <RoleFormModal
        isOpen={roleModalOpen}
        form={roleForm}
        permissions={permissions}
        saving={saving}
        onClose={() => setRoleModalOpen(false)}
        onSave={() => void handleSaveRole()}
        onChange={setRoleForm}
      />

      <MenuFormModal
        isOpen={menuModalOpen}
        form={menuForm}
        menuParentOptions={menuParentOptions}
        menuTypeOptions={MENU_TYPE_OPTIONS}
        saving={saving}
        onClose={() => setMenuModalOpen(false)}
        onSave={() => void handleSaveMenu()}
        onChange={setMenuForm}
      />
    </div>
  );
};

export default PermissionsConfig;
