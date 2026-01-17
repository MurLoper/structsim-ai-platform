import { api } from './client';

// API版本前缀
const V1 = '/v1';

// 新的类型定义（匹配后端数据模型）
export interface SimType {
  id: number;
  name: string;
  code: string;
  category: string;
  defaultParamTplSetId: number;
  defaultCondOutSetId: number;
  defaultSolverId: number;
  supportAlgMask: number;
  nodeIcon: string;
  colorTag: string;
  valid: number;
  sort: number;
  remark: string;
}

export interface ParamDef {
  id: number;
  name: string;
  key: string;
  valType: number;
  unit: string;
  minVal: number;
  maxVal: number;
  precision: number;
  defaultVal: string;
  enumOptions: string[];
  required: number;
  valid: number;
  sort: number;
}

export interface ConditionDef {
  id: number;
  name: string;
  code: string;
  schema: Record<string, unknown>;
  valid: number;
  sort: number;
}

export interface OutputDef {
  id: number;
  name: string;
  code: string;
  valType: number;
  unit: string;
  valid: number;
  sort: number;
}

export interface Solver {
  id: number;
  name: string;
  code: string;
  version: string;
  cpuCoreMin: number;
  cpuCoreMax: number;
  cpuCoreDefault: number;
  memoryMin: number;
  memoryMax: number;
  memoryDefault: number;
  valid: number;
  sort: number;
}

export interface StatusDef {
  id: number;
  name: string;
  code: string;
  type: string;
  color: string;
  valid: number;
  sort: number;
}

export interface FoldType {
  id: number;
  name: string;
  code: string;
  angle: number;
  valid: number;
  sort: number;
}

export interface AutomationModule {
  id: number;
  name: string;
  code: string;
  category: string;
  version: string;
  timeoutSec: number;
  retryMax: number;
  retryBackoffSec: number;
  valid: number;
  sort: number;
}

export interface Workflow {
  id: number;
  name: string;
  code: string;
  type: string;
  nodes: unknown[];
  edges: unknown[];
  valid: number;
  sort: number;
}

export interface ParamTplSet {
  id: number;
  simTypeId: number;
  name: string;
  valid: number;
  sort: number;
}

export interface ParamTplItem {
  id: number;
  tplSetId: number;
  tplName: string;
  paramVals: Record<string, number>;
  valid: number;
  sort: number;
}

export interface CondOutSet {
  id: number;
  simTypeId: number;
  name: string;
  condItems: unknown[];
  outputIds: number[];
  valid: number;
  sort: number;
}

export interface BaseDataResponse {
  simTypes: SimType[];
  paramDefs: ParamDef[];
  conditionDefs: ConditionDef[];
  outputDefs: OutputDef[];
  solvers: Solver[];
  statusDefs: StatusDef[];
  foldTypes: FoldType[];
  automationModules: AutomationModule[];
}

export const configApi = {
  // ============ 仿真类型 CRUD ============
  getSimTypes: () => api.get<SimType[]>(`${V1}/config/sim-types`),

  createSimType: (data: Partial<SimType>) => api.post<SimType>(`${V1}/config/sim-types`, data),

  updateSimType: (id: number, data: Partial<SimType>) =>
    api.put<SimType>(`${V1}/config/sim-types/${id}`, data),

  deleteSimType: (id: number) => api.delete(`${V1}/config/sim-types/${id}`),

  // ============ 参数定义 CRUD ============
  getParamDefs: () => api.get<ParamDef[]>(`${V1}/config/param-defs`),

  createParamDef: (data: Partial<ParamDef>) => api.post<ParamDef>(`${V1}/config/param-defs`, data),

  updateParamDef: (id: number, data: Partial<ParamDef>) =>
    api.put<ParamDef>(`${V1}/config/param-defs/${id}`, data),

  deleteParamDef: (id: number) => api.delete(`${V1}/config/param-defs/${id}`),

  // ============ 求解器 CRUD ============
  getSolvers: () => api.get<Solver[]>(`${V1}/config/solvers`),

  createSolver: (data: Partial<Solver>) => api.post<Solver>(`${V1}/config/solvers`, data),

  updateSolver: (id: number, data: Partial<Solver>) =>
    api.put<Solver>(`${V1}/config/solvers/${id}`, data),

  deleteSolver: (id: number) => api.delete(`${V1}/config/solvers/${id}`),

  // ============ 工况定义 CRUD ============
  getConditionDefs: () => api.get<ConditionDef[]>(`${V1}/config/condition-defs`),

  createConditionDef: (data: Partial<ConditionDef>) =>
    api.post<ConditionDef>(`${V1}/config/condition-defs`, data),

  updateConditionDef: (id: number, data: Partial<ConditionDef>) =>
    api.put<ConditionDef>(`${V1}/config/condition-defs/${id}`, data),

  deleteConditionDef: (id: number) => api.delete(`${V1}/config/condition-defs/${id}`),

  // ============ 输出定义 CRUD ============
  getOutputDefs: () => api.get<OutputDef[]>(`${V1}/config/output-defs`),

  createOutputDef: (data: Partial<OutputDef>) =>
    api.post<OutputDef>(`${V1}/config/output-defs`, data),

  updateOutputDef: (id: number, data: Partial<OutputDef>) =>
    api.put<OutputDef>(`${V1}/config/output-defs/${id}`, data),

  deleteOutputDef: (id: number) => api.delete(`${V1}/config/output-defs/${id}`),

  // ============ 姿态类型 CRUD ============
  getFoldTypes: () => api.get<FoldType[]>(`${V1}/config/fold-types`),

  createFoldType: (data: Partial<FoldType>) => api.post<FoldType>(`${V1}/config/fold-types`, data),

  updateFoldType: (id: number, data: Partial<FoldType>) =>
    api.put<FoldType>(`${V1}/config/fold-types/${id}`, data),

  deleteFoldType: (id: number) => api.delete(`${V1}/config/fold-types/${id}`),

  // ============ 其他查询接口 ============
  getParamTplSets: (simTypeId?: number) =>
    api.get<ParamTplSet[]>(`${V1}/config/param-tpl-sets`, { params: { simTypeId } }),

  getParamTplItems: (tplSetId: number) =>
    api.get<ParamTplItem[]>(`${V1}/config/param-tpl-items`, { params: { tplSetId } }),

  getCondOutSets: (simTypeId?: number) =>
    api.get<CondOutSet[]>(`${V1}/config/cond-out-sets`, { params: { simTypeId } }),

  getWorkflows: (type?: string) =>
    api.get<Workflow[]>(`${V1}/config/workflows`, { params: { type } }),

  getStatusDefs: () => api.get<StatusDef[]>(`${V1}/config/status-defs`),

  getAutomationModules: (category?: string) =>
    api.get<AutomationModule[]>(`${V1}/config/automation-modules`, { params: { category } }),

  getBaseData: () => api.get<BaseDataResponse>(`${V1}/config/base-data`),
};
