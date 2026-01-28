/**
 * 工作流配置 Query Hooks
 */
import { useQuery } from '@tanstack/react-query';
import { baseConfigApi } from '@/api/config/base';
import { queryKeys } from '@/lib/queryClient';

/**
 * 获取工作流列表
 */
export function useWorkflows() {
  return useQuery({
    queryKey: queryKeys.workflows?.list?.() || ['workflows'],
    queryFn: async () => {
      const response = await baseConfigApi.getWorkflows();
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
    queryKey: queryKeys.automationModules?.list?.() || ['automationModules'],
    queryFn: async () => {
      const response = await baseConfigApi.getAutomationModules();
      return response.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}
