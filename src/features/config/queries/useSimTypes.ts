/**
 * 仿真类型 Query Hooks
 * 使用 TanStack Query 管理仿真类型数据的服务端状态
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { baseConfigApi } from '@/api/config/base';
import { queryKeys } from '@/lib/queryClient';
import type { SimType } from '@/types/config';

/**
 * 获取仿真类型列表
 */
export function useSimTypes() {
  return useQuery({
    queryKey: queryKeys.simTypes.list(),
    queryFn: async () => {
      const response = await baseConfigApi.getSimTypes();
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 创建仿真类型
 */
export function useCreateSimType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<SimType>) => baseConfigApi.createSimType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.simTypes.all });
    },
  });
}

/**
 * 更新仿真类型
 */
export function useUpdateSimType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SimType> }) =>
      baseConfigApi.updateSimType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.simTypes.all });
    },
  });
}

/**
 * 删除仿真类型
 */
export function useDeleteSimType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => baseConfigApi.deleteSimType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.simTypes.all });
    },
  });
}
