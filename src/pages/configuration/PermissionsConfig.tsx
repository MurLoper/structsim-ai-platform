import { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';
import { useI18n } from '@/hooks';
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

const PermissionsConfig = () => {
  const { t } = useI18n();
  const state = usePermissionsConfigState();

  const userColumns = useMemo(
    () =>
      buildUserColumns({
        onEdit: state.openEditUser,
        onDelete: state.handleDeleteUser,
        t,
      }),
    [state.handleDeleteUser, state.openEditUser, t]
  );

  const roleColumns = useMemo(
    () =>
      buildRoleColumns({
        onEdit: state.openEditRole,
        onDelete: state.handleDeleteRole,
        t,
      }),
    [state.handleDeleteRole, state.openEditRole, t]
  );

  const menuColumns = useMemo(
    () =>
      buildMenuColumns({
        onEdit: state.openEditMenu,
        onDelete: state.handleDeleteMenu,
        t,
      }),
    [state.handleDeleteMenu, state.openEditMenu, t]
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white eyecare:text-foreground">
            {t('cfg.permissions.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('cfg.permissions.description')}</p>
        </div>
        <Button
          variant="outline"
          icon={<RefreshCw className="h-4 w-4" />}
          onClick={() => void state.loadData()}
          loading={state.loading}
        >
          {t('cfg.permissions.refresh')}
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
      <state.ConfirmDialogComponent />
    </div>
  );
};

export default PermissionsConfig;
