import { useCallback } from 'react';
import {
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useCreateSimType,
  useUpdateSimType,
  useDeleteSimType,
  useCreateParamDef,
  useUpdateParamDef,
  useDeleteParamDef,
  useCreateSolver,
  useUpdateSolver,
  useDeleteSolver,
  useCreateConditionDef,
  useUpdateConditionDef,
  useDeleteConditionDef,
  useCreateOutputDef,
  useUpdateOutputDef,
  useDeleteOutputDef,
  useCreateFoldType,
  useUpdateFoldType,
  useDeleteFoldType,
  useCreateCareDevice,
  useUpdateCareDevice,
  useDeleteCareDevice,
  useCreateSolverResource,
  useUpdateSolverResource,
  useDeleteSolverResource,
} from '@/features/config/queries';
import type { ConfigurationModalType } from './configurationFormDefaults';

type EditingRecord = Record<string, unknown> | null;

const CREATE_SUCCESS_MESSAGES: Record<ConfigurationModalType, string> = {
  project: '项目创建成功',
  simType: '仿真类型创建成功',
  paramDef: '参数定义创建成功',
  solver: '求解器创建成功',
  solverResource: '资源池创建成功',
  conditionDef: '工况定义创建成功',
  outputDef: '输出定义创建成功',
  foldType: '姿态类型创建成功',
  careDevice: '关注器件创建成功',
};

const UPDATE_SUCCESS_MESSAGES: Record<ConfigurationModalType, string> = {
  project: '项目更新成功',
  simType: '仿真类型更新成功',
  paramDef: '参数定义更新成功',
  solver: '求解器更新成功',
  solverResource: '资源池更新成功',
  conditionDef: '工况定义更新成功',
  outputDef: '输出定义更新成功',
  foldType: '姿态类型更新成功',
  careDevice: '关注器件更新成功',
};

export const useConfigurationCrud = () => {
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const createSimType = useCreateSimType();
  const updateSimType = useUpdateSimType();
  const deleteSimType = useDeleteSimType();

  const createParamDef = useCreateParamDef();
  const updateParamDef = useUpdateParamDef();
  const deleteParamDef = useDeleteParamDef();

  const createSolver = useCreateSolver();
  const updateSolver = useUpdateSolver();
  const deleteSolver = useDeleteSolver();

  const createConditionDef = useCreateConditionDef();
  const updateConditionDef = useUpdateConditionDef();
  const deleteConditionDef = useDeleteConditionDef();

  const createOutputDef = useCreateOutputDef();
  const updateOutputDef = useUpdateOutputDef();
  const deleteOutputDef = useDeleteOutputDef();

  const createFoldType = useCreateFoldType();
  const updateFoldType = useUpdateFoldType();
  const deleteFoldType = useDeleteFoldType();

  const createCareDevice = useCreateCareDevice();
  const updateCareDevice = useUpdateCareDevice();
  const deleteCareDevice = useDeleteCareDevice();

  const createSolverResource = useCreateSolverResource();
  const updateSolverResource = useUpdateSolverResource();
  const deleteSolverResource = useDeleteSolverResource();

  const saveEntity = useCallback(
    async (
      modalType: ConfigurationModalType,
      editingItem: EditingRecord,
      data: Record<string, unknown>
    ) => {
      const entityId = editingItem?.id as number | undefined;

      switch (modalType) {
        case 'project':
          if (entityId) {
            await updateProject.mutateAsync({ id: entityId, data });
            return UPDATE_SUCCESS_MESSAGES.project;
          }
          await createProject.mutateAsync(data);
          return CREATE_SUCCESS_MESSAGES.project;
        case 'simType':
          if (entityId) {
            await updateSimType.mutateAsync({ id: entityId, data });
            return UPDATE_SUCCESS_MESSAGES.simType;
          }
          await createSimType.mutateAsync(data);
          return CREATE_SUCCESS_MESSAGES.simType;
        case 'paramDef':
          if (entityId) {
            await updateParamDef.mutateAsync({ id: entityId, data });
            return UPDATE_SUCCESS_MESSAGES.paramDef;
          }
          await createParamDef.mutateAsync(data);
          return CREATE_SUCCESS_MESSAGES.paramDef;
        case 'solver':
          if (entityId) {
            await updateSolver.mutateAsync({ id: entityId, data });
            return UPDATE_SUCCESS_MESSAGES.solver;
          }
          await createSolver.mutateAsync(data);
          return CREATE_SUCCESS_MESSAGES.solver;
        case 'conditionDef':
          if (entityId) {
            await updateConditionDef.mutateAsync({ id: entityId, data });
            return UPDATE_SUCCESS_MESSAGES.conditionDef;
          }
          await createConditionDef.mutateAsync(data);
          return CREATE_SUCCESS_MESSAGES.conditionDef;
        case 'outputDef':
          if (entityId) {
            await updateOutputDef.mutateAsync({ id: entityId, data });
            return UPDATE_SUCCESS_MESSAGES.outputDef;
          }
          await createOutputDef.mutateAsync(data);
          return CREATE_SUCCESS_MESSAGES.outputDef;
        case 'foldType':
          if (entityId) {
            await updateFoldType.mutateAsync({ id: entityId, data });
            return UPDATE_SUCCESS_MESSAGES.foldType;
          }
          await createFoldType.mutateAsync(data);
          return CREATE_SUCCESS_MESSAGES.foldType;
        case 'careDevice':
          if (entityId) {
            await updateCareDevice.mutateAsync({ id: entityId, data });
            return UPDATE_SUCCESS_MESSAGES.careDevice;
          }
          await createCareDevice.mutateAsync(data);
          return CREATE_SUCCESS_MESSAGES.careDevice;
        case 'solverResource':
          if (entityId) {
            await updateSolverResource.mutateAsync({ id: entityId, data });
            return UPDATE_SUCCESS_MESSAGES.solverResource;
          }
          await createSolverResource.mutateAsync(data);
          return CREATE_SUCCESS_MESSAGES.solverResource;
        default:
          return '';
      }
    },
    [
      createCareDevice,
      createConditionDef,
      createFoldType,
      createOutputDef,
      createParamDef,
      createProject,
      createSimType,
      createSolver,
      createSolverResource,
      updateCareDevice,
      updateConditionDef,
      updateFoldType,
      updateOutputDef,
      updateParamDef,
      updateProject,
      updateSimType,
      updateSolver,
      updateSolverResource,
    ]
  );

  const deleteEntity = useCallback(
    async (modalType: ConfigurationModalType, id: number) => {
      switch (modalType) {
        case 'project':
          await deleteProject.mutateAsync(id);
          return;
        case 'simType':
          await deleteSimType.mutateAsync(id);
          return;
        case 'paramDef':
          await deleteParamDef.mutateAsync(id);
          return;
        case 'solver':
          await deleteSolver.mutateAsync(id);
          return;
        case 'conditionDef':
          await deleteConditionDef.mutateAsync(id);
          return;
        case 'outputDef':
          await deleteOutputDef.mutateAsync(id);
          return;
        case 'foldType':
          await deleteFoldType.mutateAsync(id);
          return;
        case 'careDevice':
          await deleteCareDevice.mutateAsync(id);
          return;
        case 'solverResource':
          await deleteSolverResource.mutateAsync(id);
          return;
        default:
          return;
      }
    },
    [
      deleteCareDevice,
      deleteConditionDef,
      deleteFoldType,
      deleteOutputDef,
      deleteParamDef,
      deleteProject,
      deleteSimType,
      deleteSolver,
      deleteSolverResource,
    ]
  );

  return {
    saveEntity,
    deleteEntity,
  };
};
