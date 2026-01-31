import { api } from '../client';
import type {
  Project,
  SimType,
  ParamDef,
  ConditionDef,
  OutputDef,
  Solver,
  FoldType,
  CondOutSet,
  StatusDef,
  AutomationModule,
  Workflow,
  BaseDataResponse,
  WorkingCondition,
  FoldTypeSimTypeRel,
  SimTypeWithDefault,
  ConditionConfig,
} from '@/types';

// ============ 基础配置 CRUD API ============
export const baseConfigApi = {
  // 项目配置
  getProjects: () => api.get<Project[]>('/config/projects'),
  getProject: (id: number) => api.get<Project>(`/config/projects/${id}`),
  createProject: (data: Partial<Project>) => api.post<Project>('/config/projects', data),
  updateProject: (id: number, data: Partial<Project>) =>
    api.put<Project>(`/config/projects/${id}`, data),
  deleteProject: (id: number) => api.delete(`/config/projects/${id}`),

  // 仿真类型
  getSimTypes: () => api.get<SimType[]>('/config/sim-types'),
  createSimType: (data: Partial<SimType>) => api.post<SimType>('/config/sim-types', data),
  updateSimType: (id: number, data: Partial<SimType>) =>
    api.put<SimType>(`/config/sim-types/${id}`, data),
  deleteSimType: (id: number) => api.delete(`/config/sim-types/${id}`),

  // 参数定义
  getParamDefs: () => api.get<ParamDef[]>('/config/param-defs'),
  getParamDefsPaginated: (params: { page: number; pageSize?: number; keyword?: string }) =>
    api.get<{ items: ParamDef[]; total: number; page: number; pageSize: number }>(
      '/config/param-defs',
      { params }
    ),
  createParamDef: (data: Partial<ParamDef>) => api.post<ParamDef>('/config/param-defs', data),
  batchCreateParamDefs: (items: Partial<ParamDef>[]) =>
    api.post<{ created: ParamDef[]; skipped: Array<{ key: string; reason: string }> }>(
      '/config/param-defs/batch',
      { items }
    ),
  updateParamDef: (id: number, data: Partial<ParamDef>) =>
    api.put<ParamDef>(`/config/param-defs/${id}`, data),
  deleteParamDef: (id: number) => api.delete(`/config/param-defs/${id}`),

  // 求解器
  getSolvers: () => api.get<Solver[]>('/config/solvers'),
  createSolver: (data: Partial<Solver>) => api.post<Solver>('/config/solvers', data),
  updateSolver: (id: number, data: Partial<Solver>) =>
    api.put<Solver>(`/config/solvers/${id}`, data),
  deleteSolver: (id: number) => api.delete(`/config/solvers/${id}`),

  // 工况定义
  getConditionDefs: () => api.get<ConditionDef[]>('/config/condition-defs'),
  createConditionDef: (data: Partial<ConditionDef>) =>
    api.post<ConditionDef>('/config/condition-defs', data),
  updateConditionDef: (id: number, data: Partial<ConditionDef>) =>
    api.put<ConditionDef>(`/config/condition-defs/${id}`, data),
  deleteConditionDef: (id: number) => api.delete(`/config/condition-defs/${id}`),

  // 输出定义
  getOutputDefs: () => api.get<OutputDef[]>('/config/output-defs'),
  getOutputDefsPaginated: (params: { page: number; pageSize?: number; keyword?: string }) =>
    api.get<{ items: OutputDef[]; total: number; page: number; pageSize: number }>(
      '/config/output-defs',
      { params }
    ),
  createOutputDef: (data: Partial<OutputDef>) => api.post<OutputDef>('/config/output-defs', data),
  batchCreateOutputDefs: (items: Partial<OutputDef>[]) =>
    api.post<{ created: OutputDef[]; skipped: Array<{ code: string; reason: string }> }>(
      '/config/output-defs/batch',
      { items }
    ),
  updateOutputDef: (id: number, data: Partial<OutputDef>) =>
    api.put<OutputDef>(`/config/output-defs/${id}`, data),
  deleteOutputDef: (id: number) => api.delete(`/config/output-defs/${id}`),

  // 姿态类型
  getFoldTypes: () => api.get<FoldType[]>('/config/fold-types'),
  createFoldType: (data: Partial<FoldType>) => api.post<FoldType>('/config/fold-types', data),
  updateFoldType: (id: number, data: Partial<FoldType>) =>
    api.put<FoldType>(`/config/fold-types/${id}`, data),
  deleteFoldType: (id: number) => api.delete(`/config/fold-types/${id}`),

  // 输出组合（旧版兼容，推荐使用 outputGroupsApi）
  getOutputGroups: (simTypeId?: number) =>
    api.get<CondOutSet[]>('/config/output-groups', { params: { simTypeId } }),
  getStatusDefs: () => api.get<StatusDef[]>('/config/status-defs'),
  updateStatusDef: (id: number, data: Partial<StatusDef>) =>
    api.put<StatusDef>(`/config/status-defs/${id}`, data),
  getAutomationModules: () => api.get<AutomationModule[]>('/config/automation-modules'),
  getWorkflows: () => api.get<Workflow[]>('/config/workflows'),
  getBaseData: () => api.get<BaseDataResponse>('/config/base-data'),

  // 工况配置
  getWorkingConditions: () => api.get<WorkingCondition[]>('/config/working-conditions'),
  getWorkingConditionsByFoldType: (foldTypeId: number) =>
    api.get<WorkingCondition[]>(`/config/working-conditions/by-fold-type/${foldTypeId}`),
  getFoldTypeSimTypeRels: () => api.get<FoldTypeSimTypeRel[]>('/config/fold-type-sim-type-rels'),
  getSimTypesByFoldType: (foldTypeId: number) =>
    api.get<SimTypeWithDefault[]>(`/config/fold-type-sim-type-rels/by-fold-type/${foldTypeId}`),

  // 姿态-仿真类型关联管理
  getFoldTypeSimTypeRelsByFoldType: (foldTypeId: number) =>
    api.get<FoldTypeSimTypeRel[]>(`/config/fold-type-sim-type-rels/fold-type/${foldTypeId}/rels`),
  addSimTypeToFoldType: (foldTypeId: number, data: { simTypeId: number; isDefault?: number }) =>
    api.post<FoldTypeSimTypeRel>(`/config/fold-type-sim-type-rels/fold-type/${foldTypeId}`, data),
  setDefaultSimTypeForFoldType: (foldTypeId: number, simTypeId: number) =>
    api.put(`/config/fold-type-sim-type-rels/fold-type/${foldTypeId}/default/${simTypeId}`),
  removeSimTypeFromFoldType: (foldTypeId: number, simTypeId: number) =>
    api.delete(`/config/fold-type-sim-type-rels/fold-type/${foldTypeId}/sim-type/${simTypeId}`),

  // 工况配置（新版）
  getConditionConfigs: () => api.get<ConditionConfig[]>('/conditions'),
  getConditionConfig: (id: number) => api.get<ConditionConfig>(`/conditions/${id}`),
  getConditionByFoldSim: (foldTypeId: number, simTypeId: number) =>
    api.get<ConditionConfig>('/conditions/by-fold-sim', {
      params: { foldTypeId, simTypeId },
    }),
  getConditionsByFoldType: (foldTypeId: number) =>
    api.get<ConditionConfig[]>(`/conditions/by-fold-type/${foldTypeId}`),
  createConditionConfig: (data: Partial<ConditionConfig>) =>
    api.post<ConditionConfig>('/conditions', data),
  updateConditionConfig: (id: number, data: Partial<ConditionConfig>) =>
    api.put<ConditionConfig>(`/conditions/${id}`, data),
  deleteConditionConfig: (id: number) => api.delete(`/conditions/${id}`),
};
