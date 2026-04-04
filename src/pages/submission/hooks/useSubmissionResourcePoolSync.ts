import { useEffect, useRef } from 'react';
import type { ResourcePoolOption } from '@/types/configGroups';
import type { SimTypeConfig } from '../types';

interface UseSubmissionResourcePoolSyncOptions {
  selectedProjectId: number | null;
  selectedConditionIds: number[];
  simTypeConfigs: Record<number, SimTypeConfig>;
  resourcePools: ResourcePoolOption[];
  defaultResourceId: number | null;
  updateSolverConfig: (conditionId: number, updates: Partial<SimTypeConfig['solver']>) => void;
}

export const useSubmissionResourcePoolSync = ({
  selectedProjectId,
  selectedConditionIds,
  simTypeConfigs,
  resourcePools,
  defaultResourceId,
  updateSolverConfig,
}: UseSubmissionResourcePoolSyncOptions) => {
  const lastProjectIdRef = useRef<number | null>(null);

  useEffect(() => {
    const availableResourceIds = resourcePools.map(item => item.id);
    const fallbackResourceId =
      defaultResourceId && availableResourceIds.includes(defaultResourceId)
        ? defaultResourceId
        : (resourcePools[0]?.id ?? null);

    const projectChanged = lastProjectIdRef.current !== selectedProjectId;
    lastProjectIdRef.current = selectedProjectId;

    if (!fallbackResourceId) {
      return;
    }

    selectedConditionIds.forEach(conditionId => {
      const currentResourceId = simTypeConfigs[conditionId]?.solver?.resourceId ?? null;
      const hasValidSelection =
        typeof currentResourceId === 'number' && availableResourceIds.includes(currentResourceId);

      if (hasValidSelection && !projectChanged) {
        return;
      }

      if (currentResourceId === fallbackResourceId && !projectChanged) {
        return;
      }

      if (!projectChanged && currentResourceId !== null && hasValidSelection) {
        return;
      }

      updateSolverConfig(conditionId, { resourceId: fallbackResourceId });
    });
  }, [
    defaultResourceId,
    resourcePools,
    selectedConditionIds,
    selectedProjectId,
    simTypeConfigs,
    updateSolverConfig,
  ]);
};
