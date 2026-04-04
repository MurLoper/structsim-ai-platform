import { useState, useCallback, useMemo } from 'react';
import { paramGroupsApi, outputGroupsApi } from '@/api/config/groups';
import type { ConditionConfig } from '@/types/config';
import type { ParamInGroup, OutputInGroup } from '@/types/configGroups';
import type { GlobalSolverConfig } from '../types';
import {
  buildFoldTypeTree,
  calculateProjectNodeY,
  collectSafeSimTypes,
} from './submissionStateUtils';
import type { FoldTypeWithSimTypes } from './submissionStateUtils';
import { useSubmissionConfigData } from './useSubmissionConfigData';
import { useSubmissionTemplatePrefill } from './useSubmissionTemplatePrefill';
import { useSubmissionCanvasState } from './useSubmissionCanvasState';
import { useSubmissionDrawerState } from './useSubmissionDrawerState';
import { useSubmissionSelectionState } from './useSubmissionSelectionState';

export type { FoldTypeWithSimTypes, SelectedSimType } from './submissionStateUtils';

export const useSubmissionState = (
  selectedProjectId: number | null,
  foldTypeIds: number[] = []
) => {
  const {
    projects,
    simTypes,
    foldTypes,
    paramDefs,
    solvers,
    outputDefs,
    conditionDefs,
    paramGroups,
    outputSets,
    conditionConfigs,
    users,
    selectedProject,
    projectPhases,
    defaultProjectPhaseId,
    resourcePools,
    defaultResourceId,
    isConfigLoading,
    configError,
    retryConfig,
    refreshSubmissionConfig,
  } = useSubmissionConfigData(selectedProjectId);

  const canvasState = useSubmissionCanvasState();
  const drawerState = useSubmissionDrawerState();

  const [globalSolver, setGlobalSolver] = useState<GlobalSolverConfig>({
    solverId: 1,
    solverVersion: '2024',
    cpuType: 1,
    cpuCores: 16,
    double: 0,
    applyGlobal: null,
    useGlobalConfig: 0,
    resourceId: null,
    applyToAll: true,
  });

  const buildCurrentFoldTypeTree = useCallback(
    (nextConditionConfigs: ConditionConfig[] = conditionConfigs): FoldTypeWithSimTypes[] =>
      buildFoldTypeTree(foldTypes, simTypes, nextConditionConfigs),
    [conditionConfigs, foldTypes, simTypes]
  );

  const conditionTree = useMemo<FoldTypeWithSimTypes[]>(() => {
    if (!foldTypes.length || !simTypes.length || isConfigLoading) {
      return [];
    }
    return buildCurrentFoldTypeTree(conditionConfigs);
  }, [
    buildCurrentFoldTypeTree,
    conditionConfigs,
    foldTypes.length,
    isConfigLoading,
    simTypes.length,
  ]);

  const safeSimTypes = useMemo(
    () => collectSafeSimTypes(foldTypeIds, conditionTree),
    [foldTypeIds, conditionTree]
  );
  const safeFoldTypes = useMemo(() => foldTypes || [], [foldTypes]);
  const safeSolvers = useMemo(() => solvers || [], [solvers]);
  const safeParamDefs = useMemo(() => paramDefs || [], [paramDefs]);
  const safeOutputDefs = useMemo(() => outputDefs || [], [outputDefs]);
  const safeConditionDefs = useMemo(() => conditionDefs || [], [conditionDefs]);
  const safeParamGroups = useMemo(() => paramGroups || [], [paramGroups]);
  const safeOutputSets = useMemo(() => outputSets || [], [outputSets]);
  const safeConditionConfigs = useMemo(() => conditionConfigs || [], [conditionConfigs]);

  const selectionState = useSubmissionSelectionState({
    foldTypeIds,
    conditionTree,
    conditionConfigs: safeConditionConfigs,
    safeSolvers,
    safeParamGroups,
    simTypes,
  });

  useSubmissionTemplatePrefill({
    selectedSimTypes: selectionState.selectedSimTypes,
    simTypeConfigs: selectionState.simTypeConfigs,
    setSimTypeConfigs: selectionState.setSimTypeConfigs,
    paramDefs,
    safeParamGroups,
  });

  const getSimTypeNodeY = useCallback((index: number) => 200 + index * 260, []);

  const getProjectNodeY = useCallback(() => calculateProjectNodeY(conditionTree), [conditionTree]);

  const fetchParamGroupParams = useCallback(async (groupId: number): Promise<ParamInGroup[]> => {
    try {
      const response = await paramGroupsApi.getParamGroupParams(groupId);
      return (response.data as ParamInGroup[]) || [];
    } catch (error) {
      console.error('获取参数组详情失败:', error);
      return [];
    }
  }, []);

  const fetchOutputGroupOutputs = useCallback(async (groupId: number): Promise<OutputInGroup[]> => {
    try {
      const response = await outputGroupsApi.getOutputGroupOutputs(groupId);
      return (response.data as OutputInGroup[]) || [];
    } catch (error) {
      console.error('获取输出组详情失败:', error);
      return [];
    }
  }, []);

  return {
    projects,
    users,
    resourcePools,
    safeSimTypes,
    safeFoldTypes,
    safeSolvers,
    safeParamDefs,
    safeOutputDefs,
    safeConditionDefs,
    safeParamGroups,
    safeOutputSets,
    safeConditionConfigs,
    foldTypesWithSimTypes: conditionTree,
    selectedProject,
    projectPhases,
    defaultProjectPhaseId,
    defaultResourceId,
    isConfigLoading,
    configError,
    retryConfig,
    refreshSubmissionConfig,
    getDefaultSelections: selectionState.getDefaultSelections,
    transform: canvasState.transform,
    setTransform: canvasState.setTransform,
    isDragging: canvasState.isDragging,
    setIsDragging: canvasState.setIsDragging,
    startPan: canvasState.startPan,
    setStartPan: canvasState.setStartPan,
    selectedSimTypes: selectionState.selectedSimTypes,
    setSelectedSimTypes: selectionState.setSelectedSimTypes,
    simTypeConfigs: selectionState.simTypeConfigs,
    setSimTypeConfigs: selectionState.setSimTypeConfigs,
    globalSolver,
    setGlobalSolver,
    isDrawerOpen: drawerState.isDrawerOpen,
    setIsDrawerOpen: drawerState.setIsDrawerOpen,
    drawerMode: drawerState.drawerMode,
    setDrawerMode: drawerState.setDrawerMode,
    activeSimTypeId: drawerState.activeSimTypeId,
    setActiveSimTypeId: drawerState.setActiveSimTypeId,
    activeFoldTypeId: drawerState.activeFoldTypeId,
    setActiveFoldTypeId: drawerState.setActiveFoldTypeId,
    activeConditionId: drawerState.activeConditionId,
    setActiveConditionId: drawerState.setActiveConditionId,
    toggleSimType: selectionState.toggleSimType,
    updateSimTypeConfig: selectionState.updateSimTypeConfig,
    updateSolverConfig: selectionState.updateSolverConfig,
    applySolverToAll: selectionState.applySolverToAll,
    getConditionConfig: selectionState.getConditionConfig,
    fetchParamGroupParams,
    fetchOutputGroupOutputs,
    markConditionIdsAsInitialized: selectionState.markConditionIdsAsInitialized,
    clearInitializedConditionIds: selectionState.clearInitializedConditionIds,
    clearUserClearedFoldTypeIds: selectionState.clearUserClearedFoldTypeIds,
    getSimTypeNodeY,
    getProjectNodeY,
  };
};
