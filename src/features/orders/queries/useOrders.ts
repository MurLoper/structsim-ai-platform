import { useQuery } from '@tanstack/react-query';
import { ordersApi, type OrdersQueryParams } from '@/api/orders';
import { queryKeys } from '@/lib/queryClient';
import type { OrdersListResponse } from '@/types/order';

export function useOrders(params: OrdersQueryParams = {}) {
  return useQuery({
    queryKey: [...queryKeys.orders.list(), params] as const,
    queryFn: async () => {
      const response = await ordersApi.getOrders(params);
      return response.data as OrdersListResponse;
    },
    staleTime: 30 * 1000,
  });
}
