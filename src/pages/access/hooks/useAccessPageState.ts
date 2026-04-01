import { useCallback, useState } from 'react';
import { rbacApi } from '@/api';
import type { PermissionItem, Role, User } from '@/types';
import type { AccessTabKey, PermissionFormState, RoleFormState, UserFormState } from '../types';
import { getUserIdentity } from '../utils/accessUserIdentity';
import { useAccessReferenceData } from './useAccessReferenceData';

const createEmptyUserForm = (): UserFormState => ({
  domainAccount: '',
  email: '',
  userName: '',
  realName: '',
  password: '',
  roleIds: [],
  valid: 1,
});

const createEmptyRoleForm = (): RoleFormState => ({
  name: '',
  code: '',
  description: '',
});

const createEmptyPermissionForm = (): PermissionFormState => ({
  name: '',
  code: '',
  type: 'PAGE',
  resource: '',
  description: '',
});

export const useAccessPageState = () => {
  const [activeTab, setActiveTab] = useState<AccessTabKey>('users');
  const [keyword, setKeyword] = useState('');
  const {
    loading,
    users,
    roles,
    permissions,
    permissionNameByCode,
    roleNameById,
    rolePermissionMap,
    loadData,
  } = useAccessReferenceData();

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  const [isUserModalOpen, setUserModalOpen] = useState(false);
  const [editingUserForm, setEditingUserForm] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<UserFormState>(createEmptyUserForm());

  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<User | null>(null);
  const [passwordValue, setPasswordValue] = useState('');

  const [isRoleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState<RoleFormState>(createEmptyRoleForm());

  const [rolePermissionTarget, setRolePermissionTarget] = useState<Role | null>(null);
  const [isRolePermissionModalOpen, setRolePermissionModalOpen] = useState(false);
  const [rolePermissionIds, setRolePermissionIds] = useState<number[]>([]);

  const [isPermissionModalOpen, setPermissionModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<PermissionItem | null>(null);
  const [permissionForm, setPermissionForm] = useState<PermissionFormState>(
    createEmptyPermissionForm()
  );

  const openUserRoleModal = useCallback((user: User) => {
    setEditingUser(user);
    setSelectedRoleIds(user.roleIds || []);
  }, []);

  const closeUserRoleModal = useCallback(() => {
    setEditingUser(null);
    setSelectedRoleIds([]);
  }, []);

  const openUserModal = useCallback((user?: User) => {
    setEditingUserForm(user || null);
    setUserForm({
      domainAccount: user ? String(getUserIdentity(user)) : '',
      email: user?.email || '',
      userName: user?.userName || '',
      realName: user?.realName || '',
      password: '',
      roleIds: user?.roleIds || [],
      valid: user?.valid ?? 1,
    });
    setUserModalOpen(true);
  }, []);

  const closeUserModal = useCallback(() => {
    setUserModalOpen(false);
    setEditingUserForm(null);
    setUserForm(createEmptyUserForm());
  }, []);

  const openPasswordModal = useCallback((user: User) => {
    setPasswordTarget(user);
    setPasswordValue('');
    setPasswordModalOpen(true);
  }, []);

  const closePasswordModal = useCallback(() => {
    setPasswordModalOpen(false);
    setPasswordTarget(null);
    setPasswordValue('');
  }, []);

  const saveUser = useCallback(async () => {
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

    closeUserModal();
    await loadData();
  }, [closeUserModal, editingUserForm, loadData, userForm]);

  const saveUserRoles = useCallback(async () => {
    if (!editingUser) return;
    await rbacApi.updateUser(getUserIdentity(editingUser), { role_ids: selectedRoleIds });
    closeUserRoleModal();
    await loadData();
  }, [closeUserRoleModal, editingUser, loadData, selectedRoleIds]);

  const savePassword = useCallback(async () => {
    if (!passwordTarget) return;
    await rbacApi.updateUser(getUserIdentity(passwordTarget), { password: passwordValue });
    closePasswordModal();
    await loadData();
  }, [closePasswordModal, loadData, passwordTarget, passwordValue]);

  const openRoleModal = useCallback((role?: Role) => {
    setEditingRole(role || null);
    setRoleForm({
      name: role?.name || '',
      code: role?.code || '',
      description: role?.description || '',
    });
    setRoleModalOpen(true);
  }, []);

  const closeRoleModal = useCallback(() => {
    setRoleModalOpen(false);
    setEditingRole(null);
    setRoleForm(createEmptyRoleForm());
  }, []);

  const openRolePermissionModal = useCallback((role: Role) => {
    setRolePermissionTarget(role);
    setRolePermissionIds(role.permissionIds || []);
    setRolePermissionModalOpen(true);
  }, []);

  const closeRolePermissionModal = useCallback(() => {
    setRolePermissionTarget(null);
    setRolePermissionIds([]);
    setRolePermissionModalOpen(false);
  }, []);

  const saveRole = useCallback(async () => {
    if (editingRole) {
      await rbacApi.updateRole(editingRole.id, { ...roleForm });
    } else {
      await rbacApi.createRole({ ...roleForm });
    }
    closeRoleModal();
    await loadData();
  }, [closeRoleModal, editingRole, loadData, roleForm]);

  const saveRolePermissions = useCallback(async () => {
    if (!rolePermissionTarget) return;
    await rbacApi.updateRole(rolePermissionTarget.id, { permissionIds: rolePermissionIds });
    closeRolePermissionModal();
    await loadData();
  }, [closeRolePermissionModal, loadData, rolePermissionIds, rolePermissionTarget]);

  const openPermissionModal = useCallback((permission?: PermissionItem) => {
    setEditingPermission(permission || null);
    setPermissionForm({
      name: permission?.name || '',
      code: permission?.code || '',
      type: permission?.type || 'PAGE',
      resource: permission?.resource || '',
      description: permission?.description || '',
    });
    setPermissionModalOpen(true);
  }, []);

  const closePermissionModal = useCallback(() => {
    setPermissionModalOpen(false);
    setEditingPermission(null);
    setPermissionForm(createEmptyPermissionForm());
  }, []);

  const savePermission = useCallback(async () => {
    if (editingPermission) {
      await rbacApi.updatePermission(editingPermission.id, { ...permissionForm });
    } else {
      await rbacApi.createPermission({ ...permissionForm });
    }
    closePermissionModal();
    await loadData();
  }, [closePermissionModal, editingPermission, loadData, permissionForm]);

  const toggleRolePermission = useCallback(
    async (roleId: number, permissionId: number) => {
      const current = rolePermissionMap[roleId] || [];
      const next = current.includes(permissionId)
        ? current.filter(id => id !== permissionId)
        : [...current, permissionId];
      await rbacApi.updateRole(roleId, { permissionIds: next });
      await loadData();
    },
    [loadData, rolePermissionMap]
  );

  const handleBulkApplyPermissions = useCallback(
    async (roleId: number, permissionIds: number[]) => {
      await rbacApi.updateRole(roleId, { permissionIds });
      await loadData();
    },
    [loadData]
  );

  return {
    activeTab,
    setActiveTab,
    keyword,
    setKeyword,
    loading,
    users,
    roles,
    permissions,
    permissionNameByCode,
    roleNameById,
    rolePermissionMap,
    editingUser,
    selectedRoleIds,
    setSelectedRoleIds,
    isUserModalOpen,
    editingUserForm,
    userForm,
    setUserForm,
    isPasswordModalOpen,
    passwordTarget,
    passwordValue,
    setPasswordValue,
    isRoleModalOpen,
    editingRole,
    roleForm,
    setRoleForm,
    rolePermissionTarget,
    isRolePermissionModalOpen,
    rolePermissionIds,
    setRolePermissionIds,
    isPermissionModalOpen,
    editingPermission,
    permissionForm,
    setPermissionForm,
    loadData,
    openUserRoleModal,
    closeUserRoleModal,
    openUserModal,
    closeUserModal,
    openPasswordModal,
    closePasswordModal,
    saveUser,
    saveUserRoles,
    savePassword,
    openRoleModal,
    closeRoleModal,
    openRolePermissionModal,
    closeRolePermissionModal,
    saveRole,
    saveRolePermissions,
    openPermissionModal,
    closePermissionModal,
    savePermission,
    toggleRolePermission,
    handleBulkApplyPermissions,
  };
};
