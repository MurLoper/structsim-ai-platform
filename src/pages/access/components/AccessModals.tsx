import React from 'react';
import { Badge, Input, Modal, Select } from '@/components/ui';
import { PermissionTree } from '@/components/access';
import type { PermissionItem, Role, User } from '@/types';
import { AccessModalActions, AccessOptionCard } from './AccessFormParts';

type UserFormState = {
  domainAccount: string;
  email: string;
  userName: string;
  realName: string;
  password: string;
  roleIds: number[];
  valid: number;
};

type RoleFormState = {
  name: string;
  code: string;
  description: string;
};

type PermissionFormState = {
  name: string;
  code: string;
  type: string;
  resource: string;
  description: string;
};

type GetUserDisplayName = (
  user: Pick<User, 'realName' | 'userName' | 'displayName' | 'domainAccount' | 'id' | 'email'>
) => string;

type UserRoleModalProps = {
  editingUser: User | null;
  roles: Role[];
  selectedRoleIds: number[];
  onClose: () => void;
  onSave: () => void;
  onToggleRole: (roleId: number, checked: boolean) => void;
  getUserDisplayName: GetUserDisplayName;
};

export const UserRoleModal: React.FC<UserRoleModalProps> = ({
  editingUser,
  roles,
  selectedRoleIds,
  onClose,
  onSave,
  onToggleRole,
  getUserDisplayName,
}) => (
  <Modal isOpen={!!editingUser} onClose={onClose} title="分配角色" size="lg">
    <div className="space-y-4">
      <div className="text-sm text-slate-500">
        {editingUser ? getUserDisplayName(editingUser) : ''} ({editingUser?.email})
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {roles.map(role => {
          const checked = selectedRoleIds.includes(role.id);
          return (
            <AccessOptionCard
              key={role.id}
              label={role.name}
              description={role.description}
              controlPosition="leading"
              control={
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-600"
                  checked={checked}
                  onChange={() => onToggleRole(role.id, checked)}
                />
              }
            />
          );
        })}
      </div>
      <AccessModalActions onCancel={onClose} onConfirm={onSave} confirmText="保存" />
    </div>
  </Modal>
);

type UserFormModalProps = {
  isOpen: boolean;
  editingUserForm: User | null;
  userForm: UserFormState;
  roles: Role[];
  onClose: () => void;
  onSave: () => void;
  onFieldChange: (field: keyof UserFormState, value: string | number) => void;
  onToggleRole: (roleId: number, checked: boolean) => void;
};

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  editingUserForm,
  userForm,
  roles,
  onClose,
  onSave,
  onFieldChange,
  onToggleRole,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={editingUserForm ? '编辑用户' : '新增用户'}
    size="lg"
  >
    <div className="space-y-4">
      <Input
        label="域账号"
        value={userForm.domainAccount}
        onChange={e => onFieldChange('domainAccount', e.target.value)}
      />
      <Input
        label="邮箱"
        value={userForm.email}
        onChange={e => onFieldChange('email', e.target.value)}
      />
      <Input
        label="显示名"
        value={userForm.userName}
        onChange={e => onFieldChange('userName', e.target.value)}
      />
      <Input
        label="真实姓名"
        value={userForm.realName}
        onChange={e => onFieldChange('realName', e.target.value)}
      />
      <Input
        label={editingUserForm ? '重置密码' : '初始密码'}
        type="password"
        value={userForm.password}
        onChange={e => onFieldChange('password', e.target.value)}
        hint={editingUserForm ? '留空则不修改密码' : undefined}
      />
      <Select
        label="启用状态"
        options={[
          { value: '1', label: '启用' },
          { value: '0', label: '禁用' },
        ]}
        value={String(userForm.valid)}
        onChange={e => onFieldChange('valid', Number(e.target.value))}
      />
      <div>
        <div className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">角色分配</div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {roles.map(role => {
            const checked = userForm.roleIds.includes(role.id);
            return (
              <AccessOptionCard
                key={role.id}
                label={role.name}
                description={role.description}
                controlPosition="leading"
                control={
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brand-600"
                    checked={checked}
                    onChange={() => onToggleRole(role.id, checked)}
                  />
                }
              />
            );
          })}
        </div>
      </div>
      <AccessModalActions
        onCancel={onClose}
        onConfirm={onSave}
        confirmText={editingUserForm ? '保存' : '创建'}
      />
    </div>
  </Modal>
);

type PasswordModalProps = {
  isOpen: boolean;
  passwordTarget: User | null;
  passwordValue: string;
  onClose: () => void;
  onSave: () => void;
  onChange: (value: string) => void;
  getUserDisplayName: GetUserDisplayName;
};

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  passwordTarget,
  passwordValue,
  onClose,
  onSave,
  onChange,
  getUserDisplayName,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="设置密码" size="md">
    <div className="space-y-4">
      <div className="text-sm text-slate-500">
        {passwordTarget ? getUserDisplayName(passwordTarget) : ''} ({passwordTarget?.email})
      </div>
      <Input
        label="新密码"
        type="password"
        value={passwordValue}
        onChange={e => onChange(e.target.value)}
      />
      <AccessModalActions
        onCancel={onClose}
        onConfirm={onSave}
        confirmText="保存"
        confirmButtonProps={{ disabled: !passwordValue }}
      />
    </div>
  </Modal>
);

type RoleFormModalProps = {
  isOpen: boolean;
  editingRole: Role | null;
  roleForm: RoleFormState;
  onClose: () => void;
  onSave: () => void;
  onFieldChange: (field: keyof RoleFormState, value: string) => void;
};

export const RoleFormModal: React.FC<RoleFormModalProps> = ({
  isOpen,
  editingRole,
  roleForm,
  onClose,
  onSave,
  onFieldChange,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="角色配置" size="lg">
    <div className="space-y-4">
      <Input
        label="角色名称"
        value={roleForm.name}
        onChange={e => onFieldChange('name', e.target.value)}
      />
      <Input
        label="角色编码"
        value={roleForm.code}
        onChange={e => onFieldChange('code', e.target.value)}
      />
      <Input
        label="角色描述"
        value={roleForm.description}
        onChange={e => onFieldChange('description', e.target.value)}
      />
      <AccessModalActions
        onCancel={onClose}
        onConfirm={onSave}
        confirmText={editingRole ? '保存' : '创建'}
      />
    </div>
  </Modal>
);

type RolePermissionModalProps = {
  isOpen: boolean;
  rolePermissionTarget: Role | null;
  rolePermissionIds: number[];
  permissions: PermissionItem[];
  onClose: () => void;
  onSave: () => void;
  onChange: (ids: number[]) => void;
};

export const RolePermissionModal: React.FC<RolePermissionModalProps> = ({
  isOpen,
  rolePermissionTarget,
  rolePermissionIds,
  permissions,
  onClose,
  onSave,
  onChange,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="配置权限" size="xl">
    {rolePermissionTarget && (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">
              {rolePermissionTarget.name}
            </div>
            <div className="text-xs text-slate-500">{rolePermissionTarget.code}</div>
          </div>
          <Badge size="sm">{rolePermissionIds.length} 权限</Badge>
        </div>

        <PermissionTree
          permissions={permissions}
          selectedIds={rolePermissionIds}
          onChange={onChange}
        />
        <AccessModalActions onCancel={onClose} onConfirm={onSave} confirmText="保存权限" />
      </div>
    )}
  </Modal>
);

type PermissionFormModalProps = {
  isOpen: boolean;
  editingPermission: PermissionItem | null;
  permissionForm: PermissionFormState;
  permissionTypeOptions: Array<{ value: string; label: string }>;
  onClose: () => void;
  onSave: () => void;
  onFieldChange: (field: keyof PermissionFormState, value: string) => void;
};

export const PermissionFormModal: React.FC<PermissionFormModalProps> = ({
  isOpen,
  editingPermission,
  permissionForm,
  permissionTypeOptions,
  onClose,
  onSave,
  onFieldChange,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={editingPermission ? '编辑权限' : '新增权限'}
    size="lg"
  >
    <div className="space-y-4">
      <Input
        label="权限名称"
        value={permissionForm.name}
        onChange={e => onFieldChange('name', e.target.value)}
      />
      <Input
        label="权限编码"
        value={permissionForm.code}
        onChange={e => onFieldChange('code', e.target.value)}
      />
      <Select
        label="权限类型"
        options={permissionTypeOptions}
        value={permissionForm.type}
        onChange={e => onFieldChange('type', e.target.value)}
      />
      <Input
        label="资源标识"
        value={permissionForm.resource}
        onChange={e => onFieldChange('resource', e.target.value)}
      />
      <Input
        label="权限描述"
        value={permissionForm.description}
        onChange={e => onFieldChange('description', e.target.value)}
      />
      <AccessModalActions
        onCancel={onClose}
        onConfirm={onSave}
        confirmText={editingPermission ? '保存' : '创建'}
      />
    </div>
  </Modal>
);
