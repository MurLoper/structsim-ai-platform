import type { Role, User } from '@/types';
import type { AccessStatusVariant, AccessUserIdentity, AccessUserRoleIdentity } from '../types';

export const getStatusVariant = (status?: string | number): AccessStatusVariant => {
  if (status === 0 || status === 'disabled' || status === 'inactive') return 'error';
  if (status === 'pending') return 'warning';
  return 'success';
};

export const getUserIdentity = (user: AccessUserRoleIdentity) => user.domainAccount || user.id;

export const getUserDisplayName = (user: AccessUserIdentity) =>
  user.realName || user.userName || user.displayName || getUserIdentity(user) || user.email;

export const isAdminUser = (user: User) =>
  user.roleCodes?.includes('ADMIN') || user.email?.toLowerCase() === 'alice@sim.com';

export const isAdminRole = (role: Role) => role.code === 'ADMIN';
