import { useCallback, useEffect, useMemo, useState } from 'react';
import { rbacApi } from '@/api';
import type { PermissionItem, Role, User } from '@/types';
import type { AccessRolePermissionMap } from '../types';

export const useAccessReferenceData = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes, permsRes] = await Promise.all([
        rbacApi.getUsers(),
        rbacApi.getRoles(),
        rbacApi.getPermissions(),
      ]);
      setUsers(Array.isArray(usersRes?.data) ? usersRes.data : []);
      setRoles(Array.isArray(rolesRes?.data) ? rolesRes.data : []);
      setPermissions(Array.isArray(permsRes?.data) ? permsRes.data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const permissionNameByCode = useMemo(() => {
    const map = new Map<string, string>();
    permissions.forEach(item => map.set(item.code, item.name));
    return map;
  }, [permissions]);

  const roleNameById = useMemo(() => {
    const map = new Map<number, string>();
    roles.forEach(role => map.set(role.id, role.name));
    return map;
  }, [roles]);

  const rolePermissionMap = useMemo<AccessRolePermissionMap>(() => {
    const map: AccessRolePermissionMap = {};
    roles.forEach(role => {
      map[role.id] = role.permissionIds || [];
    });
    return map;
  }, [roles]);

  return {
    loading,
    users,
    roles,
    permissions,
    permissionNameByCode,
    roleNameById,
    rolePermissionMap,
    loadData,
  };
};
