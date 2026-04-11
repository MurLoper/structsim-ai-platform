import { api } from '../client';
import type {
  Project,
  SimType,
  ParamDef,
  ConditionDef,
  OutputDef,
  PostProcessMode,
  Solver,
  FoldType,
  OutputSet,
  StatusDef,
  AutomationModule,
  Workflow,
  BaseDataResponse,
  WorkingCondition,
  FoldTypeSimTypeRel,
  SimTypeWithDefault,
  ConditionConfig,
  CareDevice,
} from '@/types';

// ============ 鍩虹閰嶇疆 CRUD API ============
export const baseConfigApi = {
  getProjects: () => api.get<Project[]>('/config/projects'),
  getProject: (id: number) => api.get<Project>(`/config/projects/${id}`),
  createProject: (data: Partial<Project>) => api.post<Project>('/config/projects', data),
  updateProject: (id: number, data: Partial<Project>) =>
    api.put<Project>(`/config/projects/${id}`, data),
  deleteProject: (id: number) => api.delete(`/config/projects/${id}`),

  getSimTypes: () => api.get<SimType[]>('/config/sim-types'),
  createSimType: (data: Partial<SimType>) => api.post<SimType>('/config/sim-types', data),
  updateSimType: (id: number, data: Partial<SimType>) =>
    api.put<SimType>(`/config/sim-types/${id}`, data),
  deleteSimType: (id: number) => api.delete(`/config/sim-types/${id}`),

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

  getSolvers: () => api.get<Solver[]>('/config/solvers'),
  createSolver: (data: Partial<Solver>) => api.post<Solver>('/config/solvers', data),
  updateSolver: (id: number, data: Partial<Solver>) =>
    api.put<Solver>(`/config/solvers/${id}`, data),
  deleteSolver: (id: number) => api.delete(`/config/solvers/${id}`),

  getConditionDefs: () => api.get<ConditionDef[]>('/config/condition-defs'),
  createConditionDef: (data: Partial<ConditionDef>) =>
    api.post<ConditionDef>('/config/condition-defs', data),
  updateConditionDef: (id: number, data: Partial<ConditionDef>) =>
    api.put<ConditionDef>(`/config/condition-defs/${id}`, data),
  deleteConditionDef: (id: number) => api.delete(`/config/condition-defs/${id}`),

  getOutputDefs: () => api.get<OutputDef[]>('/config/output-defs'),
  getPostProcessModes: () => api.get<PostProcessMode[]>('/config/post-process-modes'),
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

  getFoldTypes: () => api.get<FoldType[]>('/config/fold-types'),
  createFoldType: (data: Partial<FoldType>) => api.post<FoldType>('/config/fold-types', data),
  updateFoldType: (id: number, data: Partial<FoldType>) =>
    api.put<FoldType>(`/config/fold-types/${id}`, data),
  deleteFoldType: (id: number) => api.delete(`/config/fold-types/${id}`),

  getCareDevices: () => api.get<CareDevice[]>('/config/care-devices'),
  createCareDevice: (data: Partial<CareDevice>) =>
    api.post<CareDevice>('/config/care-devices', data),
  updateCareDevice: (id: number, data: Partial<CareDevice>) =>
    api.put<CareDevice>(`/config/care-devices/${id}`, data),
  deleteCareDevice: (id: number) => api.delete(`/config/care-devices/${id}`),

  getOutputGroups: (simTypeId?: number) =>
    api.get<OutputSet[]>('/config/output-groups', { params: { simTypeId } }),
  getStatusDefs: () => api.get<StatusDef[]>('/config/status-defs'),
  updateStatusDef: (id: number, data: Partial<StatusDef>) =>
    api.put<StatusDef>(`/config/status-defs/${id}`, data),
  getAutomationModules: () => api.get<AutomationModule[]>('/config/automation-modules'),
  getWorkflows: () => api.get<Workflow[]>('/config/workflows'),
  getBaseData: () => api.get<BaseDataResponse>('/config/base-data'),

  getWorkingConditions: () => api.get<WorkingCondition[]>('/config/working-conditions'),
  getWorkingConditionsByFoldType: (foldTypeId: number) =>
    api.get<WorkingCondition[]>(`/config/working-conditions/by-fold-type/${foldTypeId}`),
  getFoldTypeSimTypeRels: () => api.get<FoldTypeSimTypeRel[]>('/config/fold-type-sim-type-rels'),
  getSimTypesByFoldType: (foldTypeId: number) =>
    api.get<SimTypeWithDefault[]>(`/config/fold-type-sim-type-rels/by-fold-type/${foldTypeId}`),

  getFoldTypeSimTypeRelsByFoldType: (foldTypeId: number) =>
    api.get<FoldTypeSimTypeRel[]>(`/config/fold-type-sim-type-rels/fold-type/${foldTypeId}/rels`),
  addSimTypeToFoldType: (foldTypeId: number, data: { simTypeId: number; isDefault?: number }) =>
    api.post<FoldTypeSimTypeRel>(`/config/fold-type-sim-type-rels/fold-type/${foldTypeId}`, data),
  setDefaultSimTypeForFoldType: (foldTypeId: number, simTypeId: number) =>
    api.put(`/config/fold-type-sim-type-rels/fold-type/${foldTypeId}/default/${simTypeId}`),
  removeSimTypeFromFoldType: (foldTypeId: number, simTypeId: number) =>
    api.delete(`/config/fold-type-sim-type-rels/fold-type/${foldTypeId}/sim-type/${simTypeId}`),

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
