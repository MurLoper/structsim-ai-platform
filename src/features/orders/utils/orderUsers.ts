import type { User } from '@/types';

type RawUserRecord = User & {
  domain_account?: string;
  user_name?: string;
  real_name?: string;
  display_name?: string;
  lc_user_id?: string;
  role_ids?: number[];
  role_names?: string[];
  role_codes?: string[];
  permission_ids?: number[];
  permission_codes?: string[];
  department_id?: number | null;
  max_cpu_cores?: number;
  max_batch_size?: number;
  node_list?: number[];
  daily_round_limit_default?: number;
  daily_round_limit?: number;
  default_resource_id?: number | null;
};

export const normalizeOrderUser = (user: RawUserRecord): User => ({
  ...user,
  id: String(user.id ?? user.domainAccount ?? user.domain_account ?? ''),
  domainAccount: user.domainAccount || user.domain_account || '',
  userName: user.userName || user.user_name || '',
  realName: user.realName || user.real_name || '',
  displayName: user.displayName || user.display_name || '',
  lcUserId: user.lcUserId || user.lc_user_id || '',
  roleIds: user.roleIds || user.role_ids || [],
  roleNames: user.roleNames || user.role_names || [],
  roleCodes: user.roleCodes || user.role_codes || [],
  permissionIds: user.permissionIds || user.permission_ids || [],
  permissionCodes: user.permissionCodes || user.permission_codes || [],
  departmentId: user.departmentId ?? user.department_id ?? null,
  maxCpuCores: user.maxCpuCores ?? user.max_cpu_cores,
  maxBatchSize: user.maxBatchSize ?? user.max_batch_size,
  nodeList: user.nodeList || user.node_list || [],
  dailyRoundLimitDefault: user.dailyRoundLimitDefault ?? user.daily_round_limit_default,
  dailyRoundLimit: user.dailyRoundLimit ?? user.daily_round_limit,
  defaultResourceId: user.defaultResourceId ?? user.default_resource_id ?? null,
});

export const getOrderUserIdentity = (user: Pick<User, 'domainAccount' | 'id'>) =>
  user.domainAccount || user.id;

export const getOrderUserDisplayName = (
  user: Pick<User, 'realName' | 'userName' | 'displayName' | 'domainAccount' | 'id' | 'email'>
) => user.realName || user.userName || user.displayName || getOrderUserIdentity(user) || user.email;
