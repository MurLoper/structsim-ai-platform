/**
 * 组合配置 Query Hooks
 * 参数组合 (ParamGroup) 和 输出组合 (OutputGroup)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { baseConfigApi } from '@/api/config/base';
import { paramGroupsApi } from '@/api/config/groups';
import { queryKeys } from '@/lib/queryClient';
import type { StatusDef } from '@/types/config';

/**
 * 获取参数组合列表
 */
export function useParamGroups() {
  return useQuery({
    queryKey: queryKeys.paramGroups.all,
    queryFn: async () => {
      const response = await paramGroupsApi.getParamGroups();
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * @deprecated 使用 useParamGroups 替代
 */
export const useParamTplSets = useParamGroups;

/**
 * 获取参数组合的参数列表
 */
export function useParamGroupParams(groupId: number) {
  return useQuery({
    queryKey: [...queryKeys.paramGroups.all, 'params', groupId] as const,
    queryFn: async () => {
      const response = await paramGroupsApi.getParamGroupParams(groupId);
      return response.data || [];
    },
    enabled: !!groupId && groupId > 0,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 获取输出组合列表
 */
export function useOutputGroups(simTypeId?: number) {
  return useQuery({
    queryKey: queryKeys.outputGroups.list(simTypeId),
    queryFn: async () => {
      const response = await baseConfigApi.getOutputGroups(simTypeId);
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 获取输出组合列表（别名，兼容旧代码）
 */
export const useCondOutSets = useOutputGroups;

/**
 * 获取状态定义列表
 */
export function useStatusDefs() {
  return useQuery({
    queryKey: ['statusDefs', 'list'] as const,
    queryFn: async () => {
      const response = await baseConfigApi.getStatusDefs();
      return response.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * 更新状态定义
 */
export function useUpdateStatusDef() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<StatusDef> }) =>
      baseConfigApi.updateStatusDef(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statusDefs'] });
      queryClient.invalidateQueries({ queryKey: ['baseData'] });
    },
  });
}

/**
 * 获取所有基础数据（一次性加载）
 */
export function useBaseData() {
  return useQuery({
    queryKey: ['baseData'] as const,
    queryFn: async () => {
      const response = await baseConfigApi.getBaseData();
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

// Note: useFoldTypeSimTypeRels and useConditionConfigs are exported from useWorkingConditions.ts
// to avoid duplicate exports
