/**
 * 统计相关类型定义
 * 订单统计、趋势、分布等
 */

// ============ 订单统计 ============

/** 订单统计数据 */
export interface OrderStatistics {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
}

/** 订单趋势数据 */
export interface OrderTrend {
  date: string;
  count: number;
}

/** 状态分布数据 */
export interface StatusDistribution {
  status: number;
  statusName: string;
  count: number;
  percentage: number;
}
