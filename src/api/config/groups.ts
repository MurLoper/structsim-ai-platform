import { api } from '../client';
import type { SearchParamsResponse, CreateAndAddParamResult } from '@/types/configGroups';

export const paramGroupsApi = {
  getParamGroups: (filters?: { projectId?: number; valid?: number }) =>
    api.get('/config/param-groups', { params: filters }),
  getParamGroup: (id: number) => api.get(`/config/param-groups/${id}`),
  createParamGroup: (data: {
    name: string;
    description?: string;
    projectIds?: number[];
    algType?: number;
    doeFileName?: string;
    doeFileHeads?: string[];
    doeFileData?: Array<Record<string, number | string>>;
    sort?: number;
  }) => api.post('/config/param-groups', data),
  updateParamGroup: (
    id: number,
    data: {
      name?: string;
      description?: string;
      projectIds?: number[];
      algType?: number;
      doeFileName?: string;
      doeFileHeads?: string[];
      doeFileData?: Array<Record<string, number | string>>;
      sort?: number;
    }
  ) => api.put(`/config/param-groups/${id}`, data),
  deleteParamGroup: (id: number) => api.delete(`/config/param-groups/${id}`),
  getParamGroupParams: (id: number) => api.get(`/config/param-groups/${id}/params`),
  getParamGroupDoeDownloadUrl: (id: number) =>
    `${import.meta.env.VITE_API_URL || '/api/v1'}/config/param-groups/${id}/doe-file/download`,
  getParamGroupDoeTemplateDownloadUrl: () =>
    `${import.meta.env.VITE_API_URL || '/api/v1'}/config/param-groups/doe-template/download`,
  addParamToGroup: (
    id: number,
    data: {
      paramDefId: number;
      defaultValue?: string;
      minVal?: number | null;
      maxVal?: number | null;
      enumValues?: string;
      sort?: number;
    }
  ) => api.post(`/config/param-groups/${id}/params`, data),
  removeParamFromGroup: (groupId: number, paramId: number) =>
    api.delete(`/config/param-groups/${groupId}/params/${paramId}`),
  clearGroupParams: (groupId: number) => api.delete(`/config/param-groups/${groupId}/params/clear`),
  batchAddParams: (
    groupId: number,
    params: Array<{
      paramDefId: number;
      defaultValue?: string;
      minVal?: number | null;
      maxVal?: number | null;
      enumValues?: string;
      sort?: number;
    }>
  ) => api.post(`/config/param-groups/${groupId}/params/batch`, { params }),
  batchRemoveParams: (groupId: number, paramDefIds: number[]) =>
    api.delete(`/config/param-groups/${groupId}/params/batch`, { data: { paramDefIds } }),
  replaceGroupParams: (
    groupId: number,
    params: Array<{
      paramDefId: number;
      defaultValue?: string;
      minVal?: number | null;
      maxVal?: number | null;
      enumValues?: string;
      sort?: number;
    }>
  ) => api.put(`/config/param-groups/${groupId}/params/replace`, { params }),
  searchParams: (keyword: string, groupId?: number) =>
    api.get<SearchParamsResponse>('/config/param-groups/search-params', {
      params: { keyword, groupId },
    }),
  checkParamExists: (key?: string, name?: string) =>
    api.get('/config/param-groups/check-param', { params: { key, name } }),
  createAndAddParam: (
    groupId: number,
    data: {
      key: string;
      name?: string;
      unit?: string;
      valType?: number;
      defaultValue?: string;
    }
  ) =>
    api.post<CreateAndAddParamResult>(
      `/config/param-groups/${groupId}/params/create-and-add`,
      data
    ),
};

export const outputGroupsApi = {
  getOutputGroups: (filters?: { projectId?: number; algType?: number; valid?: number }) =>
    api.get('/config/output-groups', { params: filters }),
  getOutputGroup: (id: number) => api.get(`/config/output-groups/${id}`),
  createOutputGroup: (data: {
    name: string;
    description?: string;
    projectId?: number | null;
    algType?: number;
    sort?: number;
  }) => api.post('/config/output-groups', data),
  updateOutputGroup: (
    id: number,
    data: {
      name?: string;
      description?: string;
      projectId?: number | null;
      algType?: number;
      sort?: number;
    }
  ) => api.put(`/config/output-groups/${id}`, data),
  deleteOutputGroup: (id: number) => api.delete(`/config/output-groups/${id}`),
  getOutputGroupOutputs: (id: number) => api.get(`/config/output-groups/${id}/outputs`),
  addOutputToGroup: (
    id: number,
    data: {
      outputDefId: number;
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
      sort?: number;
    }
  ) => api.post(`/config/output-groups/${id}/outputs`, data),
  removeOutputFromGroup: (groupId: number, outputId: number) =>
    api.delete(`/config/output-groups/${groupId}/outputs/${outputId}`),
  clearGroupOutputs: (groupId: number) =>
    api.delete(`/config/output-groups/${groupId}/outputs/clear`),
  searchOutputs: (keyword: string, groupId?: number) =>
    api.get('/config/output-groups/search-outputs', { params: { keyword, groupId } }),
  createAndAddOutput: (
    groupId: number,
    data: { code: string; name?: string; unit?: string; dataType?: string }
  ) => api.post(`/config/output-groups/${groupId}/outputs/create-and-add`, data),
};

export const configRelationsApi = {
  getSimTypeParamGroups: (simTypeId: number) => api.get(`/sim-types/${simTypeId}/param-groups`),
  addParamGroupToSimType: (
    simTypeId: number,
    data: { paramGroupId: number; isDefault?: number; sort?: number }
  ) => api.post(`/sim-types/${simTypeId}/param-groups`, data),
  setDefaultParamGroup: (simTypeId: number, paramGroupId: number) =>
    api.put(`/sim-types/${simTypeId}/param-groups/${paramGroupId}/default`, {}),
  removeParamGroupFromSimType: (simTypeId: number, paramGroupId: number) =>
    api.delete(`/sim-types/${simTypeId}/param-groups/${paramGroupId}`),
  getSimTypeOutputGroups: (simTypeId: number) => api.get(`/sim-types/${simTypeId}/output-groups`),
  addOutputGroupToSimType: (
    simTypeId: number,
    data: { outputGroupId: number; isDefault?: number; sort?: number }
  ) => api.post(`/sim-types/${simTypeId}/output-groups`, data),
  setDefaultOutputGroup: (simTypeId: number, outputGroupId: number) =>
    api.put(`/sim-types/${simTypeId}/output-groups/${outputGroupId}/default`, {}),
  removeOutputGroupFromSimType: (simTypeId: number, outputGroupId: number) =>
    api.delete(`/sim-types/${simTypeId}/output-groups/${outputGroupId}`),
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

export const orderInitApi = {
  getOrderProjectInitConfig: <T>(projectId: number) =>
    api.get<T>('/orders/init-project-config', { params: { projectId } }),
};
