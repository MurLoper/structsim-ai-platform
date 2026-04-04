import { useQueries } from '@tanstack/react-query';
import { platformApi } from '@/api/platform';
import { queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/stores';

const usePlatformQueryEnabled = () => {
  const { isAuthenticated, token } = useAuthStore();
  return isAuthenticated && !!token && !!localStorage.getItem('auth_token');
};

export const usePlatformAnalytics = (days: number) => {
  const enabled = usePlatformQueryEnabled();

  const [summaryQuery, featuresQuery, funnelsQuery, failuresQuery] = useQueries({
    queries: [
      {
        queryKey: queryKeys.platform.analyticsSummary(days),
        queryFn: async () => {
          const response = await platformApi.getAnalyticsSummary(days);
          return response.data;
        },
        enabled,
        staleTime: 60000,
      },
      {
        queryKey: queryKeys.platform.analyticsFeatures(days),
        queryFn: async () => {
          const response = await platformApi.getAnalyticsFeatures(days);
          return response.data;
        },
        enabled,
        staleTime: 60000,
      },
      {
        queryKey: queryKeys.platform.analyticsFunnels(days),
        queryFn: async () => {
          const response = await platformApi.getAnalyticsFunnels(days);
          return response.data;
        },
        enabled,
        staleTime: 60000,
      },
      {
        queryKey: queryKeys.platform.analyticsFailures(days),
        queryFn: async () => {
          const response = await platformApi.getAnalyticsFailures(days);
          return response.data;
        },
        enabled,
        staleTime: 60000,
      },
    ],
  });

  return {
    summary: summaryQuery.data,
    features: featuresQuery.data,
    funnels: funnelsQuery.data,
    failures: failuresQuery.data,
    isLoading:
      summaryQuery.isLoading ||
      featuresQuery.isLoading ||
      funnelsQuery.isLoading ||
      failuresQuery.isLoading,
    error: summaryQuery.error || featuresQuery.error || funnelsQuery.error || failuresQuery.error,
  };
};
