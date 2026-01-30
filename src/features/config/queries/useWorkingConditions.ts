/**
 * 工况配置 Query Hooks
 * 管理姿态-仿真类型组合的工况配置数据
 */
import { useQuery } from '@tanstack/react-query';
import { baseConfigApi } from '@/api/config/base';
import { queryKeys } from '@/lib/queryClient';

/**
 * 获取所有工况配置
 */
export function useWorkingConditions() {
  return useQuery({
    queryKey: queryKeys.workingConditions.list(),
    queryFn: async () => {
      const response = await baseConfigApi.getWorkingConditions();
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 根据姿态ID获取工况配置
 */
export function useWorkingConditionsByFoldType(foldTypeId: number | null) {
  return useQuery({
    queryKey: queryKeys.workingConditions.byFoldType(foldTypeId),
    queryFn: async () => {
      if (!foldTypeId) return [];
      const response = await baseConfigApi.getWorkingConditionsByFoldType(foldTypeId);
      return response.data || [];
    },
    enabled: !!foldTypeId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 获取姿态-仿真类型关联列表
 */
export function useFoldTypeSimTypeRels() {
  return useQuery({
    queryKey: queryKeys.foldTypeSimTypeRels.list(),
    queryFn: async () => {
      const response = await baseConfigApi.getFoldTypeSimTypeRels();
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 根据姿态ID获取支持的仿真类型列表
 */
export function useSimTypesByFoldType(foldTypeId: number | null) {
  return useQuery({
    queryKey: queryKeys.simTypes.byFoldType(foldTypeId),
    queryFn: async () => {
      if (!foldTypeId && foldTypeId !== 0) return [];
      const response = await baseConfigApi.getSimTypesByFoldType(foldTypeId);
      return response.data || [];
    },
    enabled: foldTypeId !== null,
    staleTime: 5 * 60 * 1000,
  });
}
