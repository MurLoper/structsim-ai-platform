import type { InputJson } from '@/pages/submission/types';

export interface OrderListItem {
  id: number;
  orderNo: string;
  projectId: number;
  projectName?: string;
  simTypeIds: number[];
  foldTypeIds?: number[];
  status: number;
  progress: number;
  /** 工况概览：姿态名 → 仿真类型名[] */
  conditionSummary?: Record<string, string[]>;
  createdBy: string;
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
  modelLevelId?: number;
  participantIds?: string[];
  remark?: string | null;
  /** @deprecated 使用 inputJson 替代 */
  optParam?: Record<string, unknown>;
  /** 提单完整数据（新版结构） */
  inputJson?: InputJson;
  workflowId?: number | null;
  curNodeId?: number | null;
  submitCheck?: Record<string, unknown> | null;
  clientMeta?: Record<string, unknown> | null;
}

export interface OrderCreatePayload {
  projectId: number;
  projectName?: string;
  modelLevelId?: number;
  originFile: OrderOriginFile;
  originFoldTypeId?: number | null;
  foldTypeIds?: number[];
  participantIds?: string[];
  remark?: string;
  simTypeIds: number[];
  /** @deprecated 使用 inputJson 替代 */
  optParam?: Record<string, unknown>;
  /** 提单完整数据（新版结构） */
  inputJson?: InputJson;
  /** 工况概览：姿态名 → 仿真类型名[]（冗余存储到 orders 表供列表展示） */
  conditionSummary?: Record<string, string[]>;
  workflowId?: number | null;
  submitCheck?: Record<string, unknown> | null;
  clientMeta?: Record<string, unknown> | null;
}
