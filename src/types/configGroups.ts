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

// ============ 工况输出组合相关类型 ============
export interface CondOutGroup {
  id: number;
  name: string;
  description?: string;
  sort: number;
  valid: number;
  createdAt: number;
  updatedAt: number;
}

export interface ConditionInGroup {
  id: number;
  condOutGroupId: number;
  conditionDefId: number;
  configData?: Record<string, any>;
  sort: number;
  createdAt: number;
  // 工况定义信息
  conditionName?: string;
  conditionCode?: string;
  conditionSchema?: Record<string, any>;
}

export interface OutputInGroup {
  id: number;
  condOutGroupId: number;
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

export interface SimTypeCondOutGroupRel {
  id: number;
  simTypeId: number;
  condOutGroupId: number;
  isDefault: number;
  sort: number;
  createdAt: number;
  condOutGroupName?: string;
  condOutGroupDescription?: string;
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
  configData?: Record<string, any>;
  conditionSchema?: Record<string, any>;
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

export interface CondOutGroupOption {
  condOutGroupId: number;
  condOutGroupName: string;
  isDefault: number;
  conditions: ConditionConfig[];
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
  defaultCondOutGroup?: CondOutGroupOption;
  defaultSolver?: SolverConfig;
  paramGroupOptions: ParamGroupOption[];
  condOutGroupOptions: CondOutGroupOption[];
  solverOptions: SolverOption[];
}
