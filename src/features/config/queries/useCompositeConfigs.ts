/**
 * 组合配置 Query Hooks
 * 参数模板集 (ParamTplSet) 和 工况输出组合 (CondOutSet)
 */
import { useQuery } from '@tanstack/react-query';
import { baseConfigApi } from '@/api/config/base';
import { queryKeys } from '@/lib/queryClient';

/**
 * 获取参数模板集列表
 */
export function useParamTplSets(simTypeId?: number) {
  return useQuery({
    queryKey: queryKeys.paramGroups.list(simTypeId),
    queryFn: async () => {
      const response = await baseConfigApi.getParamTplSets(simTypeId);
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 获取参数模板项列表
 */
export function useParamTplItems(tplSetId: number) {
  return useQuery({
    queryKey: [...queryKeys.paramGroups.all, 'items', tplSetId] as const,
    queryFn: async () => {
      const response = await baseConfigApi.getParamTplItems(tplSetId);
      return response.data || [];
    },
    enabled: !!tplSetId && tplSetId > 0,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 获取工况输出组合列表
 */
export function useCondOutSets(simTypeId?: number) {
  return useQuery({
    queryKey: queryKeys.condOutGroups.list(simTypeId),
    queryFn: async () => {
      const response = await baseConfigApi.getCondOutSets(simTypeId);
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

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
 * 获取自动化模块列表
 */
export function useAutomationModules() {
  return useQuery({
    queryKey: ['automationModules', 'list'] as const,
    queryFn: async () => {
      const response = await baseConfigApi.getAutomationModules();
      return response.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * 获取工作流列表
 */
export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows', 'list'] as const,
    queryFn: async () => {
      const response = await baseConfigApi.getWorkflows();
      return response.data || [];
    },
    staleTime: 10 * 60 * 1000,
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
