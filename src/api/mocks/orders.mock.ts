/**
 * Orders API Mock 数据
 * 用于开发环境，提供完整的统计数据和订单列表
 */

import type { OrderStatistics, OrderTrend, StatusDistribution } from '@/types/statistics';
import type { OrdersListResponse } from '@/types/order';

// 当前时间戳（秒级，与后端保持一致）
const now = Math.floor(Date.now() / 1000);

/**
 * 订单列表 Mock 数据
 */
export const mockOrdersList: OrdersListResponse = {
  items: [
    {
      id: 1001,
      orderNo: 'ORD-2024-001',
      projectId: 1751,
      simTypeIds: [1],
      status: 1,
      progress: 45,
      createdBy: 10002,
      createdAt: now - 3600,
      updatedAt: now,
    },
    {
      id: 1002,
      orderNo: 'ORD-2024-002',
      projectId: 1752,
      simTypeIds: [2],
      status: 2,
      progress: 100,
      createdBy: 10003,
      createdAt: now - 7200,
      updatedAt: now,
    },
    {
      id: 1003,
      orderNo: 'ORD-2024-003',
      projectId: 1753,
      simTypeIds: [1, 2],
      status: 0,
      progress: 0,
      createdBy: 10004,
      createdAt: now - 10800,
      updatedAt: now,
    },
    {
      id: 1004,
      orderNo: 'ORD-2024-004',
      projectId: 1754,
      simTypeIds: [3],
      status: 3,
      progress: 80,
      createdBy: 10005,
      createdAt: now - 14400,
      updatedAt: now,
    },
    {
      id: 1005,
      orderNo: 'ORD-2024-005',
      projectId: 1755,
      simTypeIds: [4],
      status: 2,
      progress: 100,
      createdBy: 10006,
      createdAt: now - 18000,
      updatedAt: now,
    },
    {
      id: 1006,
      orderNo: 'ORD-2024-006',
      projectId: 1756,
      simTypeIds: [5],
      status: 1,
      progress: 60,
      createdBy: 10006,
      createdAt: now - 21600,
      updatedAt: now,
    },
    {
      id: 1007,
      orderNo: 'ORD-2024-007',
      projectId: 1752,
      simTypeIds: [1],
      status: 2,
      progress: 100,
      createdBy: 10007,
      createdAt: now - 25200,
      updatedAt: now,
    },
    {
      id: 1008,
      orderNo: 'ORD-2024-008',
      projectId: 1756,
      simTypeIds: [2],
      status: 0,
      progress: 0,
      createdBy: 10008,
      createdAt: now - 28800,
      updatedAt: now,
    },
    {
      id: 1009,
      orderNo: 'ORD-2024-009',
      projectId: 1757,
      simTypeIds: [3],
      status: 1,
      progress: 25,
      createdBy: 10009,
      createdAt: now - 32400,
      updatedAt: now,
    },
    {
      id: 1010,
      orderNo: 'ORD-2024-010',
      projectId: 1758,
      simTypeIds: [1],
      status: 2,
      progress: 100,
      createdBy: 10010,
      createdAt: now - 36000,
      updatedAt: now,
    },
  ],
  total: 156,
  page: 1,
  pageSize: 10,
  totalPages: 16,
};

/**
 * 订单统计 Mock 数据
 */
export const mockOrderStatistics: OrderStatistics = {
  total: 156,
  pending: 23,
  running: 45,
  completed: 78,
  failed: 10,
};

/**
 * 订单趋势 Mock 数据（近7天）
 */
export const mockOrderTrends: OrderTrend[] = [
  { date: '2024-01-18', count: 18 },
  { date: '2024-01-19', count: 22 },
  { date: '2024-01-20', count: 25 },
  { date: '2024-01-21', count: 19 },
  { date: '2024-01-22', count: 28 },
  { date: '2024-01-23', count: 31 },
  { date: '2024-01-24', count: 13 },
];

/**
 * 状态分布 Mock 数据
 */
export const mockStatusDistribution: StatusDistribution[] = [
  {
    status: 0,
    statusName: '待处理',
    count: 23,
    percentage: 14.7,
  },
  {
    status: 1,
    statusName: '进行中',
    count: 45,
    percentage: 28.8,
  },
  {
    status: 2,
    statusName: '已完成',
    count: 78,
    percentage: 50.0,
  },
  {
    status: 3,
    statusName: '失败',
    count: 10,
    percentage: 6.4,
  },
];
