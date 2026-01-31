import { api } from '../client';

// ============ 参数组合管理 API ============
export const paramGroupsApi = {
  getParamGroups: () => api.get('/config/param-groups'),

  getParamGroup: (id: number) => api.get(`/config/param-groups/${id}`),

  createParamGroup: (data: { name: string; description?: string; sort?: number }) =>
    api.post('/config/param-groups', data),

  updateParamGroup: (id: number, data: { name?: string; description?: string; sort?: number }) =>
    api.put(`/config/param-groups/${id}`, data),

  deleteParamGroup: (id: number) => api.delete(`/config/param-groups/${id}`),

  getParamGroupParams: (id: number) => api.get(`/config/param-groups/${id}/params`),

  addParamToGroup: (
    id: number,
    data: { paramDefId: number; defaultValue?: string; sort?: number }
  ) => api.post(`/config/param-groups/${id}/params`, data),

  removeParamFromGroup: (groupId: number, paramId: number) =>
    api.delete(`/config/param-groups/${groupId}/params/${paramId}`),

  // 批量操作
  clearGroupParams: (groupId: number) => api.delete(`/config/param-groups/${groupId}/params/clear`),

  batchAddParams: (
    groupId: number,
    params: Array<{ paramDefId: number; defaultValue?: string; sort?: number }>
  ) => api.post(`/config/param-groups/${groupId}/params/batch`, { params }),

  batchRemoveParams: (groupId: number, paramDefIds: number[]) =>
    api.delete(`/config/param-groups/${groupId}/params/batch`, { data: { paramDefIds } }),

  replaceGroupParams: (
    groupId: number,
    params: Array<{ paramDefId: number; defaultValue?: string; sort?: number }>
  ) => api.put(`/config/param-groups/${groupId}/params/replace`, { params }),

  // 搜索参数
  searchParams: (keyword: string, groupId?: number) =>
    api.get('/config/param-groups/search-params', { params: { keyword, groupId } }),

  // 检查参数是否存在
  checkParamExists: (key?: string, name?: string) =>
    api.get('/config/param-groups/check-param', { params: { key, name } }),

  // 快速创建并添加参数
  createAndAddParam: (
    groupId: number,
    data: {
      key: string;
      name?: string;
      unit?: string;
      valType?: number;
      defaultValue?: string;
    }
  ) => api.post(`/config/param-groups/${groupId}/params/create-and-add`, data),
};

// ============ 输出组合管理 API ============
export const outputGroupsApi = {
  getOutputGroups: () => api.get('/config/output-groups'),

  getOutputGroup: (id: number) => api.get(`/config/output-groups/${id}`),

  createOutputGroup: (data: { name: string; description?: string; sort?: number }) =>
    api.post('/config/output-groups', data),

  updateOutputGroup: (id: number, data: { name?: string; description?: string; sort?: number }) =>
    api.put(`/config/output-groups/${id}`, data),

  deleteOutputGroup: (id: number) => api.delete(`/config/output-groups/${id}`),

  getOutputGroupOutputs: (id: number) => api.get(`/config/output-groups/${id}/outputs`),

  addOutputToGroup: (id: number, data: { outputDefId: number; sort?: number }) =>
    api.post(`/config/output-groups/${id}/outputs`, data),

  removeOutputFromGroup: (groupId: number, outputId: number) =>
    api.delete(`/config/output-groups/${groupId}/outputs/${outputId}`),

  // 批量操作
  clearGroupOutputs: (groupId: number) =>
    api.delete(`/config/output-groups/${groupId}/outputs/clear`),

  // 搜索输出
  searchOutputs: (keyword: string, groupId?: number) =>
    api.get('/config/output-groups/search-outputs', { params: { keyword, groupId } }),

  // 快速创建并添加输出
  createAndAddOutput: (
    groupId: number,
    data: { code: string; name?: string; unit?: string; dataType?: string }
  ) => api.post(`/config/output-groups/${groupId}/outputs/create-and-add`, data),
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

  // 仿真类型-输出组合关联
  getSimTypeOutputGroups: (simTypeId: number) => api.get(`/sim-types/${simTypeId}/output-groups`),

  addOutputGroupToSimType: (
    simTypeId: number,
    data: { outputGroupId: number; isDefault?: number; sort?: number }
  ) => api.post(`/sim-types/${simTypeId}/output-groups`, data),

  setDefaultOutputGroup: (simTypeId: number, outputGroupId: number) =>
    api.put(`/sim-types/${simTypeId}/output-groups/${outputGroupId}/default`, {}),

  removeOutputGroupFromSimType: (simTypeId: number, outputGroupId: number) =>
    api.delete(`/sim-types/${simTypeId}/output-groups/${outputGroupId}`),

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
