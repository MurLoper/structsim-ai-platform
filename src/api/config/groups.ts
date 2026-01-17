import { api } from '../client';

// ============ 参数组合管理 API ============
export const paramGroupsApi = {
  getParamGroups: () => api.get('/param-groups'),

  getParamGroup: (id: number) => api.get(`/param-groups/${id}`),

  createParamGroup: (data: { name: string; description?: string; sort?: number }) =>
    api.post('/param-groups', data),

  updateParamGroup: (id: number, data: { name?: string; description?: string; sort?: number }) =>
    api.put(`/param-groups/${id}`, data),

  deleteParamGroup: (id: number) => api.delete(`/param-groups/${id}`),

  getParamGroupParams: (id: number) => api.get(`/param-groups/${id}/params`),

  addParamToGroup: (
    id: number,
    data: { paramDefId: number; defaultValue?: string; sort?: number }
  ) => api.post(`/param-groups/${id}/params`, data),

  removeParamFromGroup: (groupId: number, paramId: number) =>
    api.delete(`/param-groups/${groupId}/params/${paramId}`),
};

// ============ 工况输出组合管理 API ============
export const condOutGroupsApi = {
  getCondOutGroups: () => api.get('/cond-out-groups'),

  getCondOutGroup: (id: number) => api.get(`/cond-out-groups/${id}`),

  createCondOutGroup: (data: { name: string; description?: string; sort?: number }) =>
    api.post('/cond-out-groups', data),

  updateCondOutGroup: (id: number, data: { name?: string; description?: string; sort?: number }) =>
    api.put(`/cond-out-groups/${id}`, data),

  deleteCondOutGroup: (id: number) => api.delete(`/cond-out-groups/${id}`),

  getCondOutGroupConditions: (id: number) => api.get(`/cond-out-groups/${id}/conditions`),

  addConditionToGroup: (
    id: number,
    data: { conditionDefId: number; configData?: Record<string, any>; sort?: number }
  ) => api.post(`/cond-out-groups/${id}/conditions`, data),

  removeConditionFromGroup: (groupId: number, condId: number) =>
    api.delete(`/cond-out-groups/${groupId}/conditions/${condId}`),

  getCondOutGroupOutputs: (id: number) => api.get(`/cond-out-groups/${id}/outputs`),

  addOutputToGroup: (id: number, data: { outputDefId: number; sort?: number }) =>
    api.post(`/cond-out-groups/${id}/outputs`, data),

  removeOutputFromGroup: (groupId: number, outputId: number) =>
    api.delete(`/cond-out-groups/${groupId}/outputs/${outputId}`),
};

// ============ 配置关联关系管理 API ============
export const configRelationsApi = {
  // 项目-仿真类型关联
  getProjectSimTypes: (projectId: number) => api.get(`/projects/${projectId}/sim-types`),

  addSimTypeToProject: (
    projectId: number,
    data: { simTypeId: number; isDefault?: number; sort?: number }
  ) => api.post(`/projects/${projectId}/sim-types`, data),

  setDefaultSimType: (projectId: number, simTypeId: number) =>
    api.put(`/projects/${projectId}/sim-types/${simTypeId}/default`, {}),

  removeSimTypeFromProject: (projectId: number, simTypeId: number) =>
    api.delete(`/projects/${projectId}/sim-types/${simTypeId}`),

  // 仿真类型-参数组合关联
  getSimTypeParamGroups: (simTypeId: number) => api.get(`/sim-types/${simTypeId}/param-groups`),

  addParamGroupToSimType: (
    simTypeId: number,
    data: { paramGroupId: number; isDefault?: number; sort?: number }
  ) => api.post(`/sim-types/${simTypeId}/param-groups`, data),

  setDefaultParamGroup: (simTypeId: number, paramGroupId: number) =>
    api.put(`/sim-types/${simTypeId}/param-groups/${paramGroupId}/default`, {}),

  removeParamGroupFromSimType: (simTypeId: number, paramGroupId: number) =>
    api.delete(`/sim-types/${simTypeId}/param-groups/${paramGroupId}`),

  // 仿真类型-工况输出组合关联
  getSimTypeCondOutGroups: (simTypeId: number) =>
    api.get(`/sim-types/${simTypeId}/cond-out-groups`),

  addCondOutGroupToSimType: (
    simTypeId: number,
    data: { condOutGroupId: number; isDefault?: number; sort?: number }
  ) => api.post(`/sim-types/${simTypeId}/cond-out-groups`, data),

  setDefaultCondOutGroup: (simTypeId: number, condOutGroupId: number) =>
    api.put(`/sim-types/${simTypeId}/cond-out-groups/${condOutGroupId}/default`, {}),

  removeCondOutGroupFromSimType: (simTypeId: number, condOutGroupId: number) =>
    api.delete(`/sim-types/${simTypeId}/cond-out-groups/${condOutGroupId}`),

  // 仿真类型-求解器关联
  getSimTypeSolvers: (simTypeId: number) => api.get(`/sim-types/${simTypeId}/solvers`),

  addSolverToSimType: (
    simTypeId: number,
    data: { solverId: number; isDefault?: number; sort?: number }
  ) => api.post(`/sim-types/${simTypeId}/solvers`, data),

  setDefaultSolver: (simTypeId: number, solverId: number) =>
    api.put(`/sim-types/${simTypeId}/solvers/${solverId}/default`, {}),

  removeSolverFromSimType: (simTypeId: number, solverId: number) =>
    api.delete(`/sim-types/${simTypeId}/solvers/${solverId}`),
};

// ============ 提单初始化 API ============
export const orderInitApi = {
  getOrderInitConfig: (projectId: number, simTypeId?: number) =>
    api.get('/orders/init-config', { params: { projectId, simTypeId } }),
};
