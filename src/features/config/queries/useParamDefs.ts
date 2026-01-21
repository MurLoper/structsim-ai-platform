/**
 * 参数定义 Query Hooks
 * 使用 TanStack Query 管理参数定义数据的服务端状态
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { baseConfigApi } from '@/api/config/base';
import { queryKeys } from '@/lib/queryClient';
import type { ParamDef } from '@/types/config';

const toParamDefPayload = (data: Partial<ParamDef>) => {
  const payload: Record<string, unknown> = { ...data };
  if (data.valType !== undefined) {
    payload.val_type = data.valType;
    delete payload.valType;
  }
  if (data.minVal !== undefined) {
    payload.min_val = data.minVal;
    delete payload.minVal;
  }
  if (data.maxVal !== undefined) {
    payload.max_val = data.maxVal;
    delete payload.maxVal;
  }
  if (data.defaultVal !== undefined) {
    payload.default_val = data.defaultVal;
    delete payload.defaultVal;
  }
  if (data.enumOptions !== undefined) {
    payload.enum_options = data.enumOptions;
    delete payload.enumOptions;
  }
  return payload;
};

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
    mutationFn: (data: Partial<ParamDef>) =>
      baseConfigApi.createParamDef(toParamDefPayload(data) as Partial<ParamDef>),
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
      baseConfigApi.updateParamDef(id, toParamDefPayload(data) as Partial<ParamDef>),
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
