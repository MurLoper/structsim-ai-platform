/**
 * 结果分析 API 模块
 */
import { api } from './client';
import type { PaginatedResponse } from '@/types/api';

/** 仿真类型结果 */
export interface SimTypeResult {
  id: number;
  orderId: number;
  simTypeId: number;
  simTypeName?: string;
  status: number;
  progress: number;
  totalRounds: number;
  completedRounds: number;
  failedRounds: number;
  createdAt?: number;
  updatedAt?: number;
}

/** 轮次数据 */
export interface RoundItem {
  id: number;
  simTypeResultId: number;
  roundIndex: number;
  status: number;
  progress: number;
  paramValues?: Record<string, number | string> | null;
  outputResults?: Record<string, number | string> | null;
  metrics?: Record<string, number> | null;
  errorMsg?: string;
  startedAt?: number;
  finishedAt?: number;
  createdAt?: number;
}

/** 轮次查询参数 */
export interface RoundsQueryParams {
  page?: number;
  pageSize?: number;
  status?: number;
}

export const resultsApi = {
  /** 获取订单的所有仿真类型结果 */
  getOrderSimTypeResults: (orderId: number) =>
    api.get<SimTypeResult[]>(`/results/order/${orderId}/sim-types`),

  /** 获取单个仿真类型结果详情 */
  getSimTypeResult: (resultId: number) => api.get<SimTypeResult>(`/results/sim-type/${resultId}`),

  /** 获取轮次列表（分页） */
  getRounds: (simTypeResultId: number, params?: RoundsQueryParams) =>
    api.get<PaginatedResponse<RoundItem>>(`/results/sim-type/${simTypeResultId}/rounds`, {
      params,
    }),
};
