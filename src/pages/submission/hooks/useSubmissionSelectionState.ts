import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConditionConfig, SimType, Solver } from '@/types/config';
import type { ParamGroup } from '@/types/configGroups';
import type { SimTypeConfig, SolverConfig } from '../types';
import { buildInitialSimTypeConfig, collectDefaultSelections } from './submissionStateUtils';
import type { FoldTypeWithSimTypes, SelectedSimType } from './submissionStateUtils';

interface UseSubmissionSelectionStateOptions {
  foldTypeIds: number[];
  conditionTree: FoldTypeWithSimTypes[];
  conditionConfigs: ConditionConfig[];
  safeSolvers: Solver[];
  safeParamGroups: ParamGroup[];
  simTypes: SimType[];
}

export const useSubmissionSelectionState = ({
  foldTypeIds,
  conditionTree,
  conditionConfigs,
  safeSolvers,
  safeParamGroups,
  simTypes,
}: UseSubmissionSelectionStateOptions) => {
  const [selectedSimTypes, setSelectedSimTypes] = useState<SelectedSimType[]>([]);
  const [simTypeConfigs, setSimTypeConfigs] = useState<Record<number, SimTypeConfig>>({});
  const userClearedFoldTypeIds = useRef<Set<number>>(new Set());
  const initializedConditionIds = useRef<Set<number>>(new Set());

  const getConditionConfig = useCallback(
    (foldTypeId: number, simTypeId: number): ConditionConfig | undefined =>
      conditionConfigs.find(
        config => config.foldTypeId === foldTypeId && config.simTypeId === simTypeId
      ),
    [conditionConfigs]
  );

  const initSimTypeConfig = useCallback(
    (conditionId: number, simTypeId: number, foldTypeId: number) => {
      const initialConfig = buildInitialSimTypeConfig({
        conditionId,
        foldTypeId,
        simTypeId,
        simTypes,
        safeSolvers,
        safeParamGroups,
        conditionConfig: getConditionConfig(foldTypeId, simTypeId),
      });

      if (!initialConfig) {
        return;
      }

      setSimTypeConfigs(prev => ({
        ...prev,
        [conditionId]: initialConfig,
      }));
    },
    [getConditionConfig, safeParamGroups, safeSolvers, simTypes]
  );

  useEffect(() => {
    if (foldTypeIds.length === 0 || conditionTree.length === 0) {
      return;
    }

    userClearedFoldTypeIds.current.forEach(foldTypeId => {
      if (!foldTypeIds.includes(foldTypeId)) {
        userClearedFoldTypeIds.current.delete(foldTypeId);
      }
    });

    setSelectedSimTypes(prev => {
      const validPrev = prev.filter(item => foldTypeIds.includes(item.foldTypeId));
      const existingFoldTypeIds = new Set(validPrev.map(item => item.foldTypeId));
      const foldTypeIdsNeedingDefaults = foldTypeIds.filter(
        foldTypeId =>
          !existingFoldTypeIds.has(foldTypeId) && !userClearedFoldTypeIds.current.has(foldTypeId)
      );

      if (foldTypeIdsNeedingDefaults.length === 0) {
        return prev.length === validPrev.length ? prev : validPrev;
      }

      const newDefaults: SelectedSimType[] = [];
      foldTypeIdsNeedingDefaults.forEach(foldTypeId => {
        const foldType = conditionTree.find(item => item.id === foldTypeId);
        if (!foldType?.simTypes.length) {
          return;
        }

        const defaultSimTypes = foldType.simTypes.filter(simType => simType.isDefault);
        if (defaultSimTypes.length > 0) {
          defaultSimTypes.forEach(simType => {
            newDefaults.push({
              conditionId: simType.conditionId,
              foldTypeId,
              simTypeId: simType.id,
            });
          });
          return;
        }

        const firstSimType = foldType.simTypes[0];
        newDefaults.push({
          conditionId: firstSimType.conditionId,
          foldTypeId,
          simTypeId: firstSimType.id,
        });
      });

      if (newDefaults.length === 0) {
        return prev.length === validPrev.length ? prev : validPrev;
      }

      return [...validPrev, ...newDefaults];
    });
  }, [conditionTree, foldTypeIds]);

  useEffect(() => {
    selectedSimTypes.forEach(item => {
      if (!initializedConditionIds.current.has(item.conditionId)) {
        initializedConditionIds.current.add(item.conditionId);
        initSimTypeConfig(item.conditionId, item.simTypeId, item.foldTypeId);
      }
    });
  }, [initSimTypeConfig, selectedSimTypes]);

  const markConditionIdsAsInitialized = useCallback((ids: number[]) => {
    ids.forEach(id => initializedConditionIds.current.add(id));
  }, []);

  const clearInitializedConditionIds = useCallback(() => {
    initializedConditionIds.current.clear();
  }, []);

  const clearUserClearedFoldTypeIds = useCallback(() => {
    userClearedFoldTypeIds.current.clear();
  }, []);

  const getDefaultSelections = useCallback(
    (_nextConditionConfigs: ConditionConfig[] = conditionConfigs) =>
      collectDefaultSelections(conditionTree.length ? conditionTree : []),
    [conditionConfigs, conditionTree]
  );

  const toggleSimType = useCallback(
    (
      conditionId: number,
      foldTypeId: number,
      simTypeId: number,
      currentFoldTypeIds: number[]
    ): number | null => {
      const currentSelectedSimTypes = selectedSimTypes;
      const existingIndex = currentSelectedSimTypes.findIndex(
        item => item.conditionId === conditionId
      );

      if (existingIndex >= 0) {
        const newList = currentSelectedSimTypes.filter((_, index) => index !== existingIndex);

        if (newList.length === 0) {
          return -1;
        }

        const remainingForFoldType = newList.filter(item => item.foldTypeId === foldTypeId);
        if (remainingForFoldType.length === 0) {
          const otherFoldTypeIds = currentFoldTypeIds.filter(id => id !== foldTypeId);
          if (otherFoldTypeIds.length === 0) {
            return -1;
          }

          userClearedFoldTypeIds.current.add(foldTypeId);
          setSelectedSimTypes(newList);
          return foldTypeId;
        }

        setSelectedSimTypes(newList);
        return null;
      }

      if (!simTypeConfigs[conditionId]) {
        initSimTypeConfig(conditionId, simTypeId, foldTypeId);
      }
      setSelectedSimTypes([...currentSelectedSimTypes, { conditionId, foldTypeId, simTypeId }]);
      return null;
    },
    [initSimTypeConfig, selectedSimTypes, simTypeConfigs]
  );

  const updateSimTypeConfig = useCallback(
    (conditionId: number, updates: Partial<SimTypeConfig>) => {
      setSimTypeConfigs(prev => ({
        ...prev,
        [conditionId]: { ...prev[conditionId], ...updates },
      }));
    },
    []
  );

  const updateSolverConfig = useCallback((conditionId: number, updates: Partial<SolverConfig>) => {
    setSimTypeConfigs(prev => ({
      ...prev,
      [conditionId]: {
        ...prev[conditionId],
        solver: { ...prev[conditionId].solver, ...updates },
      },
    }));
  }, []);

  const applySolverToAll = useCallback(
    (updates: Partial<SolverConfig>) => {
      selectedSimTypes.forEach(item => {
        updateSolverConfig(item.conditionId, updates);
      });
    },
    [selectedSimTypes, updateSolverConfig]
  );

  return {
    selectedSimTypes,
    setSelectedSimTypes,
    simTypeConfigs,
    setSimTypeConfigs,
    toggleSimType,
    updateSimTypeConfig,
    updateSolverConfig,
    applySolverToAll,
    getConditionConfig,
    getDefaultSelections,
    markConditionIdsAsInitialized,
    clearInitializedConditionIds,
    clearUserClearedFoldTypeIds,
  };
};
