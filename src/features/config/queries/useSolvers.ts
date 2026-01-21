/**
 * 求解器 Query Hooks
 * 使用 TanStack Query 管理求解器数据的服务端状态
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { baseConfigApi } from '@/api/config/base';
import { queryKeys } from '@/lib/queryClient';
import type { Solver } from '@/types/config';

const toSolverPayload = (data: Partial<Solver>) => {
  const payload: Record<string, unknown> = { ...data };
  if (data.cpuCoreMin !== undefined) {
    payload.cpu_core_min = data.cpuCoreMin;
    delete payload.cpuCoreMin;
  }
  if (data.cpuCoreMax !== undefined) {
    payload.cpu_core_max = data.cpuCoreMax;
    delete payload.cpuCoreMax;
  }
  if (data.cpuCoreDefault !== undefined) {
    payload.cpu_core_default = data.cpuCoreDefault;
    delete payload.cpuCoreDefault;
  }
  if (data.memoryMin !== undefined) {
    payload.memory_min = data.memoryMin;
    delete payload.memoryMin;
  }
  if (data.memoryMax !== undefined) {
    payload.memory_max = data.memoryMax;
    delete payload.memoryMax;
  }
  if (data.memoryDefault !== undefined) {
    payload.memory_default = data.memoryDefault;
    delete payload.memoryDefault;
  }
  return payload;
};

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
    mutationFn: (data: Partial<Solver>) =>
      baseConfigApi.createSolver(toSolverPayload(data) as Partial<Solver>),
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
      baseConfigApi.updateSolver(id, toSolverPayload(data) as Partial<Solver>),
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
