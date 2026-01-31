// ============ 参数组合相关类型 ============
export interface ParamGroup {
  id: number;
  name: string;
  description?: string;
  sort: number;
  valid: number;
  createdAt: number;
  updatedAt: number;
}

export interface ParamInGroup {
  id: number;
  paramGroupId: number;
  paramDefId: number;
  defaultValue?: string;
  sort: number;
  createdAt: number;
  // 参数定义信息
  paramName?: string;
  paramKey?: string;
  unit?: string;
  valType?: number;
  required?: number;
}

// ============ 搜索和批量操作结果类型 ============
export interface SearchParamResult {
  paramDefId: number;
  paramKey: string;
  paramName: string;
  unit?: string;
  valType?: number;
  inGroup: boolean;
}

export interface SearchParamsResponse {
  params: SearchParamResult[];
  total: number;
  keyword: string;
}

export interface CheckParamExistsResponse {
  exists: boolean;
  matchBy?: 'key' | 'name';
  param?: {
    paramDefId: number;
    paramKey: string;
    paramName: string;
    unit?: string;
    valType?: number;
  };
}

export interface BatchOperationResult {
  addedCount?: number;
  skippedCount?: number;
  errorCount?: number;
  removedCount?: number;
  notFoundCount?: number;
  clearedCount?: number;
  added?: Array<{ paramDefId: number; paramKey: string }>;
  skipped?: Array<{ paramDefId: number; paramKey: string; reason: string }>;
  errors?: Array<{ index: number; paramDefId?: number; reason: string }>;
  removed?: number[];
  notFound?: number[];
}

export interface CreateAndAddParamResult {
  created: boolean;
  added: boolean;
  reason?: string;
  param: {
    paramDefId: number;
    paramKey: string;
    paramName: string;
    unit?: string;
    valType?: number;
  };
}

// ============ 输出组合相关类型 ============
export interface OutputGroup {
  id: number;
  name: string;
  description?: string;
  sort: number;
  valid: number;
  createdAt: number;
  updatedAt: number;
}

export interface OutputInGroup {
  id: number;
  outputGroupId: number;
  outputDefId: number;
  sort: number;
  createdAt: number;
  // 输出定义信息
  outputName?: string;
  outputCode?: string;
  unit?: string;
  valType?: number;
}

// ============ 配置关联关系类型 ============
export interface ProjectSimTypeRel {
  id: number;
  projectId: number;
  simTypeId: number;
  isDefault: number;
  sort: number;
  createdAt: number;
  simTypeName?: string;
  simTypeCode?: string;
}

export interface SimTypeParamGroupRel {
  id: number;
  simTypeId: number;
  paramGroupId: number;
  isDefault: number;
  sort: number;
  createdAt: number;
  paramGroupName?: string;
  paramGroupDescription?: string;
}

export interface SimTypeOutputGroupRel {
  id: number;
  simTypeId: number;
  outputGroupId: number;
  isDefault: number;
  sort: number;
  createdAt: number;
  outputGroupName?: string;
  outputGroupDescription?: string;
}

export interface SimTypeSolverRel {
  id: number;
  simTypeId: number;
  solverId: number;
  isDefault: number;
  sort: number;
  createdAt: number;
  solverName?: string;
  solverCode?: string;
  solverVersion?: string;
}

// ============ 提单初始化配置类型 ============
export interface ParamConfig {
  paramDefId: number;
  paramName: string;
  paramKey: string;
  defaultValue?: string;
  unit?: string;
  valType: number;
  required: number;
}

export interface ConditionConfig {
  conditionDefId: number;
  conditionName: string;
  conditionCode: string;
  configData?: Record<string, unknown>;
  conditionSchema?: Record<string, unknown>;
}

export interface OutputConfig {
  outputDefId: number;
  outputName: string;
  outputCode: string;
  unit?: string;
  valType: number;
}

export interface SolverConfig {
  solverId: number;
  solverName: string;
  solverCode: string;
  solverVersion?: string;
}

export interface ParamGroupOption {
  paramGroupId: number;
  paramGroupName: string;
  isDefault: number;
  params: ParamConfig[];
}

export interface OutputGroupOption {
  outputGroupId: number;
  outputGroupName: string;
  isDefault: number;
  outputs: OutputConfig[];
}

export interface SolverOption {
  solverId: number;
  solverName: string;
  solverCode: string;
  solverVersion?: string;
  isDefault: number;
}

export interface OrderInitConfig {
  projectId: number;
  projectName: string;
  simTypeId: number;
  simTypeName: string;
  simTypeCode: string;
  defaultParamGroup?: ParamGroupOption;
  defaultOutputGroup?: OutputGroupOption;
  defaultSolver?: SolverConfig;
  paramGroupOptions: ParamGroupOption[];
  outputGroupOptions: OutputGroupOption[];
  solverOptions: SolverOption[];
}
