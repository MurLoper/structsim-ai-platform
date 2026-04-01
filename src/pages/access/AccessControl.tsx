import React from 'react';
import { Card, Tabs } from '@/components/ui';
import { ACCESS_TABS, PERMISSION_TYPE_OPTIONS } from './constants';
import { AccessHeader } from './components/AccessHeader';
import { AccessOverviewCards } from './components/AccessOverviewCards';
import { AccessPermissionsTab } from './components/AccessPermissionsTab';
import { AccessRolesTab } from './components/AccessRolesTab';
import { AccessUsersTab } from './components/AccessUsersTab';
import {
  PasswordModal,
  PermissionFormModal,
  RoleFormModal,
  RolePermissionModal,
  UserFormModal,
  UserRoleModal,
} from './components/AccessModals';
import { getUserDisplayName, getUserIdentity } from './utils/accessUserIdentity';
import { useAccessPageState } from './hooks/useAccessPageState';

const AccessControl: React.FC = () => {
  const state = useAccessPageState();

  return (
    <div className="space-y-6">
      <AccessHeader
        loading={state.loading}
        onRefresh={state.loadData}
        onCreateUser={() => state.openUserModal()}
        onCreateRole={() => state.openRoleModal()}
        onCreatePermission={() => state.openPermissionModal()}
      />

      <AccessOverviewCards
        userCount={state.users.length}
        permissionCount={state.permissions.length}
      />

      <Card padding="none">
        <div className="border-b border-border p-6">
          <Tabs
            items={ACCESS_TABS}
            activeKey={state.activeTab}
            onChange={key => state.setActiveTab(key as typeof state.activeTab)}
          />
        </div>

        {state.activeTab === 'users' && (
          <AccessUsersTab
            loading={state.loading}
            keyword={state.keyword}
            users={state.users}
            roleNameById={state.roleNameById}
            permissionNameByCode={state.permissionNameByCode}
            onKeywordChange={state.setKeyword}
            onCreateUser={() => state.openUserModal()}
            onCreateRole={() => state.openRoleModal()}
            onOpenUserRoleModal={state.openUserRoleModal}
            onOpenPasswordModal={state.openPasswordModal}
            getUserIdentity={getUserIdentity}
            getUserDisplayName={getUserDisplayName}
          />
        )}

        {state.activeTab === 'roles' && (
          <AccessRolesTab
            loading={state.loading}
            roles={state.roles}
            permissions={state.permissions}
            rolePermissionMap={state.rolePermissionMap}
            onCreateRole={() => state.openRoleModal()}
            onOpenRoleModal={state.openRoleModal}
            onOpenRolePermissionModal={state.openRolePermissionModal}
            onToggleRolePermission={state.toggleRolePermission}
            onBulkApplyPermissions={state.handleBulkApplyPermissions}
          />
        )}

        {state.activeTab === 'perms' && (
          <AccessPermissionsTab
            loading={state.loading}
            permissions={state.permissions}
            onCreatePermission={() => state.openPermissionModal()}
            onOpenPermissionModal={state.openPermissionModal}
          />
        )}
      </Card>

      <UserRoleModal
        editingUser={state.editingUser}
        roles={state.roles}
        selectedRoleIds={state.selectedRoleIds}
        onClose={state.closeUserRoleModal}
        onSave={state.saveUserRoles}
        onToggleRole={(roleId, checked) =>
          state.setSelectedRoleIds(prev =>
            checked ? prev.filter(id => id !== roleId) : [...prev, roleId]
          )
        }
        getUserDisplayName={getUserDisplayName}
      />

      <UserFormModal
        isOpen={state.isUserModalOpen}
        editingUserForm={state.editingUserForm}
        userForm={state.userForm}
        roles={state.roles}
        onClose={state.closeUserModal}
        onSave={state.saveUser}
        onFieldChange={(field, value) => state.setUserForm(prev => ({ ...prev, [field]: value }))}
        onToggleRole={(roleId, checked) =>
          state.setUserForm(prev => ({
            ...prev,
            roleIds: checked ? prev.roleIds.filter(id => id !== roleId) : [...prev.roleIds, roleId],
          }))
        }
      />

      <PasswordModal
        isOpen={state.isPasswordModalOpen}
        passwordTarget={state.passwordTarget}
        passwordValue={state.passwordValue}
        onClose={state.closePasswordModal}
        onSave={state.savePassword}
        onChange={state.setPasswordValue}
        getUserDisplayName={getUserDisplayName}
      />

      <RoleFormModal
        isOpen={state.isRoleModalOpen}
        editingRole={state.editingRole}
        roleForm={state.roleForm}
        onClose={state.closeRoleModal}
        onSave={state.saveRole}
        onFieldChange={(field, value) => state.setRoleForm(prev => ({ ...prev, [field]: value }))}
      />

      <RolePermissionModal
        isOpen={state.isRolePermissionModalOpen}
        rolePermissionTarget={state.rolePermissionTarget}
        rolePermissionIds={state.rolePermissionIds}
        permissions={state.permissions}
        onClose={state.closeRolePermissionModal}
        onSave={state.saveRolePermissions}
        onChange={state.setRolePermissionIds}
      />

      <PermissionFormModal
        isOpen={state.isPermissionModalOpen}
        editingPermission={state.editingPermission}
        permissionForm={state.permissionForm}
        permissionTypeOptions={PERMISSION_TYPE_OPTIONS}
        onClose={state.closePermissionModal}
        onSave={state.savePermission}
        onFieldChange={(field, value) =>
          state.setPermissionForm(prev => ({ ...prev, [field]: value }))
        }
      />
    </div>
  );
};

export default AccessControl;
