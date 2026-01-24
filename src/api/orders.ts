import { api } from './client';
import type { OrdersListResponse, OrderDetail, OrderCreatePayload } from '@/types/order';
import {
  mockOrdersList,
  mockOrderStatistics,
  mockOrderTrends,
  mockStatusDistribution,
} from './mocks/orders.mock';

export interface OrdersQueryParams {
  page?: number;
  pageSize?: number;
  status?: number;
  projectId?: number;
}

export interface OrderStatistics {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
}

export interface OrderTrend {
  date: string;
  count: number;
}

export interface StatusDistribution {
  status: number;
  statusName: string;
  count: number;
  percentage: number;
}

// 开发环境标识
const isDev = import.meta.env.DEV;

// Mock 数据开关（可通过环境变量控制）
const useMockData = isDev && import.meta.env.VITE_USE_MOCK !== 'false';

export const ordersApi = {
  getOrders: async (params?: OrdersQueryParams) => {
    if (useMockData) {
      console.log('[Mock] 使用 mock 数据: orders list');
      return Promise.resolve({ data: mockOrdersList });
    }
    return api.get<OrdersListResponse>('/orders', { params });
  },
  getOrder: (orderId: number) => api.get<OrderDetail>(`/orders/${orderId}`),
  createOrder: (payload: OrderCreatePayload) => api.post<OrderDetail>('/orders', payload),

  // 统计相关接口（开发环境使用 mock 数据）
  getStatistics: async () => {
    if (useMockData) {
      console.log('[Mock] 使用 mock 数据: orders/statistics');
      return Promise.resolve(mockOrderStatistics);
    }
    return api.get<OrderStatistics>('/orders/statistics');
  },

  getTrends: async (days: number) => {
    if (useMockData) {
      console.log('[Mock] 使用 mock 数据: orders/trends');
      return Promise.resolve(mockOrderTrends);
    }
    return api.get<OrderTrend[]>(`/orders/trends?days=${days}`);
  },

  getStatusDistribution: async () => {
    if (useMockData) {
      console.log('[Mock] 使用 mock 数据: orders/status-distribution');
      return Promise.resolve(mockStatusDistribution);
    }
    return api.get<StatusDistribution[]>('/orders/status-distribution');
  },
};
