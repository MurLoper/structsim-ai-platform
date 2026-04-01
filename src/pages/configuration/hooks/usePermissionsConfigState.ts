import { useCallback, useState } from 'react';
import { useToast } from '@/components/ui';
import { rbacApi } from '@/api/rbac';
import type { MenuItem, Role, User } from '@/types';
import { getErrorMessage, getUserIdentity } from '../components/permissions/permissionsConfigData';
import { usePermissionsDialogState } from './usePermissionsDialogState';
import { usePermissionsReferenceData } from './usePermissionsReferenceData';

const parseNodeList = (value: string) =>
  value
    .split(/[,\s]+/)
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => Number(item))
    .filter(item => Number.isFinite(item));

export const usePermissionsConfigState = () => {
  const { showToast } = useToast();
  const dialogs = usePermissionsDialogState();
  const reference = usePermissionsReferenceData(dialogs.menuForm);
  const [saving, setSaving] = useState(false);

  const handleDeleteUser = useCallback(
    async (user: User) => {
      const displayName =
        user.realName || user.userName || user.domainAccount || user.email || String(user.id);
      if (!window.confirm(`确定删除用户“${displayName}”吗？`)) {
        return;
      }

      try {
        await rbacApi.deleteUser(getUserIdentity(user));
        showToast('success', '用户已删除');
        await reference.loadData();
      } catch (error) {
        showToast('error', getErrorMessage(error, '删除用户失败'));
      }
    },
    [reference, showToast]
  );

  const handleDeleteRole = useCallback(
    async (role: Role) => {
      if (!window.confirm(`确定删除权限组“${role.name}”吗？`)) {
        return;
      }

      try {
        await rbacApi.deleteRole(role.id);
        showToast('success', '权限组已删除');
        await reference.loadData();
      } catch (error) {
        showToast('error', getErrorMessage(error, '删除权限组失败'));
      }
    },
    [reference, showToast]
  );

  const handleDeleteMenu = useCallback(
    async (menu: MenuItem) => {
      if (!window.confirm(`确定删除菜单“${menu.name}”吗？如有子菜单，请先删除子菜单。`)) {
        return;
      }

      try {
        await rbacApi.deleteMenu(menu.id);
        showToast('success', '菜单已删除');
        await Promise.all([reference.loadData(), reference.refreshSidebarMenus()]);
      } catch (error) {
        showToast('error', getErrorMessage(error, '删除菜单失败'));
      }
    },
    [reference, showToast]
  );

  const handleSaveUser = useCallback(async () => {
    if (!dialogs.userForm.email.trim() || !dialogs.userForm.domainAccount.trim()) {
      showToast('warning', '请至少填写邮箱和域账号');
      return;
    }

    const payload = {
      email: dialogs.userForm.email.trim(),
      domain_account: dialogs.userForm.domainAccount.trim(),
      lc_user_id: dialogs.userForm.lcUserId.trim() || null,
      user_name: dialogs.userForm.userName.trim() || null,
      real_name: dialogs.userForm.realName.trim() || null,
      department: dialogs.userForm.department.trim() || null,
      role_ids: dialogs.userForm.roleIds,
      daily_round_limit: dialogs.userForm.dailyRoundLimit
        ? Number(dialogs.userForm.dailyRoundLimit)
        : null,
      valid: dialogs.userForm.valid ? 1 : 0,
    };

    setSaving(true);
    try {
      if (dialogs.userForm.id) {
        await rbacApi.updateUser(dialogs.userForm.id, payload);
        showToast('success', '用户信息已更新');
      } else {
        await rbacApi.createUser(payload);
        showToast('success', '用户已创建');
      }
      dialogs.setUserModalOpen(false);
      await reference.loadData();
    } catch (error) {
      showToast('error', getErrorMessage(error, '保存用户失败'));
    } finally {
      setSaving(false);
    }
  }, [dialogs, reference, showToast]);

  const handleSaveRole = useCallback(async () => {
    if (!dialogs.roleForm.name.trim()) {
      showToast('warning', '请输入权限组名称');
      return;
    }

    const payload = {
      name: dialogs.roleForm.name.trim(),
      code: dialogs.roleForm.code.trim() || null,
      description: dialogs.roleForm.description.trim() || null,
      permission_ids: dialogs.roleForm.permissionIds,
      max_cpu_cores: Number(dialogs.roleForm.maxCpuCores || 192),
      max_batch_size: Number(dialogs.roleForm.maxBatchSize || 200),
      daily_round_limit_default: Number(dialogs.roleForm.dailyRoundLimitDefault || 500),
      node_list: parseNodeList(dialogs.roleForm.nodeList),
      sort: Number(dialogs.roleForm.sort || 100),
      valid: dialogs.roleForm.valid ? 1 : 0,
    };

    setSaving(true);
    try {
      if (dialogs.roleForm.id) {
        await rbacApi.updateRole(dialogs.roleForm.id, payload);
        showToast('success', '权限组已更新');
      } else {
        await rbacApi.createRole(payload);
        showToast('success', '权限组已创建');
      }
      dialogs.setRoleModalOpen(false);
      await reference.loadData();
    } catch (error) {
      showToast('error', getErrorMessage(error, '保存权限组失败'));
    } finally {
      setSaving(false);
    }
  }, [dialogs, reference, showToast]);

  const handleToggleRolePermission = useCallback(
    async (roleId: number, permissionId: number) => {
      const targetRole = reference.roles.find(item => item.id === roleId);
      if (!targetRole) return;

      const currentIds = targetRole.permissionIds || [];
      const nextIds = currentIds.includes(permissionId)
        ? currentIds.filter(id => id !== permissionId)
        : [...currentIds, permissionId];

      try {
        await rbacApi.updateRole(roleId, { permission_ids: nextIds });
        showToast('success', `已更新 ${targetRole.name} 的权限配置`);
        await reference.loadData();
      } catch (error) {
        showToast('error', getErrorMessage(error, '更新权限矩阵失败'));
      }
    },
    [reference, showToast]
  );

  const handleBulkApplyPermissions = useCallback(
    async (roleId: number, permissionIds: number[]) => {
      const targetRole = reference.roles.find(item => item.id === roleId);
      if (!targetRole) return;

      try {
        await rbacApi.updateRole(roleId, { permission_ids: permissionIds });
        showToast('success', `已批量更新 ${targetRole.name} 的权限配置`);
        await reference.loadData();
      } catch (error) {
        showToast('error', getErrorMessage(error, '批量授权失败'));
      }
    },
    [reference, showToast]
  );

  const handleSaveMenu = useCallback(async () => {
    if (!dialogs.menuForm.name.trim()) {
      showToast('warning', '请输入菜单名称');
      return;
    }

    const payload = {
      parent_id: Number(dialogs.menuForm.parentId || 0),
      name: dialogs.menuForm.name.trim(),
      title_i18n_key: dialogs.menuForm.titleI18nKey.trim() || null,
      icon: dialogs.menuForm.icon.trim() || null,
      path: dialogs.menuForm.path.trim() || null,
      component: dialogs.menuForm.component.trim() || null,
      menu_type: dialogs.menuForm.menuType,
      permission_code: dialogs.menuForm.permissionCode.trim() || null,
      hidden: dialogs.menuForm.hidden ? 1 : 0,
      valid: dialogs.menuForm.valid ? 1 : 0,
      sort: Number(dialogs.menuForm.sort || 100),
    };

    setSaving(true);
    try {
      if (dialogs.menuForm.id) {
        await rbacApi.updateMenu(dialogs.menuForm.id, payload);
        showToast('success', '菜单已更新');
      } else {
        await rbacApi.createMenu(payload);
        showToast('success', '菜单已创建');
      }
      dialogs.setMenuModalOpen(false);
      await Promise.all([reference.loadData(), reference.refreshSidebarMenus()]);
    } catch (error) {
      showToast('error', getErrorMessage(error, '保存菜单失败'));
    } finally {
      setSaving(false);
    }
  }, [dialogs, reference, showToast]);

  return {
    ...dialogs,
    ...reference,
    saving,
    handleDeleteUser,
    handleDeleteRole,
    handleDeleteMenu,
    handleSaveUser,
    handleSaveRole,
    handleSaveMenu,
    handleToggleRolePermission,
    handleBulkApplyPermissions,
  };
};
