import type { InputJson } from '@/pages/submission/types';

export interface OrderListItem {
  id: number;
  orderNo: string;
  projectId: number;
  projectName?: string;
  simTypeIds: number[];
  remark?: string | null;
  foldTypeIds?: number[];
  status: number;
  progress: number;
  conditionSummary?: Record<string, string[]>;
  domainAccount?: string;
  baseDir?: string | null;
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

export interface OrderConditionItem {
  id: number;
  conditionId?: number;
  foldTypeId?: number;
  foldTypeName?: string;
  simTypeId?: number;
  simTypeName?: string;
  optIssueId?: number | null;
  optJobId?: number | null;
  algorithmType?: string | null;
  roundTotal?: number;
  outputCount?: number;
  solverId?: string | null;
  process?: number;
  status?: number;
}

export interface OrderDetail extends OrderListItem {
  originFile: OrderOriginFile;
  originFoldTypeId?: number | null;
  modelLevelId?: number;
  participantIds?: string[];
  remark?: string | null;
  optParam?: Record<string, unknown>;
  inputJson?: InputJson;
  workflowId?: number | null;
  curNodeId?: number | null;
  submitCheck?: Record<string, unknown> | null;
  clientMeta?: Record<string, unknown> | null;
  conditions?: OrderConditionItem[];
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
  simTypeIds?: number[];
  optParam?: Record<string, unknown>;
  inputJson?: InputJson;
  conditionSummary?: Record<string, string[]>;
  workflowId?: number | null;
  submitCheck?: Record<string, unknown> | null;
  clientMeta?: Record<string, unknown> | null;
  baseDir?: string | null;
}
