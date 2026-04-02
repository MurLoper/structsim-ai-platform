import { useQuery } from '@tanstack/react-query';
import { platformApi } from '@/api/platform';
import { queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/stores';

export const usePlatformAnalytics = (days: number) => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.platform.analytics(days),
    queryFn: async () => {
      const response = await platformApi.getAnalyticsSummary(days);
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 60000,
  });
};
