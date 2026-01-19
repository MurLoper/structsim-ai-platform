/**
 * 求解器 Query Hooks
 * 使用 TanStack Query 管理求解器数据的服务端状态
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { baseConfigApi } from '@/api/config/base';
import { queryKeys } from '@/lib/queryClient';
import type { Solver } from '@/types/config';

/**
 * 获取求解器列表
 */
export function useSolvers() {
  return useQuery({
    queryKey: queryKeys.solvers.list(),
    queryFn: async () => {
      const response = await baseConfigApi.getSolvers();
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 创建求解器
 */
export function useCreateSolver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Solver>) => baseConfigApi.createSolver(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.solvers.all });
    },
  });
}

/**
 * 更新求解器
 */
export function useUpdateSolver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Solver> }) =>
      baseConfigApi.updateSolver(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.solvers.all });
    },
  });
}

/**
 * 删除求解器
 */
export function useDeleteSolver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => baseConfigApi.deleteSolver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.solvers.all });
    },
  });
}
