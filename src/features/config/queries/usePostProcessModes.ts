import { useQuery } from '@tanstack/react-query';
import { baseConfigApi } from '@/api/config/base';
import { queryKeys } from '@/lib/queryClient';
import type { PostProcessMode } from '@/types/config';

const DEFAULT_POST_PROCESS_MODES: PostProcessMode[] = [
  {
    code: '18',
    name: 'Other',
    isDefault: 1,
    source: 'fallback',
    remark: '默认后处理方式',
  },
  {
    code: '35',
    name: 'RF_AT_XX',
    isDefault: 0,
    source: 'fallback',
    remark: '特殊后处理方式示例',
  },
];

export function usePostProcessModes() {
  return useQuery({
    queryKey: queryKeys.postProcessModes.list(),
    queryFn: async () => {
      const response = await baseConfigApi.getPostProcessModes();
      const items = response.data || [];
      return items.length > 0 ? items : DEFAULT_POST_PROCESS_MODES;
    },
    staleTime: 5 * 60 * 1000,
  });
}
