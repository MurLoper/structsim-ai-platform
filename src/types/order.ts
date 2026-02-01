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

export interface OrderOriginFile {
  type: number;
  name?: string;
  path?: string;
  fileId?: number | null;
}

export interface OrderDetail extends OrderListItem {
  originFile: OrderOriginFile;
  originFoldTypeId?: number | null;
  foldTypeIds?: number[];
  modelLevelId?: number;
  participantIds?: number[];
  remark?: string | null;
  optParam?: Record<string, unknown>;
  inputJson?: Record<string, unknown>;
  workflowId?: number | null;
  curNodeId?: number | null;
  submitCheck?: Record<string, unknown> | null;
  clientMeta?: Record<string, unknown> | null;
}

export interface OrderCreatePayload {
  projectId: number;
  modelLevelId?: number;
  originFile: OrderOriginFile;
  originFoldTypeId?: number | null;
  foldTypeIds?: number[];
  participantIds?: number[];
  remark?: string;
  simTypeIds: number[];
  optParam?: Record<string, unknown>;
  inputJson?: Record<string, unknown>;
  workflowId?: number | null;
  submitCheck?: Record<string, unknown> | null;
  clientMeta?: Record<string, unknown> | null;
}
