/**
 * 工况定义 Query Hooks
 * 使用 TanStack Query 管理工况定义数据的服务端状态
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { baseConfigApi } from '@/api/config/base';
import { queryKeys } from '@/lib/queryClient';
import type { ConditionDef } from '@/types/config';

/**
 * 获取工况定义列表
 */
export function useConditionDefs() {
  return useQuery({
    queryKey: queryKeys.conditionDefs.list(),
    queryFn: async () => {
      const response = await baseConfigApi.getConditionDefs();
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 创建工况定义
 */
export function useCreateConditionDef() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<ConditionDef>) => baseConfigApi.createConditionDef(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conditionDefs.all });
    },
  });
}

/**
 * 更新工况定义
 */
export function useUpdateConditionDef() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ConditionDef> }) =>
      baseConfigApi.updateConditionDef(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conditionDefs.all });
    },
  });
}

/**
 * 删除工况定义
 */
export function useDeleteConditionDef() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => baseConfigApi.deleteConditionDef(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conditionDefs.all });
    },
  });
}
