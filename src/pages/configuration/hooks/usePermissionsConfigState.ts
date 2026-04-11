import { useCallback, useState } from 'react';
import { useConfirmDialog, useToast } from '@/components/ui';
import { rbacApi } from '@/api/rbac';
import { useI18n } from '@/hooks';
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
  const { t } = useI18n();
  const { showToast } = useToast();
  const { showConfirm, ConfirmDialogComponent } = useConfirmDialog();
  const dialogs = usePermissionsDialogState();
  const reference = usePermissionsReferenceData(dialogs.menuForm);
  const [saving, setSaving] = useState(false);

  const handleDeleteUser = useCallback(
    (user: User) => {
      const displayName =
        user.realName || user.userName || user.domainAccount || user.email || String(user.id);
      showConfirm(
        t('cfg.permissions.delete_user_title'),
        t('cfg.permissions.delete_user_confirm', { name: displayName }),
        async () => {
          try {
            await rbacApi.deleteUser(getUserIdentity(user));
            showToast('success', t('cfg.permissions.delete_user_success'));
            await reference.loadData();
          } catch (error) {
            showToast('error', getErrorMessage(error, t('cfg.permissions.delete_user_failed')));
          }
        },
        'danger'
      );
    },
    [reference, showConfirm, showToast, t]
  );

  const handleDeleteRole = useCallback(
    (role: Role) => {
      showConfirm(
        t('cfg.permissions.delete_role_title'),
        t('cfg.permissions.delete_role_confirm', { name: role.name }),
        async () => {
          try {
            await rbacApi.deleteRole(role.id);
            showToast('success', t('cfg.permissions.delete_role_success'));
            await reference.loadData();
          } catch (error) {
            showToast('error', getErrorMessage(error, t('cfg.permissions.delete_role_failed')));
          }
        },
        'danger'
      );
    },
    [reference, showConfirm, showToast, t]
  );

  const handleDeleteMenu = useCallback(
    (menu: MenuItem) => {
      showConfirm(
        t('cfg.permissions.delete_menu_title'),
        t('cfg.permissions.delete_menu_confirm', { name: menu.name }),
        async () => {
          try {
            await rbacApi.deleteMenu(menu.id);
            showToast('success', t('cfg.permissions.delete_menu_success'));
            await Promise.all([reference.loadData(), reference.refreshSidebarMenus()]);
          } catch (error) {
            showToast('error', getErrorMessage(error, t('cfg.permissions.delete_menu_failed')));
          }
        },
        'danger'
      );
    },
    [reference, showConfirm, showToast, t]
  );

  const handleSaveUser = useCallback(async () => {
    if (!dialogs.userForm.email.trim() || !dialogs.userForm.domainAccount.trim()) {
      showToast('warning', t('cfg.permissions.user_required'));
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
        showToast('success', t('cfg.permissions.user_update_success'));
      } else {
        await rbacApi.createUser(payload);
        showToast('success', t('cfg.permissions.user_create_success'));
      }
      dialogs.setUserModalOpen(false);
      await reference.loadData();
    } catch (error) {
      showToast('error', getErrorMessage(error, t('cfg.permissions.user_save_failed')));
    } finally {
      setSaving(false);
    }
  }, [dialogs, reference, showToast, t]);

  const handleSaveRole = useCallback(async () => {
    if (!dialogs.roleForm.name.trim()) {
      showToast('warning', t('cfg.permissions.role_required'));
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
        showToast('success', t('cfg.permissions.role_update_success'));
      } else {
        await rbacApi.createRole(payload);
        showToast('success', t('cfg.permissions.role_create_success'));
      }
      dialogs.setRoleModalOpen(false);
      await reference.loadData();
    } catch (error) {
      showToast('error', getErrorMessage(error, t('cfg.permissions.role_save_failed')));
    } finally {
      setSaving(false);
    }
  }, [dialogs, reference, showToast, t]);

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
        showToast(
          'success',
          t('cfg.permissions.permission_update_success', { name: targetRole.name })
        );
        await reference.loadData();
      } catch (error) {
        showToast('error', getErrorMessage(error, t('cfg.permissions.permission_update_failed')));
      }
    },
    [reference, showToast, t]
  );

  const handleBulkApplyPermissions = useCallback(
    async (roleId: number, permissionIds: number[]) => {
      const targetRole = reference.roles.find(item => item.id === roleId);
      if (!targetRole) return;

      try {
        await rbacApi.updateRole(roleId, { permission_ids: permissionIds });
        showToast(
          'success',
          t('cfg.permissions.permission_bulk_update_success', { name: targetRole.name })
        );
        await reference.loadData();
      } catch (error) {
        showToast(
          'error',
          getErrorMessage(error, t('cfg.permissions.permission_bulk_update_failed'))
        );
      }
    },
    [reference, showToast, t]
  );

  const handleSaveMenu = useCallback(async () => {
    if (!dialogs.menuForm.name.trim()) {
      showToast('warning', t('cfg.permissions.menu_required'));
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
        showToast('success', t('cfg.permissions.menu_update_success'));
      } else {
        await rbacApi.createMenu(payload);
        showToast('success', t('cfg.permissions.menu_create_success'));
      }
      dialogs.setMenuModalOpen(false);
      await Promise.all([reference.loadData(), reference.refreshSidebarMenus()]);
    } catch (error) {
      showToast('error', getErrorMessage(error, t('cfg.permissions.menu_save_failed')));
    } finally {
      setSaving(false);
    }
  }, [dialogs, reference, showToast, t]);

  return {
    ...dialogs,
    ...reference,
    saving,
    ConfirmDialogComponent,
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
