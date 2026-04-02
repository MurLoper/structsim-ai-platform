import { useQuery } from '@tanstack/react-query';
import { platformApi } from '@/api/platform';
import { queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/stores';

export const usePlatformBootstrap = () => {
  const { isAuthenticated, token } = useAuthStore();
  const hasAuthToken = !!token && !!localStorage.getItem('auth_token');

  return useQuery({
    queryKey: queryKeys.platform.bootstrap(),
    queryFn: async () => {
      const response = await platformApi.getBootstrap();
      return response.data;
    },
    enabled: isAuthenticated && hasAuthToken,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: query => {
      const seconds = query.state.data?.announcementPollIntervalSeconds;
      return seconds && seconds > 0 ? seconds * 1000 : false;
    },
  });
};
