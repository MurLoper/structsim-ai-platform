import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/api/orders';
import { queryKeys } from '@/lib/queryClient';

export const useOrderStatistics = () => {
  return useQuery({
    queryKey: queryKeys.orders.statistics(),
    queryFn: ordersApi.getStatistics,
    staleTime: 30000,
    refetchInterval: 60000,
  });
};

export const useOrderTrends = (days: number = 7) => {
  return useQuery({
    queryKey: queryKeys.orders.trends(days),
    queryFn: () => ordersApi.getTrends(days),
    staleTime: 60000,
  });
};

export const useStatusDistribution = () => {
  return useQuery({
    queryKey: queryKeys.orders.statusDistribution(),
    queryFn: ordersApi.getStatusDistribution,
    staleTime: 60000,
  });
};
