/**
 * Orders API Mock 数据
 * 用于开发环境，提供完整的统计数据和订单列表
 */

import type { OrderStatistics, OrderTrend, StatusDistribution } from '../orders';
import type { OrdersListResponse } from '@/types/order';

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
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now(),
    },
    {
      id: 1002,
      orderNo: 'ORD-2024-002',
      projectId: 1752,
      simTypeIds: [2],
      status: 2,
      progress: 100,
      createdBy: 10003,
      createdAt: Date.now() - 7200000,
      updatedAt: Date.now(),
    },
    {
      id: 1003,
      orderNo: 'ORD-2024-003',
      projectId: 1753,
      simTypeIds: [1, 2],
      status: 0,
      progress: 0,
      createdBy: 10004,
      createdAt: Date.now() - 10800000,
      updatedAt: Date.now(),
    },
    {
      id: 1004,
      orderNo: 'ORD-2024-004',
      projectId: 1754,
      simTypeIds: [3],
      status: 3,
      progress: 80,
      createdBy: 10005,
      createdAt: Date.now() - 14400000,
      updatedAt: Date.now(),
    },
    {
      id: 1005,
      orderNo: 'ORD-2024-005',
      projectId: 1755,
      simTypeIds: [4],
      status: 2,
      progress: 100,
      createdBy: 10006,
      createdAt: Date.now() - 18000000,
      updatedAt: Date.now(),
    },
    {
      id: 1006,
      orderNo: 'ORD-2024-006',
      projectId: 1756,
      simTypeIds: [5],
      status: 1,
      progress: 60,
      createdBy: 10007,
      createdAt: Date.now() - 21600000,
      updatedAt: Date.now(),
      createdBy: 10006,
      creatorName: 'sunqi',
    },
    {
      id: 1007,
      projectId: 1752,
      projectName: '折叠屏平板',
      simTypeId: 1,
      simTypeName: '跌落',
      status: 2,
      createdAt: Date.now() - 25200000,
      updatedAt: Date.now(),
      createdBy: 10007,
      creatorName: 'zhouba',
    },
    {
      id: 1008,
      projectId: 1756,
      projectName: 'VR头显',
      simTypeId: 2,
      simTypeName: '落球',
      status: 0,
      createdAt: Date.now() - 28800000,
      updatedAt: Date.now(),
      createdBy: 10008,
      creatorName: 'wujiu',
    },
    {
      id: 1009,
      projectId: 1757,
      projectName: '智能音箱',
      simTypeId: 3,
      simTypeName: '振动',
      status: 1,
      createdAt: Date.now() - 32400000,
      updatedAt: Date.now(),
      createdBy: 10009,
      creatorName: 'zhengshi',
    },
    {
      id: 1010,
      projectId: 1758,
      projectName: '车载显示屏',
      simTypeId: 1,
      simTypeName: '跌落',
      status: 2,
      createdAt: Date.now() - 36000000,
      updatedAt: Date.now(),
      createdBy: 10010,
      creatorName: 'test_user1',
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
