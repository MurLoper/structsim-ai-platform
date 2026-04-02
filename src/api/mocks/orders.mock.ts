import type { OrderStatistics, OrderTrend, StatusDistribution } from '@/types/statistics';
import type { OrdersListResponse, OrderListItem } from '@/types/order';
import type { OrdersQueryParams } from '../orders';

const now = Math.floor(Date.now() / 1000);

const mockOrdersData: OrderListItem[] = [
  {
    id: 1001,
    orderNo: 'ORD-2024-001',
    projectId: 1751,
    simTypeIds: [1],
    remark: '电池包跌落首轮验证',
    domainAccount: 'z00010002',
    status: 1,
    progress: 45,
    createdBy: 'z00010002',
    createdAt: now - 3600,
    updatedAt: now,
  },
  {
    id: 1002,
    orderNo: 'ORD-2024-002',
    projectId: 1752,
    simTypeIds: [2],
    remark: '后壳 DOE 试验',
    domainAccount: 'z00010003',
    status: 2,
    progress: 100,
    createdBy: 'z00010003',
    createdAt: now - 7200,
    updatedAt: now,
  },
  {
    id: 1003,
    orderNo: 'ORD-2024-003',
    projectId: 1753,
    simTypeIds: [1, 2],
    remark: '材料替代对比',
    domainAccount: 'z00010004',
    status: 0,
    progress: 0,
    createdBy: 'z00010004',
    createdAt: now - 10800,
    updatedAt: now,
  },
  {
    id: 1004,
    orderNo: 'ORD-2024-004',
    projectId: 1754,
    simTypeIds: [3],
    remark: '冲击工况复核',
    domainAccount: 'z00010005',
    status: 3,
    progress: 80,
    createdBy: 'z00010005',
    createdAt: now - 14400,
    updatedAt: now,
  },
  {
    id: 1005,
    orderNo: 'ORD-2024-005',
    projectId: 1755,
    simTypeIds: [4],
    remark: '量产前收口',
    domainAccount: 'z00010006',
    status: 2,
    progress: 100,
    createdBy: 'z00010006',
    createdAt: now - 18000,
    updatedAt: now,
  },
  {
    id: 1006,
    orderNo: 'ORD-2024-006',
    projectId: 1756,
    simTypeIds: [5],
    remark: '热仿真批量提交',
    domainAccount: 'z00010006',
    status: 1,
    progress: 60,
    createdBy: 'z00010006',
    createdAt: now - 21600,
    updatedAt: now,
  },
  {
    id: 1007,
    orderNo: 'ORD-2024-007',
    projectId: 1752,
    simTypeIds: [1],
    remark: '结构回归验证',
    domainAccount: 'z00010007',
    status: 2,
    progress: 100,
    createdBy: 'z00010007',
    createdAt: now - 25200,
    updatedAt: now,
  },
  {
    id: 1008,
    orderNo: 'ORD-2024-008',
    projectId: 1756,
    simTypeIds: [2],
    remark: 'DOE 文件导入测试',
    domainAccount: 'z00010008',
    status: 0,
    progress: 0,
    createdBy: 'z00010008',
    createdAt: now - 28800,
    updatedAt: now,
  },
  {
    id: 1009,
    orderNo: 'ORD-2024-009',
    projectId: 1757,
    simTypeIds: [3],
    remark: '约束条件抽查',
    domainAccount: 'z00010009',
    status: 1,
    progress: 25,
    createdBy: 'z00010009',
    createdAt: now - 32400,
    updatedAt: now,
  },
  {
    id: 1010,
    orderNo: 'ORD-2024-010',
    projectId: 1758,
    simTypeIds: [1],
    remark: '交付前确认',
    domainAccount: 'z00010010',
    status: 2,
    progress: 100,
    createdBy: 'z00010010',
    createdAt: now - 36000,
    updatedAt: now,
  },
];

export function getMockOrdersList(params?: OrdersQueryParams): OrdersListResponse {
  const {
    page = 1,
    pageSize = 20,
    status,
    projectId,
    simTypeId,
    orderNo,
    domainAccount,
    remark,
  } = params || {};

  let filtered = [...mockOrdersData];

  if (status !== undefined) {
    filtered = filtered.filter(order => order.status === status);
  }
  if (projectId !== undefined) {
    filtered = filtered.filter(order => order.projectId === projectId);
  }
  if (simTypeId !== undefined) {
    filtered = filtered.filter(order => order.simTypeIds?.includes(simTypeId));
  }
  if (orderNo) {
    filtered = filtered.filter(order =>
      order.orderNo?.toLowerCase().includes(orderNo.toLowerCase())
    );
  }
  if (domainAccount) {
    filtered = filtered.filter(
      order =>
        (order.domainAccount || order.createdBy || '').toLowerCase() === domainAccount.toLowerCase()
    );
  }
  if (remark) {
    filtered = filtered.filter(order =>
      (order.remark || '').toLowerCase().includes(remark.toLowerCase())
    );
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return { items, total, page, pageSize, totalPages };
}

export const mockOrdersList: OrdersListResponse = getMockOrdersList();

export const mockOrderStatistics: OrderStatistics = {
  total: 156,
  pending: 23,
  running: 45,
  completed: 78,
  failed: 10,
};

export const mockOrderTrends: OrderTrend[] = [
  { date: '2024-01-18', count: 18 },
  { date: '2024-01-19', count: 22 },
  { date: '2024-01-20', count: 25 },
  { date: '2024-01-21', count: 19 },
  { date: '2024-01-22', count: 28 },
  { date: '2024-01-23', count: 31 },
  { date: '2024-01-24', count: 13 },
];

export const mockStatusDistribution: StatusDistribution[] = [
  { status: 0, statusName: '待处理', count: 23, percentage: 14.7 },
  { status: 1, statusName: '进行中', count: 45, percentage: 28.8 },
  { status: 2, statusName: '已完成', count: 78, percentage: 50.0 },
  { status: 3, statusName: '失败', count: 10, percentage: 6.4 },
];
