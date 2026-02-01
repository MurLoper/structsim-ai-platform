/**
 * 资源池 Query Hooks
 * 使用 TanStack Query 管理资源池数据的服务端状态
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { baseConfigApi } from '@/api/config/base';
import { queryKeys } from '@/lib/queryClient';
import type { SolverResource } from '@/types/config';

/**
 * 获取资源池列表
 */
export function useSolverResources() {
  return useQuery({
    queryKey: queryKeys.solverResources.list(),
    queryFn: async () => {
      const response = await baseConfigApi.getSolverResources();
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 创建资源池
 */
export function useCreateSolverResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<SolverResource>) => baseConfigApi.createSolverResource(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.solverResources.all });
    },
  });
}

/**
 * 更新资源池
 */
export function useUpdateSolverResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SolverResource> }) =>
      baseConfigApi.updateSolverResource(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.solverResources.all });
    },
  });
}

/**
 * 删除资源池
 */
export function useDeleteSolverResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => baseConfigApi.deleteSolverResource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.solverResources.all });
    },
  });
}
