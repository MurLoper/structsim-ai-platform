import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderInitApi } from '@/api/config';
import {
  useProjects,
  useSimTypes,
  useFoldTypes,
  useParamDefs,
  useSolvers,
  useOutputDefs,
  useConditionDefs,
  useParamGroups,
  useOutputSets,
  useConditionConfigs,
} from '@/features/config/queries';
import { rbacApi } from '@/api/rbac';
import type { OrderInitConfig, PhaseOption, ResourcePoolOption } from '@/types/configGroups';

const FALLBACK_RESOURCE_POOLS: ResourcePoolOption[] = [
  { id: 19, name: 'OPTI' },
  { id: 23, name: 'HPC-CPU' },
  { id: 31, name: 'GPU-POOL' },
];

export const useSubmissionConfigData = (selectedProjectId: number | null) => {
  const {
    data: projects = [],
    error: projectsError,
    isLoading: projectsLoading,
    refetch: refetchProjects,
  } = useProjects();
  const {
    data: simTypes = [],
    error: simTypesError,
    isLoading: simTypesLoading,
    refetch: refetchSimTypes,
  } = useSimTypes();
  const {
    data: foldTypes = [],
    error: foldTypesError,
    isLoading: foldTypesLoading,
    refetch: refetchFoldTypes,
  } = useFoldTypes();
  const {
    data: paramDefs = [],
    error: paramDefsError,
    isLoading: paramDefsLoading,
    refetch: refetchParamDefs,
  } = useParamDefs();
  const {
    data: solvers = [],
    error: solversError,
    isLoading: solversLoading,
    refetch: refetchSolvers,
  } = useSolvers();
  const {
    data: outputDefs = [],
    error: outputDefsError,
    isLoading: outputDefsLoading,
    refetch: refetchOutputDefs,
  } = useOutputDefs();
  const {
    data: conditionDefs = [],
    error: conditionDefsError,
    isLoading: conditionDefsLoading,
    refetch: refetchConditionDefs,
  } = useConditionDefs();
  const {
    data: paramGroups = [],
    error: paramGroupsError,
    isLoading: paramGroupsLoading,
    refetch: refetchParamGroups,
  } = useParamGroups();
  const {
    data: outputSets = [],
    error: outputSetsError,
    isLoading: outputSetsLoading,
    refetch: refetchOutputSets,
  } = useOutputSets();
  const {
    data: conditionConfigs = [],
    error: conditionConfigsError,
    isLoading: conditionConfigsLoading,
    refetch: refetchConditionConfigs,
  } = useConditionConfigs();

  const { data: usersData, refetch: refetchUsers } = useQuery({
    queryKey: ['users', 'list'],
    queryFn: async () => {
      const response = await rbacApi.getUsers();
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: orderInitConfig, refetch: refetchOrderInitConfig } =
    useQuery<OrderInitConfig | null>({
      queryKey: ['orders', 'initConfig', selectedProjectId],
      queryFn: async () => {
        if (!selectedProjectId) return null;
        const response = await orderInitApi.getOrderInitConfig<OrderInitConfig>(selectedProjectId);
        return (response.data as OrderInitConfig | null) ?? null;
      },
      enabled: !!selectedProjectId,
      staleTime: 60 * 1000,
    });

  const users = usersData || [];
  const resolvedResourcePools = useMemo<ResourcePoolOption[]>(() => {
    const backendPools = (orderInitConfig?.resourcePools || []) as ResourcePoolOption[];
    return backendPools.length > 0 ? backendPools : FALLBACK_RESOURCE_POOLS;
  }, [orderInitConfig?.resourcePools]);
  const resolvedDefaultResourceId = useMemo<number | null>(() => {
    const backendDefault = orderInitConfig?.defaultResourceId ?? null;
    if (backendDefault && resolvedResourcePools.some(pool => pool.id === backendDefault)) {
      return backendDefault;
    }
    return resolvedResourcePools[0]?.id ?? null;
  }, [orderInitConfig?.defaultResourceId, resolvedResourcePools]);
  const selectedProject = useMemo(
    () => projects.find(project => project.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  const isConfigLoading =
    projectsLoading ||
    simTypesLoading ||
    foldTypesLoading ||
    paramDefsLoading ||
    solversLoading ||
    outputDefsLoading ||
    conditionDefsLoading ||
    paramGroupsLoading ||
    outputSetsLoading ||
    conditionConfigsLoading;

  const configError =
    projectsError ||
    simTypesError ||
    foldTypesError ||
    paramDefsError ||
    solversError ||
    outputDefsError ||
    conditionDefsError ||
    paramGroupsError ||
    outputSetsError ||
    conditionConfigsError;

  const retryConfig = useCallback(() => {
    void refetchProjects();
    void refetchSimTypes();
    void refetchFoldTypes();
    void refetchParamDefs();
    void refetchSolvers();
    void refetchOutputDefs();
    void refetchConditionDefs();
    void refetchParamGroups();
    void refetchOutputSets();
    void refetchConditionConfigs();
    void refetchUsers();
    if (selectedProjectId) {
      void refetchOrderInitConfig();
    }
  }, [
    refetchConditionConfigs,
    refetchConditionDefs,
    refetchFoldTypes,
    refetchOutputDefs,
    refetchOutputSets,
    refetchParamDefs,
    refetchParamGroups,
    refetchProjects,
    refetchSimTypes,
    refetchSolvers,
    refetchOrderInitConfig,
    refetchUsers,
    selectedProjectId,
  ]);

  const refreshSubmissionConfig = useCallback(async () => {
    const conditionConfigsResult = await refetchConditionConfigs();
    return {
      conditionConfigs: conditionConfigsResult.data ?? conditionConfigs,
    };
  }, [conditionConfigs, refetchConditionConfigs]);

  return {
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
    projectPhases: (orderInitConfig?.phases || []) as PhaseOption[],
    defaultProjectPhaseId: orderInitConfig?.defaultPhaseId ?? null,
    resourcePools: resolvedResourcePools,
    defaultResourceId: resolvedDefaultResourceId,
    orderInitConfig,
    isConfigLoading,
    configError,
    retryConfig,
    refreshSubmissionConfig,
  };
};
