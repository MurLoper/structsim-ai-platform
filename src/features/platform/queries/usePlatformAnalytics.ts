import { useQuery } from '@tanstack/react-query';
import { platformApi } from '@/api/platform';
import { queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/stores';

export const usePlatformAnalytics = (days: number) => {
  const { isAuthenticated, token } = useAuthStore();
  const hasAuthToken = !!token && !!localStorage.getItem('auth_token');

  return useQuery({
    queryKey: queryKeys.platform.analytics(days),
    queryFn: async () => {
      const response = await platformApi.getAnalyticsSummary(days);
      return response.data;
    },
    enabled: isAuthenticated && hasAuthToken,
    staleTime: 60000,
  });
};
