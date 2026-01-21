/**
 * 仿真类型 Query Hooks
 * 使用 TanStack Query 管理仿真类型数据的服务端状态
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { baseConfigApi } from '@/api/config/base';
import { queryKeys } from '@/lib/queryClient';
import type { SimType } from '@/types/config';

const toSimTypePayload = (data: Partial<SimType>) => {
  const payload: Record<string, unknown> = { ...data };
  if (data.supportAlgMask !== undefined) {
    payload.support_alg_mask = data.supportAlgMask;
    delete payload.supportAlgMask;
  }
  if (data.nodeIcon !== undefined) {
    payload.node_icon = data.nodeIcon;
    delete payload.nodeIcon;
  }
  if (data.colorTag !== undefined) {
    payload.color_tag = data.colorTag;
    delete payload.colorTag;
  }
  return payload;
};

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
    mutationFn: (data: Partial<SimType>) =>
      baseConfigApi.createSimType(toSimTypePayload(data) as Partial<SimType>),
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
      baseConfigApi.updateSimType(id, toSimTypePayload(data) as Partial<SimType>),
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
