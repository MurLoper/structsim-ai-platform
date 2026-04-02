import { useQuery } from '@tanstack/react-query';
import { ordersApi, type OrdersQueryParams } from '@/api/orders';
import { queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/stores';
import type { OrdersListResponse } from '@/types/order';
import { normalizeOrdersListResponse } from '../utils/orderRecords';

export function useOrders(params: OrdersQueryParams = {}) {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: [...queryKeys.orders.list(), params] as const,
    queryFn: async () => {
      const response = await ordersApi.getOrders(params);
      if (response && 'items' in response) {
        return normalizeOrdersListResponse(response as OrdersListResponse);
      }
      return normalizeOrdersListResponse((response as { data: OrdersListResponse }).data);
    },
    staleTime: 30 * 1000,
    enabled: isAuthenticated,
  });
}
