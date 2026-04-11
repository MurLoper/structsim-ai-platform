import type { PermissionItem, Role, User } from '@/types';
import { Input, Modal, Select } from '@/components/ui';
import { useI18n } from '@/hooks';
import type {
  AccessUserDisplayNameGetter,
  PermissionFormState,
  RoleFormState,
  UserFormState,
} from '../types';
import { AccessModalActions, AccessOptionCard } from './AccessFormParts';

export { PasswordModal } from './PasswordModal';
export { RolePermissionModal } from './RolePermissionModal';

type UserRoleModalProps = {
  editingUser: User | null;
  roles: Role[];
  selectedRoleIds: number[];
  onClose: () => void;
  onSave: () => void;
  onToggleRole: (roleId: number, checked: boolean) => void;
  getUserDisplayName: AccessUserDisplayNameGetter;
};

export const UserRoleModal = ({
  editingUser,
  roles,
  selectedRoleIds,
  onClose,
  onSave,
  onToggleRole,
  getUserDisplayName,
}: UserRoleModalProps) => {
  const { t } = useI18n();

  return (
    <Modal isOpen={!!editingUser} onClose={onClose} title={t('access.user.assign_roles')} size="lg">
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
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
        <AccessModalActions
          onCancel={onClose}
          onConfirm={onSave}
          confirmText={t('access.actions.save')}
        />
      </div>
    </Modal>
  );
};

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

export const UserFormModal = ({
  isOpen,
  editingUserForm,
  userForm,
  roles,
  onClose,
  onSave,
  onFieldChange,
  onToggleRole,
}: UserFormModalProps) => {
  const { t } = useI18n();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingUserForm ? t('access.user.edit') : t('access.user.create')}
      size="lg"
    >
      <div className="space-y-4">
        <Input
          label={t('access.user.domain_account')}
          value={userForm.domainAccount}
          onChange={event => onFieldChange('domainAccount', event.target.value)}
        />
        <Input
          label={t('access.user.email')}
          value={userForm.email}
          onChange={event => onFieldChange('email', event.target.value)}
        />
        <Input
          label={t('access.user.display_name')}
          value={userForm.userName}
          onChange={event => onFieldChange('userName', event.target.value)}
        />
        <Input
          label={t('access.user.real_name')}
          value={userForm.realName}
          onChange={event => onFieldChange('realName', event.target.value)}
        />
        <Input
          label={
            editingUserForm ? t('access.user.password.reset') : t('access.user.password.create')
          }
          type="password"
          value={userForm.password}
          onChange={event => onFieldChange('password', event.target.value)}
          hint={editingUserForm ? t('access.user.password.reset_hint') : undefined}
        />
        <Select
          label={t('access.user.status')}
          options={[
            { value: '1', label: t('common.enabled') },
            { value: '0', label: t('common.disabled') },
          ]}
          value={String(userForm.valid)}
          onChange={event => onFieldChange('valid', Number(event.target.value))}
        />
        <div>
          <div className="mb-2 text-sm font-medium text-foreground">
            {t('access.user.role_assignment')}
          </div>
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
          confirmText={editingUserForm ? t('access.actions.save') : t('access.actions.create')}
        />
      </div>
    </Modal>
  );
};

type RoleFormModalProps = {
  isOpen: boolean;
  editingRole: Role | null;
  roleForm: RoleFormState;
  onClose: () => void;
  onSave: () => void;
  onFieldChange: (field: keyof RoleFormState, value: string) => void;
};

export const RoleFormModal = ({
  isOpen,
  editingRole,
  roleForm,
  onClose,
  onSave,
  onFieldChange,
}: RoleFormModalProps) => {
  const { t } = useI18n();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('access.role.config')} size="lg">
      <div className="space-y-4">
        <Input
          label={t('access.role.name')}
          value={roleForm.name}
          onChange={event => onFieldChange('name', event.target.value)}
        />
        <Input
          label={t('access.role.code')}
          value={roleForm.code}
          onChange={event => onFieldChange('code', event.target.value)}
        />
        <Input
          label={t('access.role.description')}
          value={roleForm.description}
          onChange={event => onFieldChange('description', event.target.value)}
        />
        <AccessModalActions
          onCancel={onClose}
          onConfirm={onSave}
          confirmText={editingRole ? t('access.actions.save') : t('access.actions.create')}
        />
      </div>
    </Modal>
  );
};

type PermissionFormModalProps = {
  isOpen: boolean;
  editingPermission: PermissionItem | null;
  permissionForm: PermissionFormState;
  permissionTypeOptions: Array<{ value: string; label: string }>;
  onClose: () => void;
  onSave: () => void;
  onFieldChange: (field: keyof PermissionFormState, value: string) => void;
};

export const PermissionFormModal = ({
  isOpen,
  editingPermission,
  permissionForm,
  permissionTypeOptions,
  onClose,
  onSave,
  onFieldChange,
}: PermissionFormModalProps) => {
  const { t } = useI18n();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingPermission ? t('access.permission.edit') : t('access.permission.create')}
      size="lg"
    >
      <div className="space-y-4">
        <Input
          label={t('access.permission.name')}
          value={permissionForm.name}
          onChange={event => onFieldChange('name', event.target.value)}
        />
        <Input
          label={t('access.permission.code')}
          value={permissionForm.code}
          onChange={event => onFieldChange('code', event.target.value)}
        />
        <Select
          label={t('access.permission.type')}
          options={permissionTypeOptions}
          value={permissionForm.type}
          onChange={event => onFieldChange('type', event.target.value)}
        />
        <Input
          label={t('access.permission.resource')}
          value={permissionForm.resource}
          onChange={event => onFieldChange('resource', event.target.value)}
        />
        <Input
          label={t('access.permission.description')}
          value={permissionForm.description}
          onChange={event => onFieldChange('description', event.target.value)}
        />
        <AccessModalActions
          onCancel={onClose}
          onConfirm={onSave}
          confirmText={editingPermission ? t('access.actions.save') : t('access.actions.create')}
        />
      </div>
    </Modal>
  );
};
