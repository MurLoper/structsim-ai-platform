import { api } from './client';
import type { OrdersListResponse, OrderDetail, OrderCreatePayload } from '@/types/order';

export interface OrdersQueryParams {
  page?: number;
  pageSize?: number;
  status?: number;
  projectId?: number;
}

export const ordersApi = {
  getOrders: (params?: OrdersQueryParams) => api.get<OrdersListResponse>('/orders', { params }),
  getOrder: (orderId: number) => api.get<OrderDetail>(`/orders/${orderId}`),
  createOrder: (payload: OrderCreatePayload) => api.post<OrderDetail>('/orders', payload),
};
