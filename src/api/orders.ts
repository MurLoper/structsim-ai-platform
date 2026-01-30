import { api } from './client';
import type { OrdersListResponse, OrderDetail, OrderCreatePayload } from '@/types/order';
import type { OrderStatistics, OrderTrend, StatusDistribution } from '@/types/statistics';
import {
  getMockOrdersList,
  mockOrderStatistics,
  mockOrderTrends,
  mockStatusDistribution,
} from './mocks/orders.mock';

/** 订单查询参数 */
export interface OrdersQueryParams {
  page?: number;
  pageSize?: number;
  status?: number;
  projectId?: number;
  simTypeId?: number;
  orderNo?: string;
  createdBy?: number;
  startDate?: number;
  endDate?: number;
}

// 开发环境标识
const isDev = import.meta.env.DEV;

// Mock 数据开关（可通过环境变量控制）
const useMockData = isDev && import.meta.env.VITE_USE_MOCK !== 'false';

export const ordersApi = {
  getOrders: async (params?: OrdersQueryParams) => {
    if (useMockData) {
      return Promise.resolve(getMockOrdersList(params));
    }
    return api.get<OrdersListResponse>('/orders', { params });
  },
  getOrder: (orderId: number) => api.get<OrderDetail>(`/orders/${orderId}`),
  createOrder: (payload: OrderCreatePayload) => api.post<OrderDetail>('/orders', payload),

  // 统计相关接口（开发环境使用 mock 数据）
  getStatistics: async () => {
    if (useMockData) {
      return Promise.resolve(mockOrderStatistics);
    }
    return api.get<OrderStatistics>('/orders/statistics');
  },

  getTrends: async (days: number) => {
    if (useMockData) {
      return Promise.resolve(mockOrderTrends);
    }
    return api.get<OrderTrend[]>(`/orders/trends?days=${days}`);
  },

  getStatusDistribution: async () => {
    if (useMockData) {
      return Promise.resolve(mockStatusDistribution);
    }
    return api.get<StatusDistribution[]>('/orders/status-distribution');
  },
};
