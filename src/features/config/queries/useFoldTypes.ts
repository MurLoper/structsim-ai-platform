/**
 * 姿态类型 Query Hooks
 * 使用 TanStack Query 管理姿态类型数据的服务端状态
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { baseConfigApi } from '@/api/config/base';
import { queryKeys } from '@/lib/queryClient';
import type { FoldType } from '@/types/config';

/**
 * 获取姿态类型列表
 */
export function useFoldTypes() {
  return useQuery({
    queryKey: queryKeys.foldTypes.list(),
    queryFn: async () => {
      const response = await baseConfigApi.getFoldTypes();
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 创建姿态类型
 */
export function useCreateFoldType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<FoldType>) => baseConfigApi.createFoldType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.foldTypes.all });
    },
  });
}

/**
 * 更新姿态类型
 */
export function useUpdateFoldType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FoldType> }) =>
      baseConfigApi.updateFoldType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.foldTypes.all });
    },
  });
}

/**
 * 删除姿态类型
 */
export function useDeleteFoldType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => baseConfigApi.deleteFoldType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.foldTypes.all });
    },
  });
}
