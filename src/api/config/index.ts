// 导出所有类型（从 @/types 统一导出）
export * from '@/types/config';
export * from '@/types/configGroups';

// 导入各个子模块
import { baseConfigApi } from './base';
import { paramGroupsApi, outputGroupsApi, configRelationsApi, orderInitApi } from './groups';

// 统一导出 configApi（推荐使用方式）
export const configApi = {
  ...baseConfigApi,
  ...paramGroupsApi,
  ...outputGroupsApi,
  ...configRelationsApi,
  ...orderInitApi,
};

// 也可以按模块导出（如果需要单独使用某个模块）
export { baseConfigApi, paramGroupsApi, outputGroupsApi, configRelationsApi, orderInitApi };
