/**
 * 关注器件 Query Hooks
 * 使用 TanStack Query 管理关注器件数据的服务端状态
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { baseConfigApi } from '@/api/config/base';
import { queryKeys } from '@/lib/queryClient';
import type { CareDevice } from '@/types/config';

/**
 * 获取关注器件列表
 */
export function useCareDevices() {
  return useQuery({
    queryKey: queryKeys.careDevices.list(),
    queryFn: async () => {
      const response = await baseConfigApi.getCareDevices();
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 创建关注器件
 */
export function useCreateCareDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CareDevice>) => baseConfigApi.createCareDevice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.careDevices.all });
    },
  });
}

/**
 * 更新关注器件
 */
export function useUpdateCareDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CareDevice> }) =>
      baseConfigApi.updateCareDevice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.careDevices.all });
    },
  });
}

/**
 * 删除关注器件
 */
export function useDeleteCareDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => baseConfigApi.deleteCareDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.careDevices.all });
    },
  });
}
