// User & Auth Types
export type Permission =
  | 'VIEW_DASHBOARD'
  | 'MANAGE_CONFIG'
  | 'VIEW_RESULTS'
  | 'MANAGE_USERS'
  | 'CREATE_ORDER'
  | 'VIEW_ORDERS';

export interface PermissionItem {
  id: number;
  name: string;
  code: string;
  type?: string;
  resource?: string;
  description?: string;
  valid?: number;
  sort?: number;
}

export interface Role {
  id: number;
  name: string;
  code?: string;
  description?: string;
  permissionIds?: number[];
  permissionCodes?: string[];
  maxCpuCores?: number;
  maxBatchSize?: number;
  nodeList?: number[];
  dailyRoundLimitDefault?: number;
  valid?: number;
  sort?: number;
}

export interface User {
  id: string;
  domainAccount: string;
  email: string;
  avatar?: string;
  permissions?: Permission[];
  userName?: string;
  realName?: string;
  displayName?: string;
  lcUserId?: string;
  password?: string;
  role?: string;
  status?: string;
  roleIds?: number[];
  roleIdList?: number[];
  roleNames?: string[];
  roleCodes?: string[];
  permissionIds?: number[];
  permissionCodes?: string[];
  department?: string;
  maxCpuCores?: number;
  maxBatchSize?: number;
  nodeList?: number[];
  dailyRoundLimitDefault?: number;
  dailyRoundLimit?: number;
  defaultResourceId?: number | null;
  valid?: number;
  created_at?: string;
  updated_at?: string;
  createdAt?: number;
  updatedAt?: number;
  lastLoginAt?: number;
}
