import React, { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';
import { ConfigTabs } from './components';
import {
  MenuFormModal,
  RoleFormModal,
  UserFormModal,
} from './components/permissions/PermissionsFormModals';
import { PermissionsMenusCard } from './components/permissions/PermissionsMenusCard';
import { PermissionsRolesWorkspace } from './components/permissions/PermissionsRolesWorkspace';
import { PermissionsUsersCard } from './components/permissions/PermissionsUsersCard';
import {
  buildMenuColumns,
  buildRoleColumns,
  buildUserColumns,
} from './components/permissions/PermissionsTableColumns';
import { MENU_TYPE_OPTIONS, TABS } from './components/permissions/permissionsConfigOptions';
import type { ActiveTab } from './components/permissions/permissionsConfigTypes';
import { usePermissionsConfigState } from './hooks/usePermissionsConfigState';

const PermissionsConfig: React.FC = () => {
  const state = usePermissionsConfigState();

  const userColumns = useMemo(
    () =>
      buildUserColumns({
        onEdit: state.openEditUser,
        onDelete: state.handleDeleteUser,
      }),
    [state.handleDeleteUser, state.openEditUser]
  );

  const roleColumns = useMemo(
    () =>
      buildRoleColumns({
        onEdit: state.openEditRole,
        onDelete: state.handleDeleteRole,
      }),
    [state.handleDeleteRole, state.openEditRole]
  );

  const menuColumns = useMemo(
    () =>
      buildMenuColumns({
        onEdit: state.openEditMenu,
        onDelete: state.handleDeleteMenu,
      }),
    [state.handleDeleteMenu, state.openEditMenu]
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white eyecare:text-foreground">
            权限配置
          </h1>
          <p className="text-sm text-muted-foreground">
            基于真实 RBAC 接口打通用户、权限组和菜单配置链路，便于提单、回显和 Mock 结果联调。
          </p>
        </div>
        <Button
          variant="outline"
          icon={<RefreshCw className="h-4 w-4" />}
          onClick={() => void state.loadData()}
          loading={state.loading}
        >
          刷新数据
        </Button>
      </div>

      <ConfigTabs
        tabs={TABS}
        activeTab={state.activeTab}
        onChange={key => state.setActiveTab(key as ActiveTab)}
      />

      {state.activeTab === 'users' && (
        <PermissionsUsersCard
          loading={state.loading}
          users={state.users}
          columns={userColumns}
          onCreate={state.openCreateUser}
        />
      )}

      {state.activeTab === 'roles' && (
        <PermissionsRolesWorkspace
          loading={state.loading}
          roles={state.roles}
          permissions={state.permissions}
          columns={roleColumns}
          rolePermissionMap={state.rolePermissionMap}
          onCreate={state.openCreateRole}
          onToggleRolePermission={state.handleToggleRolePermission}
          onBulkApplyPermissions={state.handleBulkApplyPermissions}
        />
      )}

      {state.activeTab === 'menus' && (
        <PermissionsMenusCard
          loading={state.loading}
          menuRows={state.menuRows}
          columns={menuColumns}
          onCreate={state.openCreateMenu}
        />
      )}

      <UserFormModal
        isOpen={state.userModalOpen}
        form={state.userForm}
        roles={state.roles}
        saving={state.saving}
        onClose={() => state.setUserModalOpen(false)}
        onSave={() => void state.handleSaveUser()}
        onChange={state.setUserForm}
      />

      <RoleFormModal
        isOpen={state.roleModalOpen}
        form={state.roleForm}
        permissions={state.permissions}
        saving={state.saving}
        onClose={() => state.setRoleModalOpen(false)}
        onSave={() => void state.handleSaveRole()}
        onChange={state.setRoleForm}
      />

      <MenuFormModal
        isOpen={state.menuModalOpen}
        form={state.menuForm}
        menuParentOptions={state.menuParentOptions}
        menuTypeOptions={MENU_TYPE_OPTIONS}
        saving={state.saving}
        onClose={() => state.setMenuModalOpen(false)}
        onSave={() => void state.handleSaveMenu()}
        onChange={state.setMenuForm}
      />
    </div>
  );
};

export default PermissionsConfig;
