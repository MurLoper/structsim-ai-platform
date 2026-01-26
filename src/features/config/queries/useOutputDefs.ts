/**
 * 输出定义 Query Hooks
 * 使用 TanStack Query 管理输出定义数据的服务端状态
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { baseConfigApi } from '@/api/config/base';
import { queryKeys } from '@/lib/queryClient';
import type { OutputDef } from '@/types/config';

const DATA_TYPE_TO_VAL_TYPE: Record<string, number> = {
  float: 1,
  int: 2,
  string: 3,
};

const mapValTypeToDataType = (valType?: number) => {
  if (valType === 2) return 'int';
  if (valType === 3) return 'string';
  return 'float';
};

const normalizeOutputDef = (
  item: Partial<OutputDef> & { valType?: number; val_type?: number }
): OutputDef =>
  ({
    ...item,
    dataType: item.dataType ?? mapValTypeToDataType(item.valType ?? item.val_type),
  }) as OutputDef;

const toOutputDefPayload = (data: Partial<OutputDef>) => {
  const payload: Record<string, unknown> = { ...data };
  if (data.dataType) {
    payload.val_type = DATA_TYPE_TO_VAL_TYPE[data.dataType] ?? 1;
    delete payload.dataType;
  }
  return payload;
};

/**
 * 获取输出定义列表
 */
export function useOutputDefs() {
  return useQuery({
    queryKey: queryKeys.outputDefs.list(),
    queryFn: async () => {
      const response = await baseConfigApi.getOutputDefs();
      const items = response.data || [];
      return items.map(normalizeOutputDef);
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
    mutationFn: (data: Partial<OutputDef>) =>
      baseConfigApi.createOutputDef(toOutputDefPayload(data) as Partial<OutputDef>),
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
      baseConfigApi.updateOutputDef(id, toOutputDefPayload(data) as Partial<OutputDef>),
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
