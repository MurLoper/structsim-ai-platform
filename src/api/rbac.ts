import { api } from './client';
import type { MenuItem, PermissionItem, Role, User } from '@/types';

type RbacPayload = Record<string, unknown>;

export const rbacApi = {
  // Users
  getUsers: () => api.get<User[]>('/rbac/users'),
  createUser: (data: RbacPayload) => api.post<User>('/rbac/users', data),
  updateUser: (domainAccount: string, data: RbacPayload) =>
    api.put<User>(`/rbac/users/${domainAccount}`, data),
  deleteUser: (domainAccount: string) => api.delete(`/rbac/users/${domainAccount}`),

  // Roles
  getRoles: () => api.get<Role[]>('/rbac/roles'),
  createRole: (data: RbacPayload) => api.post<Role>('/rbac/roles', data),
  updateRole: (id: number, data: RbacPayload) => api.put<Role>(`/rbac/roles/${id}`, data),
  deleteRole: (id: number) => api.delete(`/rbac/roles/${id}`),

  // Permissions
  getPermissions: () => api.get<PermissionItem[]>('/rbac/permissions'),
  createPermission: (data: RbacPayload) => api.post<PermissionItem>('/rbac/permissions', data),
  updatePermission: (id: number, data: RbacPayload) =>
    api.put<PermissionItem>(`/rbac/permissions/${id}`, data),
  deletePermission: (id: number) => api.delete(`/rbac/permissions/${id}`),

  // Menus
  getMenus: () => api.get<MenuItem[]>('/rbac/menus'),
  createMenu: (data: RbacPayload) => api.post<MenuItem>('/rbac/menus', data),
  updateMenu: (id: number, data: RbacPayload) => api.put<MenuItem>(`/rbac/menus/${id}`, data),
  deleteMenu: (id: number) => api.delete(`/rbac/menus/${id}`),
};
