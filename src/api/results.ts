/**
 * 结果分析 API 模块
 */
import { api } from './client';
import type { PaginatedResponse } from '@/types/api';

/** 旧链路：仿真类型结果 */
export interface SimTypeResult {
  id: number;
  orderId: number;
  simTypeId: number;
  simTypeName?: string;
  status: number;
  progress: number;
  totalRounds: number;
  completedRounds: number;
  failedRounds: number;
  bestExists?: number;
  bestRoundIndex?: number | null;
  createdAt?: number;
  updatedAt?: number;
}

/** 工况方案模块执行明细 */
export interface ModuleDetail {
  moduleCode: string;
  moduleName: string;
  statusText?: string;
  progress?: number;
  durationSec?: number | null;
  statusColor?: string;
}

export interface ResultOutputAttachment {
  imagePaths?: string[];
  aviPaths?: string[];
  curveJsonPath?: string | null;
  dataDir?: string | null;
  taskId?: number | string | null;
  optDataId?: number | string | null;
}

/** 轮次数据 */
export interface RoundItem {
  id: string | number;
  simTypeResultId: number;
  roundIndex: number;
  status: number;
  progress: number;
  paramValues?: Record<string, number | string> | null;
  outputResults?: Record<string, number | string> | null;
  outputAttachments?: Record<string, ResultOutputAttachment> | null;
  metrics?: Record<string, number> | null;
  flowCurNodeId?: number | null;
  flowNodeProgress?: Record<string, number> | null;
  stuckModuleId?: number | null;
  errorMsg?: string;
  startedAt?: number;
  finishedAt?: number;
  createdAt?: number;
  runningModule?: string;
  finalResult?: number | null;
  optDataId?: number | string | null;
  taskId?: number | string | null;
  dataDir?: string | null;
  baseDir?: string | null;
  jobDir?: string | null;
  moduleDetails?: ModuleDetail[];
}

/** 轮次查询参数 */
export interface RoundsQueryParams {
  page?: number;
  pageSize?: number;
  status?: number;
}

/** condition 级摘要 */
export interface OrderConditionSummary {
  id: number;
  orderId: number;
  orderNo?: string;
  caseId?: number | null;
  caseIndex?: number | null;
  optIssueId?: number | null;
  optJobId?: number | null;
  optConditionConfigId?: number | null;
  parameterScope?: 'global' | 'per_condition' | string | null;
  rotateDropFlag?: boolean;
  conditionId: number;
  foldTypeId?: number;
  foldTypeName?: string;
  simTypeId: number;
  simTypeName?: string;
  algorithmType?: string | null;
  roundTotal: number;
  outputCount: number;
  solverId?: string | null;
  careDeviceIds?: number[] | string[];
  remark?: string | null;
  runningModule?: string | null;
  process: number;
  status: number;
  canResubmit?: boolean;
  resultSource?: string;
  statistics?: Record<string, unknown> | null;
  resultSummary?: Record<string, unknown> | null;
  conditionSnapshot?: Record<string, unknown> | null;
  externalMeta?: Record<string, unknown> | null;
  createdAt?: number;
  updatedAt?: number;
}

export interface OrderConditionRoundColumn {
  key: string;
  label: string;
  type: string;
}

export interface OrderConditionRoundRawItem {
  id: string | number;
  caseConditionId?: number;
  optIssueId?: number | null;
  optJobId?: number | null;
  roundIndex: number;
  algorithmType?: string | null;
  status: number;
  params?: Record<string, number | string>;
  outputs?: Record<string, number | string>;
  outputAttachments?: Record<string, ResultOutputAttachment>;
  optDataId?: number | string | null;
  taskId?: number | string | null;
  dataDir?: string | null;
  baseDir?: string | null;
  jobDir?: string | null;
  runningModule?: string;
  process?: number;
  moduleDetails?: ModuleDetail[];
  finalResult?: number | null;
}

export interface OrderConditionRoundsResponse {
  orderCondition: OrderConditionSummary;
  resultSource?: string;
  algorithmType?: string | null;
  columns?: OrderConditionRoundColumn[];
  items: OrderConditionRoundRawItem[];
  statistics?: {
    totalRounds?: number;
    completedRounds?: number;
    failedRounds?: number;
    runningRounds?: number;
    progressPercent?: number;
  };
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
}

export interface OrderCaseResultCondition extends OrderConditionSummary {
  rounds: OrderConditionRoundsResponse;
}

export interface OrderCaseResult {
  id: number;
  orderId: number;
  orderNo?: string;
  caseIndex: number;
  caseName?: string | null;
  optIssueId?: number | null;
  optJobId?: number | null;
  parameterScope?: 'global' | 'per_condition' | string | null;
  status: number;
  process: number;
  statistics?: OrderConditionRoundsResponse['statistics'];
  conditions: OrderCaseResultCondition[];
}

export interface OrderCaseResultsResponse {
  orderId: number;
  cases: OrderCaseResult[];
  conditions: OrderConditionSummary[];
}

export const resultsApi = {
  /** 旧链路：获取订单的所有仿真类型结果 */
  getOrderSimTypeResults: (orderId: number) =>
    api.get<SimTypeResult[]>(`/results/order/${orderId}/sim-types`),

  /** 旧链路：获取单个仿真类型结果详情 */
  getSimTypeResult: (resultId: number) => api.get<SimTypeResult>(`/results/sim-type/${resultId}`),

  /** 旧链路：获取轮次列表（分页） */
  getRounds: (simTypeResultId: number, params?: RoundsQueryParams) =>
    api.get<PaginatedResponse<RoundItem>>(`/results/sim-type/${simTypeResultId}/rounds`, {
      params,
    }),

  /** 新链路：获取订单下所有工况方案摘要 */
  getOrderCaseResults: (orderId: number) =>
    api.get<OrderCaseResultsResponse>(`/results/order/${orderId}/cases`),
};
