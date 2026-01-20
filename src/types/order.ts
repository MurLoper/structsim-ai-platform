export interface OrderListItem {
  id: number;
  orderNo: string;
  projectId: number;
  simTypeIds: number[];
  status: number;
  progress: number;
  createdBy: number;
  createdAt: number;
  updatedAt: number;
}

export interface OrdersListResponse {
  items: OrderListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
