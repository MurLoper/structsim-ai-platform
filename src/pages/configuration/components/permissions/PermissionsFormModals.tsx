import React from 'react';
import type { PermissionItem, Role } from '@/types';
import { Button, Checkbox, Input, Modal, Select, Textarea } from '@/components/ui';
import { PermissionTree } from '@/components/access';

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
  confirmText?: string;
};

const PermissionsModalActions: React.FC<ModalActionProps> = ({
  onCancel,
  onConfirm,
  saving,
  confirmText = '保存',
}) => (
  <div className={modalActionsClass}>
    <Button variant="outline" onClick={onCancel}>
      取消
    </Button>
    <Button onClick={onConfirm} loading={saving}>
      {confirmText}
    </Button>
  </div>
);

type RoleAssignmentCardProps = {
  role: Role;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

const RoleAssignmentCard: React.FC<RoleAssignmentCardProps> = ({ role, checked, onChange }) => (
  <label key={role.id} className={optionCardClass}>
    <div>
      <div className="text-sm font-medium text-foreground">{role.name}</div>
      <div className="text-xs text-muted-foreground">{role.code || '未配置编码'}</div>
    </div>
    <Checkbox checked={checked} onChange={event => onChange(event.target.checked)} />
  </label>
);

type UserFormModalProps = {
  isOpen: boolean;
  form: UserFormState;
  roles: Role[];
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onChange: (updater: (prev: UserFormState) => UserFormState) => void;
};

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  form,
  roles,
  saving,
  onClose,
  onSave,
  onChange,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={form.id ? '编辑用户' : '新建用户'} size="xl">
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="域账号"
          value={form.domainAccount}
          onChange={event => onChange(prev => ({ ...prev, domainAccount: event.target.value }))}
          placeholder="例如 zhangsan"
        />
        <Input
          label="邮箱"
          value={form.email}
          onChange={event => onChange(prev => ({ ...prev, email: event.target.value }))}
          placeholder="例如 zhangsan@example.com"
        />
        <Input
          label="显示名"
          value={form.userName}
          onChange={event => onChange(prev => ({ ...prev, userName: event.target.value }))}
          placeholder="前端展示名称"
        />
        <Input
          label="真实姓名"
          value={form.realName}
          onChange={event => onChange(prev => ({ ...prev, realName: event.target.value }))}
          placeholder="例如 张三"
        />
        <Input
          label="外部用户 ID"
          value={form.lcUserId}
          onChange={event => onChange(prev => ({ ...prev, lcUserId: event.target.value }))}
          placeholder="后续可映射自动化系统用户"
        />
        <Input
          label="部门"
          value={form.department}
          onChange={event => onChange(prev => ({ ...prev, department: event.target.value }))}
          placeholder="例如 CAE 平台组"
        />
        <Input
          label="日轮次上限"
          type="number"
          value={form.dailyRoundLimit}
          onChange={event => onChange(prev => ({ ...prev, dailyRoundLimit: event.target.value }))}
          placeholder="留空则继承权限组默认值"
        />
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium text-foreground">分配权限组</div>
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
        label="启用该用户"
        checked={form.valid}
        onChange={event => onChange(prev => ({ ...prev, valid: event.target.checked }))}
      />

      <PermissionsModalActions onCancel={onClose} onConfirm={onSave} saving={saving} />
    </div>
  </Modal>
);

type RoleFormModalProps = {
  isOpen: boolean;
  form: RoleFormState;
  permissions: PermissionItem[];
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onChange: (updater: (prev: RoleFormState) => RoleFormState) => void;
};

export const RoleFormModal: React.FC<RoleFormModalProps> = ({
  isOpen,
  form,
  permissions,
  saving,
  onClose,
  onSave,
  onChange,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={form.id ? '编辑权限组' : '新建权限组'} size="xl">
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="权限组名称"
          value={form.name}
          onChange={event => onChange(prev => ({ ...prev, name: event.target.value }))}
          placeholder="例如 审批管理员"
        />
        <Input
          label="编码"
          value={form.code}
          onChange={event => onChange(prev => ({ ...prev, code: event.target.value }))}
          placeholder="例如 APPROVAL_ADMIN"
        />
        <Input
          label="CPU 上限"
          type="number"
          value={form.maxCpuCores}
          onChange={event => onChange(prev => ({ ...prev, maxCpuCores: event.target.value }))}
        />
        <Input
          label="批量提单上限"
          type="number"
          value={form.maxBatchSize}
          onChange={event => onChange(prev => ({ ...prev, maxBatchSize: event.target.value }))}
        />
        <Input
          label="默认日轮次上限"
          type="number"
          value={form.dailyRoundLimitDefault}
          onChange={event =>
            onChange(prev => ({ ...prev, dailyRoundLimitDefault: event.target.value }))
          }
        />
        <Input
          label="节点列表"
          value={form.nodeList}
          onChange={event => onChange(prev => ({ ...prev, nodeList: event.target.value }))}
          placeholder="例如 1,2,5"
        />
        <Input
          label="排序"
          type="number"
          value={form.sort}
          onChange={event => onChange(prev => ({ ...prev, sort: event.target.value }))}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">说明</label>
        <Textarea
          value={form.description}
          onChange={event => onChange(prev => ({ ...prev, description: event.target.value }))}
          placeholder="说明这个权限组主要负责什么业务"
        />
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium text-foreground">配置权限</div>
        <PermissionTree
          permissions={permissions}
          selectedIds={form.permissionIds}
          onChange={ids => onChange(prev => ({ ...prev, permissionIds: ids }))}
        />
      </div>

      <Checkbox
        label="启用该权限组"
        checked={form.valid}
        onChange={event => onChange(prev => ({ ...prev, valid: event.target.checked }))}
      />

      <PermissionsModalActions onCancel={onClose} onConfirm={onSave} saving={saving} />
    </div>
  </Modal>
);

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

export const MenuFormModal: React.FC<MenuFormModalProps> = ({
  isOpen,
  form,
  menuParentOptions,
  menuTypeOptions,
  saving,
  onClose,
  onSave,
  onChange,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={form.id ? '编辑菜单' : '新建菜单'} size="xl">
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Select
          label="父级菜单"
          options={menuParentOptions}
          value={form.parentId}
          onChange={event => onChange(prev => ({ ...prev, parentId: event.target.value }))}
        />
        <Select
          label="菜单类型"
          options={menuTypeOptions}
          value={form.menuType}
          onChange={event => onChange(prev => ({ ...prev, menuType: event.target.value }))}
        />
        <Input
          label="菜单名称"
          value={form.name}
          onChange={event => onChange(prev => ({ ...prev, name: event.target.value }))}
          placeholder="例如 申请单管理"
        />
        <Input
          label="国际化 Key"
          value={form.titleI18nKey}
          onChange={event => onChange(prev => ({ ...prev, titleI18nKey: event.target.value }))}
          placeholder="例如 menu.order.list"
        />
        <Input
          label="图标"
          value={form.icon}
          onChange={event => onChange(prev => ({ ...prev, icon: event.target.value }))}
          placeholder="例如 FolderOpen"
        />
        <Input
          label="权限码"
          value={form.permissionCode}
          onChange={event => onChange(prev => ({ ...prev, permissionCode: event.target.value }))}
          placeholder="例如 order:create"
        />
        <Input
          label="路由 Path"
          value={form.path}
          onChange={event => onChange(prev => ({ ...prev, path: event.target.value }))}
          placeholder="例如 /orders/create"
        />
        <Input
          label="组件路径"
          value={form.component}
          onChange={event => onChange(prev => ({ ...prev, component: event.target.value }))}
          placeholder="例如 orders/CreateOrderPage"
        />
        <Input
          label="排序"
          type="number"
          value={form.sort}
          onChange={event => onChange(prev => ({ ...prev, sort: event.target.value }))}
        />
      </div>

      <div className="flex flex-wrap gap-6">
        <Checkbox
          label="隐藏菜单"
          checked={form.hidden}
          onChange={event => onChange(prev => ({ ...prev, hidden: event.target.checked }))}
        />
        <Checkbox
          label="启用菜单"
          checked={form.valid}
          onChange={event => onChange(prev => ({ ...prev, valid: event.target.checked }))}
        />
      </div>

      <PermissionsModalActions onCancel={onClose} onConfirm={onSave} saving={saving} />
    </div>
  </Modal>
);
