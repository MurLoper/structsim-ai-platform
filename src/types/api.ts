/**
 * API 通用类型定义
 * 包含请求/响应结构、分页等通用类型
 */

// ============ 通用响应结构 ============

/** API 统一响应结构 */
export interface ApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
  trace_id?: string;
}

/** 分页响应结构 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** 分页查询参数 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// ============ 业务错误 ============

/** API 业务错误 */
export interface ApiError {
  code: number;
  message: string;
  data?: unknown;
  trace_id?: string;
}
