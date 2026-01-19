import { api } from './client';
import type { User, Role, PermissionItem } from '@/types';

export const rbacApi = {
  // Users
  getUsers: () => api.get<User[]>('/rbac/users'),
  createUser: (data: Partial<User>) => api.post<User>('/rbac/users', data),
  updateUser: (id: number, data: Partial<User>) => api.put<User>(`/rbac/users/${id}`, data),
  deleteUser: (id: number) => api.delete(`/rbac/users/${id}`),

  // Roles
  getRoles: () => api.get<Role[]>('/rbac/roles'),
  createRole: (data: Partial<Role>) => api.post<Role>('/rbac/roles', data),
  updateRole: (id: number, data: Partial<Role>) => api.put<Role>(`/rbac/roles/${id}`, data),
  deleteRole: (id: number) => api.delete(`/rbac/roles/${id}`),

  // Permissions
  getPermissions: () => api.get<PermissionItem[]>('/rbac/permissions'),
  createPermission: (data: Partial<PermissionItem>) =>
    api.post<PermissionItem>('/rbac/permissions', data),
  updatePermission: (id: number, data: Partial<PermissionItem>) =>
    api.put<PermissionItem>(`/rbac/permissions/${id}`, data),
  deletePermission: (id: number) => api.delete(`/rbac/permissions/${id}`),
};
