import type { PermissionItem, Role } from '@/types';
import { Button, Checkbox, Input, Modal, Select, Textarea } from '@/components/ui';
import { PermissionTree } from '@/components/access';
import { useI18n } from '@/hooks';

export type UserFormState = {
  id?: string;
  email: string;
  domainAccount: string;
  lcUserId: string;
  userName: string;
  realName: string;
  department: string;
  dailyRoundLimit: string;
  roleIds: number[];
  valid: boolean;
};

export type RoleFormState = {
  id?: number;
  name: string;
  code: string;
  description: string;
  permissionIds: number[];
  maxCpuCores: string;
  maxBatchSize: string;
  dailyRoundLimitDefault: string;
  nodeList: string;
  sort: string;
  valid: boolean;
};

export type MenuFormState = {
  id?: number;
  parentId: string;
  name: string;
  titleI18nKey: string;
  icon: string;
  path: string;
  component: string;
  menuType: string;
  permissionCode: string;
  hidden: boolean;
  valid: boolean;
  sort: string;
};

const optionCardClass =
  'flex items-center justify-between rounded-lg border border-border px-3 py-2';
const modalActionsClass = 'flex justify-end gap-3 pt-2';

type ModalActionProps = {
  onCancel: () => void;
  onConfirm: () => void;
  saving: boolean;
};

const PermissionsModalActions = ({ onCancel, onConfirm, saving }: ModalActionProps) => {
  const { t } = useI18n();

  return (
    <div className={modalActionsClass}>
      <Button variant="outline" onClick={onCancel}>
        {t('common.cancel')}
      </Button>
      <Button onClick={onConfirm} loading={saving}>
        {t('common.save')}
      </Button>
    </div>
  );
};

type RoleAssignmentCardProps = {
  role: Role;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

const RoleAssignmentCard = ({ role, checked, onChange }: RoleAssignmentCardProps) => {
  const { t } = useI18n();

  return (
    <label key={role.id} className={optionCardClass}>
      <div>
        <div className="text-sm font-medium text-foreground">{role.name}</div>
        <div className="text-xs text-muted-foreground">
          {role.code || t('cfg.permissions.unconfigured_code')}
        </div>
      </div>
      <Checkbox checked={checked} onChange={event => onChange(event.target.checked)} />
    </label>
  );
};

type UserFormModalProps = {
  isOpen: boolean;
  form: UserFormState;
  roles: Role[];
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onChange: (updater: (prev: UserFormState) => UserFormState) => void;
};

export const UserFormModal = ({
  isOpen,
  form,
  roles,
  saving,
  onClose,
  onSave,
  onChange,
}: UserFormModalProps) => {
  const { t } = useI18n();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={form.id ? t('cfg.permissions.user.edit') : t('cfg.permissions.user.create')}
      size="xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label={t('cfg.permissions.user.domain_account')}
            value={form.domainAccount}
            onChange={event => onChange(prev => ({ ...prev, domainAccount: event.target.value }))}
            placeholder={t('cfg.permissions.user.placeholder.domain_account')}
          />
          <Input
            label={t('cfg.permissions.user.email')}
            value={form.email}
            onChange={event => onChange(prev => ({ ...prev, email: event.target.value }))}
            placeholder={t('cfg.permissions.user.placeholder.email')}
          />
          <Input
            label={t('cfg.permissions.user.display_name')}
            value={form.userName}
            onChange={event => onChange(prev => ({ ...prev, userName: event.target.value }))}
            placeholder={t('cfg.permissions.user.placeholder.display_name')}
          />
          <Input
            label={t('cfg.permissions.user.real_name')}
            value={form.realName}
            onChange={event => onChange(prev => ({ ...prev, realName: event.target.value }))}
            placeholder={t('cfg.permissions.user.placeholder.real_name')}
          />
          <Input
            label={t('cfg.permissions.user.external_id')}
            value={form.lcUserId}
            onChange={event => onChange(prev => ({ ...prev, lcUserId: event.target.value }))}
            placeholder={t('cfg.permissions.user.placeholder.external_id')}
          />
          <Input
            label={t('cfg.permissions.user.department')}
            value={form.department}
            onChange={event => onChange(prev => ({ ...prev, department: event.target.value }))}
            placeholder={t('cfg.permissions.user.placeholder.department')}
          />
          <Input
            label={t('cfg.permissions.user.daily_round_limit')}
            type="number"
            value={form.dailyRoundLimit}
            onChange={event => onChange(prev => ({ ...prev, dailyRoundLimit: event.target.value }))}
            placeholder={t('cfg.permissions.user.placeholder.daily_round_limit')}
          />
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-foreground">
            {t('cfg.permissions.user.assign_roles')}
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {roles.map(role => (
              <RoleAssignmentCard
                key={role.id}
                role={role}
                checked={form.roleIds.includes(role.id)}
                onChange={checked =>
                  onChange(prev => ({
                    ...prev,
                    roleIds: checked
                      ? [...prev.roleIds, role.id]
                      : prev.roleIds.filter(id => id !== role.id),
                  }))
                }
              />
            ))}
          </div>
        </div>

        <Checkbox
          label={t('cfg.permissions.user.enabled')}
          checked={form.valid}
          onChange={event => onChange(prev => ({ ...prev, valid: event.target.checked }))}
        />

        <PermissionsModalActions onCancel={onClose} onConfirm={onSave} saving={saving} />
      </div>
    </Modal>
  );
};

type RoleFormModalProps = {
  isOpen: boolean;
  form: RoleFormState;
  permissions: PermissionItem[];
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onChange: (updater: (prev: RoleFormState) => RoleFormState) => void;
};

export const RoleFormModal = ({
  isOpen,
  form,
  permissions,
  saving,
  onClose,
  onSave,
  onChange,
}: RoleFormModalProps) => {
  const { t } = useI18n();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={form.id ? t('cfg.permissions.role.edit') : t('cfg.permissions.role.create')}
      size="xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label={t('cfg.permissions.role.name')}
            value={form.name}
            onChange={event => onChange(prev => ({ ...prev, name: event.target.value }))}
            placeholder={t('cfg.permissions.role.placeholder.name')}
          />
          <Input
            label={t('common.code')}
            value={form.code}
            onChange={event => onChange(prev => ({ ...prev, code: event.target.value }))}
            placeholder={t('cfg.permissions.role.placeholder.code')}
          />
          <Input
            label={t('cfg.permissions.role.cpu_limit')}
            type="number"
            value={form.maxCpuCores}
            onChange={event => onChange(prev => ({ ...prev, maxCpuCores: event.target.value }))}
          />
          <Input
            label={t('cfg.permissions.role.batch_limit')}
            type="number"
            value={form.maxBatchSize}
            onChange={event => onChange(prev => ({ ...prev, maxBatchSize: event.target.value }))}
          />
          <Input
            label={t('cfg.permissions.role.daily_limit_default')}
            type="number"
            value={form.dailyRoundLimitDefault}
            onChange={event =>
              onChange(prev => ({ ...prev, dailyRoundLimitDefault: event.target.value }))
            }
          />
          <Input
            label={t('cfg.permissions.role.node_list')}
            value={form.nodeList}
            onChange={event => onChange(prev => ({ ...prev, nodeList: event.target.value }))}
            placeholder={t('cfg.permissions.role.placeholder.node_list')}
          />
          <Input
            label={t('common.sort')}
            type="number"
            value={form.sort}
            onChange={event => onChange(prev => ({ ...prev, sort: event.target.value }))}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {t('cfg.permissions.role.description')}
          </label>
          <Textarea
            value={form.description}
            onChange={event => onChange(prev => ({ ...prev, description: event.target.value }))}
            placeholder={t('cfg.permissions.role.placeholder.description')}
          />
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-foreground">
            {t('cfg.permissions.role.configure_permissions')}
          </div>
          <PermissionTree
            permissions={permissions}
            selectedIds={form.permissionIds}
            onChange={ids => onChange(prev => ({ ...prev, permissionIds: ids }))}
          />
        </div>

        <Checkbox
          label={t('cfg.permissions.role.enabled')}
          checked={form.valid}
          onChange={event => onChange(prev => ({ ...prev, valid: event.target.checked }))}
        />

        <PermissionsModalActions onCancel={onClose} onConfirm={onSave} saving={saving} />
      </div>
    </Modal>
  );
};

type MenuFormModalProps = {
  isOpen: boolean;
  form: MenuFormState;
  menuParentOptions: Array<{ value: string; label: string }>;
  menuTypeOptions: Array<{ value: string; label: string }>;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onChange: (updater: (prev: MenuFormState) => MenuFormState) => void;
};

export const MenuFormModal = ({
  isOpen,
  form,
  menuParentOptions,
  menuTypeOptions,
  saving,
  onClose,
  onSave,
  onChange,
}: MenuFormModalProps) => {
  const { t } = useI18n();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={form.id ? t('cfg.permissions.menu.edit') : t('cfg.permissions.menu.create')}
      size="xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label={t('cfg.permissions.menu.parent')}
            options={menuParentOptions}
            value={form.parentId}
            onChange={event => onChange(prev => ({ ...prev, parentId: event.target.value }))}
          />
          <Select
            label={t('cfg.permissions.menu.type')}
            options={menuTypeOptions}
            value={form.menuType}
            onChange={event => onChange(prev => ({ ...prev, menuType: event.target.value }))}
          />
          <Input
            label={t('cfg.permissions.menu.name')}
            value={form.name}
            onChange={event => onChange(prev => ({ ...prev, name: event.target.value }))}
            placeholder={t('cfg.permissions.menu.placeholder.name')}
          />
          <Input
            label={t('cfg.permissions.menu.i18n_key')}
            value={form.titleI18nKey}
            onChange={event => onChange(prev => ({ ...prev, titleI18nKey: event.target.value }))}
            placeholder={t('cfg.permissions.menu.placeholder.i18n_key')}
          />
          <Input
            label={t('cfg.permissions.menu.icon')}
            value={form.icon}
            onChange={event => onChange(prev => ({ ...prev, icon: event.target.value }))}
            placeholder={t('cfg.permissions.menu.placeholder.icon')}
          />
          <Input
            label={t('cfg.permissions.menu.permission_code')}
            value={form.permissionCode}
            onChange={event => onChange(prev => ({ ...prev, permissionCode: event.target.value }))}
            placeholder={t('cfg.permissions.menu.placeholder.permission_code')}
          />
          <Input
            label={t('cfg.permissions.menu.path')}
            value={form.path}
            onChange={event => onChange(prev => ({ ...prev, path: event.target.value }))}
            placeholder={t('cfg.permissions.menu.placeholder.path')}
          />
          <Input
            label={t('cfg.permissions.menu.component')}
            value={form.component}
            onChange={event => onChange(prev => ({ ...prev, component: event.target.value }))}
            placeholder={t('cfg.permissions.menu.placeholder.component')}
          />
          <Input
            label={t('common.sort')}
            type="number"
            value={form.sort}
            onChange={event => onChange(prev => ({ ...prev, sort: event.target.value }))}
          />
        </div>

        <div className="flex flex-wrap gap-6">
          <Checkbox
            label={t('cfg.permissions.menu.hidden')}
            checked={form.hidden}
            onChange={event => onChange(prev => ({ ...prev, hidden: event.target.checked }))}
          />
          <Checkbox
            label={t('cfg.permissions.menu.enabled')}
            checked={form.valid}
            onChange={event => onChange(prev => ({ ...prev, valid: event.target.checked }))}
          />
        </div>

        <PermissionsModalActions onCancel={onClose} onConfirm={onSave} saving={saving} />
      </div>
    </Modal>
  );
};
