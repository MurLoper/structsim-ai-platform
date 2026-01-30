/**
 * 工况配置 Query Hooks
 * 管理姿态-仿真类型组合的工况配置数据
 */
import { useQuery } from '@tanstack/react-query';
import { baseConfigApi } from '@/api/config/base';
import { queryKeys } from '@/lib/queryClient';

// ============ 新版工况配置 Hooks ============

/**
 * 获取所有工况配置（新版）
 */
export function useConditionConfigs() {
  return useQuery({
    queryKey: ['conditionConfigs', 'list'],
    queryFn: async () => {
      const response = await baseConfigApi.getConditionConfigs();
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 根据姿态+仿真类型获取工况配置
 */
export function useConditionByFoldSim(foldTypeId: number | null, simTypeId: number | null) {
  return useQuery({
    queryKey: ['conditionConfigs', 'byFoldSim', foldTypeId, simTypeId],
    queryFn: async () => {
      if (!foldTypeId || !simTypeId) return null;
      const response = await baseConfigApi.getConditionByFoldSim(foldTypeId, simTypeId);
      return response.data || null;
    },
    enabled: !!foldTypeId && !!simTypeId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 根据姿态ID获取工况配置列表
 */
export function useConditionsByFoldType(foldTypeId: number | null) {
  return useQuery({
    queryKey: ['conditionConfigs', 'byFoldType', foldTypeId],
    queryFn: async () => {
      if (!foldTypeId) return [];
      const response = await baseConfigApi.getConditionsByFoldType(foldTypeId);
      return response.data || [];
    },
    enabled: !!foldTypeId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============ 旧版工况配置 Hooks（兼容） ============

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
