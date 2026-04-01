import type { Role, User } from '@/types';

export type AccessTabKey = 'users' | 'roles' | 'perms';

export type UserFormState = {
  domainAccount: string;
  email: string;
  userName: string;
  realName: string;
  password: string;
  roleIds: number[];
  valid: number;
};

export type RoleFormState = {
  name: string;
  code: string;
  description: string;
};

export type PermissionFormState = {
  name: string;
  code: string;
  type: string;
  resource: string;
  description: string;
};

export type AccessUserIdentity = Pick<
  User,
  'realName' | 'userName' | 'displayName' | 'domainAccount' | 'id' | 'email'
>;
export type AccessUserDisplayNameGetter = (user: AccessUserIdentity) => string | number;

export type AccessUserRoleIdentity = Pick<User, 'domainAccount' | 'id'>;

export type RoleLookup = Map<number, string>;
export type PermissionLookup = Map<string, string>;
export type AccessStatusVariant = 'success' | 'warning' | 'error';

export type AccessRolePermissionMap = Record<Role['id'], number[]>;
