import type { OrderListItem, OrdersListResponse } from '@/types/order';

type RawOrderListItem = OrderListItem & {
  order_no?: string;
  project_id?: number;
  sim_type_ids?: number[];
  fold_type_ids?: number[];
  condition_summary?: Record<string, string[]>;
  domain_account?: string;
  base_dir?: string | null;
  created_by?: string;
  created_at?: number;
  updated_at?: number;
};

type RawOrdersListResponse = OrdersListResponse & {
  page_size?: number;
  total_pages?: number;
  items: RawOrderListItem[];
};

export const normalizeOrderListItem = (order: RawOrderListItem): OrderListItem => ({
  ...order,
  orderNo: order.orderNo || order.order_no || '',
  projectId: order.projectId ?? order.project_id ?? 0,
  simTypeIds: order.simTypeIds || order.sim_type_ids || [],
  foldTypeIds: order.foldTypeIds || order.fold_type_ids || [],
  conditionSummary: order.conditionSummary || order.condition_summary,
  domainAccount: order.domainAccount || order.domain_account,
  baseDir: order.baseDir ?? order.base_dir ?? null,
  createdBy: order.createdBy || order.created_by || '',
  createdAt: order.createdAt ?? order.created_at ?? 0,
  updatedAt: order.updatedAt ?? order.updated_at ?? 0,
});

export const normalizeOrdersListResponse = (
  response: RawOrdersListResponse
): OrdersListResponse => ({
  ...response,
  items: Array.isArray(response.items) ? response.items.map(normalizeOrderListItem) : [],
  pageSize: response.pageSize ?? response.page_size ?? 20,
  totalPages: response.totalPages ?? response.total_pages ?? 0,
});
