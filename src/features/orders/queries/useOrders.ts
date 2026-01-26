import { useQuery } from '@tanstack/react-query';
import { ordersApi, type OrdersQueryParams } from '@/api/orders';
import { queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/stores';
import type { OrdersListResponse } from '@/types/order';

export function useOrders(params: OrdersQueryParams = {}) {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: [...queryKeys.orders.list(), params] as const,
    queryFn: async () => {
      const response = await ordersApi.getOrders(params);
      // Mock 数据直接返回对象，API 响应需要取 data
      if (response && 'items' in response) {
        return response as OrdersListResponse;
      }
      return (response as { data: OrdersListResponse }).data;
    },
    staleTime: 30 * 1000,
    enabled: isAuthenticated,
  });
}
