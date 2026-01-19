/**
 * 参数定义 Query Hooks
 * 使用 TanStack Query 管理参数定义数据的服务端状态
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { baseConfigApi } from '@/api/config/base';
import { queryKeys } from '@/lib/queryClient';
import type { ParamDef } from '@/types/config';

/**
 * 获取参数定义列表
 */
export function useParamDefs() {
  return useQuery({
    queryKey: queryKeys.paramDefs.list(),
    queryFn: async () => {
      const response = await baseConfigApi.getParamDefs();
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 创建参数定义
 */
export function useCreateParamDef() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<ParamDef>) => baseConfigApi.createParamDef(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.paramDefs.all });
    },
  });
}

/**
 * 更新参数定义
 */
export function useUpdateParamDef() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ParamDef> }) =>
      baseConfigApi.updateParamDef(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.paramDefs.all });
    },
  });
}

/**
 * 删除参数定义
 */
export function useDeleteParamDef() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => baseConfigApi.deleteParamDef(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.paramDefs.all });
    },
  });
}
