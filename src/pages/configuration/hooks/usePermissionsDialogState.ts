import { useCallback, useState } from 'react';
import type { MenuItem, Role, User } from '@/types';
import type { ActiveTab } from '../components/permissions/permissionsConfigTypes';
import {
  createEmptyMenuForm,
  createEmptyRoleForm,
  createEmptyUserForm,
  getUserIdentity,
} from '../components/permissions/permissionsConfigData';
import type {
  MenuFormState,
  RoleFormState,
  UserFormState,
} from '../components/permissions/PermissionsFormModals';

export const usePermissionsDialogState = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('users');
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [menuModalOpen, setMenuModalOpen] = useState(false);

  const [userForm, setUserForm] = useState<UserFormState>(createEmptyUserForm());
  const [roleForm, setRoleForm] = useState<RoleFormState>(createEmptyRoleForm());
  const [menuForm, setMenuForm] = useState<MenuFormState>(createEmptyMenuForm());

  const openCreateUser = useCallback(() => {
    setUserForm(createEmptyUserForm());
    setUserModalOpen(true);
  }, []);

  const openEditUser = useCallback((user: User) => {
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
  }, []);

  const openCreateRole = useCallback(() => {
    setRoleForm(createEmptyRoleForm());
    setRoleModalOpen(true);
  }, []);

  const openEditRole = useCallback((role: Role) => {
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
  }, []);

  const openCreateMenu = useCallback(() => {
    setMenuForm(createEmptyMenuForm());
    setMenuModalOpen(true);
  }, []);

  const openEditMenu = useCallback((menu: MenuItem) => {
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
  }, []);

  return {
    activeTab,
    setActiveTab,
    userModalOpen,
    setUserModalOpen,
    roleModalOpen,
    setRoleModalOpen,
    menuModalOpen,
    setMenuModalOpen,
    userForm,
    setUserForm,
    roleForm,
    setRoleForm,
    menuForm,
    setMenuForm,
    openCreateUser,
    openEditUser,
    openCreateRole,
    openEditRole,
    openCreateMenu,
    openEditMenu,
  };
};
