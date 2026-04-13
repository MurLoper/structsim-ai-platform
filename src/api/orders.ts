import { api } from './client';
import type { OrdersListResponse, OrderDetail, OrderCreatePayload } from '@/types/order';
import type { OrderConditionSummary } from './results';
import type { UserResourcePoolsPayload } from '@/types/configGroups';
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
  domainAccount?: string;
  createdBy?: string;
  remark?: string;
  startDate?: number;
  endDate?: number;
}

export interface SubmitLimitsResponse {
  maxBatchSize: number;
  maxCpuCores: number;
  dailyRoundLimitDefault?: number;
  dailyRoundLimit: number;
  todayUsedRounds: number;
  todayRemainingRounds: number;
}

export interface ResubmitOrderConditionResponse {
  order: OrderDetail;
  condition: OrderConditionSummary;
}

// Mock 数据开关（可通过环境变量控制）
const useMockData = false; // 改为使用真实API

export const ordersApi = {
  getOrders: async (params?: OrdersQueryParams) => {
    if (useMockData) {
      return Promise.resolve(getMockOrdersList(params));
    }
    return api.get<OrdersListResponse>('/orders', { params });
  },
  getOrder: (orderId: number) => api.get<OrderDetail>(`/orders/${orderId}`),
  createOrder: (payload: OrderCreatePayload) => api.post<OrderDetail>('/orders', payload),
  updateOrder: (orderId: number, payload: Partial<OrderCreatePayload>) =>
    api.put<OrderDetail>(`/orders/${orderId}`, payload),
  resubmitCaseCondition: (caseConditionId: number) =>
    api.post<ResubmitOrderConditionResponse>(`/orders/case-conditions/${caseConditionId}/resubmit`),

  /** 验证源文件（路径/ID）并解析 INP set 集 */
  verifyFile: (path: string, type: number) =>
    api.post<{
      success: boolean;
      name?: string;
      path?: string;
      inpSets?: { type: string; name: string }[];
      error?: string;
    }>('/orders/verify-file', { path, type }),

  getSubmitLimits: () => api.get<SubmitLimitsResponse>('/orders/submit-limits'),
  getUserResourcePools: () => api.get<UserResourcePoolsPayload>('/orders/resource-pools'),

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
