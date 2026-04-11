import type { User } from './user';

// ============ 参数组合相关类型 ============
export interface ParamGroup {
  id: number;
  name: string;
  description?: string;
  projectIds?: number[];
  algType?: number;
  doeFileName?: string;
  doeFileHeads?: string[];
  doeFileData?: Array<Record<string, number | string>>;
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
  minVal?: number | null;
  maxVal?: number | null;
  enumValues?: string; // DOE专属枚举值（逗号分隔，如 "0,15,30,45,60,75,90"）
  sort: number;
  createdAt: number;
  // 参数定义信息
  paramName?: string;
  paramKey?: string;
  unit?: string;
  valType?: number;
  required?: number;
  // 参数定义的原始上下限（供参考）
  defMinVal?: number | null;
  defMaxVal?: number | null;
  defDefaultVal?: string;
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
  projectIds?: number[];
  sort: number;
  valid: number;
  createdAt: number;
  updatedAt: number;
}

export interface OutputInGroup {
  id: number;
  outputGroupId: number;
  outputDefId: number;
  // resp_details 预配置
  setName?: string;
  component?: string;
  stepName?: string;
  sectionPoint?: string;
  specialOutputSet?: string;
  description?: string;
  weight?: number;
  multiple?: number;
  lowerLimit?: number;
  upperLimit?: number;
  targetType?: number;
  targetValue?: number;
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

/** 提单初始化工况配置（区别于 config.ts 中的 ConditionConfig） */
export interface InitConditionConfig {
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

export interface PhaseOption {
  phaseId: number;
  phaseName: string;
}

export interface ResourcePoolOption {
  id: number;
  name: string;
}

export interface ParticipantCandidate extends User {
  isProjectFrequent?: boolean;
  projectFrequency?: number;
  isCurrentUser?: boolean;
}

export interface UserResourcePoolsPayload {
  resourcePools: ResourcePoolOption[];
  defaultResourceId?: number | null;
}

export interface OrderProjectInitConfig {
  projectId: number;
  projectName: string;
  phases: PhaseOption[];
  defaultPhaseId?: number | null;
  participantCandidates: ParticipantCandidate[];
}
