// Configuration types - 匹配后端新数据模型

// ============ 基础配置类型 ============

export interface Project {
  id: number;
  name: string;
  code?: string;
  defaultSimTypeId?: number;
  defaultSolverId?: number;
  valid: number;
  sort: number;
  remark?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SimType {
  id: number;
  name: string;
  code?: string;
  category?: string;
  defaultParamTplSetId?: number;
  defaultCondOutSetId?: number;
  defaultSolverId?: number;
  supportAlgMask: number;
  nodeIcon?: string;
  colorTag?: string;
  valid: number;
  sort: number;
  remark?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface ParamDef {
  id: number;
  name: string;
  key: string;
  valType: number; // 1=float,2=int,3=string,4=enum,5=bool
  unit?: string;
  minVal?: number;
  maxVal?: number;
  defaultVal?: string;
  precision: number;
  enumOptions?: Array<{ value: string | number; label: string }>;
  required: number;
  valid: number;
  sort: number;
  remark?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface Solver {
  id: number;
  name: string;
  code?: string;
  version?: string;
  cpuCoreMin: number;
  cpuCoreMax: number;
  cpuCoreDefault: number;
  memoryMin: number;
  memoryMax: number;
  memoryDefault: number;
  valid: number;
  sort: number;
  remark?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface ConditionDef {
  id: number;
  name: string;
  code?: string;
  category?: string;
  unit?: string;
  conditionSchema?: Record<string, unknown>;
  valid: number;
  sort: number;
  remark?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface OutputDef {
  id: number;
  name: string;
  code?: string;
  unit?: string;
  dataType: string;
  valid: number;
  sort: number;
  remark?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface FoldType {
  id: number;
  name: string;
  code?: string;
  angle: number;
  valid: number;
  sort: number;
  remark?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface ParamTplSet {
  id: number;
  name: string;
  simTypeId?: number;
  valid: number;
  sort: number;
  remark?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface ParamTplItem {
  id: number;
  tplSetId: number;
  paramDefId: number;
  defaultValue?: string;
  sort: number;
  createdAt?: number;
}

export interface CondOutSet {
  id: number;
  name: string;
  simTypeId?: number;
  valid: number;
  sort: number;
  remark?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface StatusDef {
  id: number;
  name: string;
  code: string;
  statusType: string;
  colorTag?: string;
  icon?: string;
  sort: number;
  remark?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface AutomationModule {
  id: number;
  name: string;
  code: string;
  moduleType: string;
  version?: string;
  sort: number;
  remark?: string;
}

export interface Workflow {
  id: number;
  name: string;
  type: string;
  nodes?: Array<{ id: string; type: string; data: Record<string, unknown> }>;
  valid: number;
  sort: number;
  remark?: string;
}

// ============ 基础数据响应 ============
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

// ============ 通用参数类型 ============

/** 通用参数定义（用于表单和配置） */
export interface Parameter {
  id: string;
  name: string;
  type: string;
  value?: string | number;
  min?: number;
  max?: number;
  options?: string[];
}
