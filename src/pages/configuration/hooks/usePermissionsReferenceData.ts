import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/ui';
import { rbacApi } from '@/api/rbac';
import { useMenuStore } from '@/stores/menuStore';
import type { MenuItem, PermissionItem, Role, User } from '@/types';
import type { MenuRow } from '../components/permissions/permissionsConfigTypes';
import {
  buildFlatMenuRows,
  getErrorMessage,
  normalizeMenu,
} from '../components/permissions/permissionsConfigData';
import type { MenuFormState } from '../components/permissions/PermissionsFormModals';

export const usePermissionsReferenceData = (menuForm: MenuFormState) => {
  const { showToast } = useToast();
  const clearMenus = useMenuStore(state => state.clearMenus);
  const fetchMenus = useMenuStore(state => state.fetchMenus);

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes, permissionsRes, menusRes] = await Promise.all([
        rbacApi.getUsers(),
        rbacApi.getRoles(),
        rbacApi.getPermissions(),
        rbacApi.getMenus(),
      ]);
      setUsers(usersRes.data || []);
      setRoles(rolesRes.data || []);
      setPermissions(permissionsRes.data || []);
      setMenus((menusRes.data || []).map(normalizeMenu));
    } catch (error) {
      showToast('error', getErrorMessage(error, '加载权限配置失败'));
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const refreshSidebarMenus = useCallback(async () => {
    try {
      clearMenus();
      await fetchMenus();
    } catch (error) {
      console.error('刷新侧边栏菜单失败', error);
    }
  }, [clearMenus, fetchMenus]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const menuParentOptions = useMemo(
    () => [
      { value: '0', label: '作为顶级菜单' },
      ...buildFlatMenuRows(menus)
        .filter(item => item.id !== menuForm.id)
        .map(item => ({
          value: String(item.id),
          label: `${'\u3000'.repeat(item.depth)}${item.name}`,
        })),
    ],
    [menus, menuForm.id]
  );

  const rolePermissionMap = useMemo(
    () =>
      roles.reduce<Record<number, number[]>>((acc, role) => {
        acc[role.id] = role.permissionIds || [];
        return acc;
      }, {}),
    [roles]
  );

  const menuRows = useMemo<MenuRow[]>(() => buildFlatMenuRows(menus), [menus]);

  return {
    loading,
    users,
    roles,
    permissions,
    menus,
    loadData,
    refreshSidebarMenus,
    menuParentOptions,
    rolePermissionMap,
    menuRows,
  };
};
