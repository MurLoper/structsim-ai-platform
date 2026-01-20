import { api } from './client';
import type { OrdersListResponse } from '@/types/order';

export interface OrdersQueryParams {
  page?: number;
  pageSize?: number;
  status?: number;
  projectId?: number;
}

export const ordersApi = {
  getOrders: (params?: OrdersQueryParams) => api.get<OrdersListResponse>('/orders', { params }),
};
