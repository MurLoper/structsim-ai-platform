/**
 * 输出定义 Query Hooks
 * 使用 TanStack Query 管理输出定义数据的服务端状态
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { baseConfigApi } from '@/api/config/base';
import { queryKeys } from '@/lib/queryClient';
import type { OutputDef } from '@/types/config';

/**
 * 获取输出定义列表
 */
export function useOutputDefs() {
  return useQuery({
    queryKey: queryKeys.outputDefs.list(),
    queryFn: async () => {
      const response = await baseConfigApi.getOutputDefs();
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 创建输出定义
 */
export function useCreateOutputDef() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<OutputDef>) => baseConfigApi.createOutputDef(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.outputDefs.all });
    },
  });
}

/**
 * 更新输出定义
 */
export function useUpdateOutputDef() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<OutputDef> }) =>
      baseConfigApi.updateOutputDef(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.outputDefs.all });
    },
  });
}

/**
 * 删除输出定义
 */
export function useDeleteOutputDef() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => baseConfigApi.deleteOutputDef(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.outputDefs.all });
    },
  });
}
