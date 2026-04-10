import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderInitApi } from '@/api/config';
import { ordersApi } from '@/api';
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
import type {
  OrderProjectInitConfig,
  ParticipantCandidate,
  PhaseOption,
  ResourcePoolOption,
  UserResourcePoolsPayload,
} from '@/types/configGroups';

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

  const {
    data: userResourceContext,
    error: userResourceError,
    isLoading: userResourceLoading,
    refetch: refetchUserResources,
  } = useQuery<UserResourcePoolsPayload>({
    queryKey: ['orders', 'resourcePools'],
    queryFn: async () => {
      const response = await ordersApi.getUserResourcePools();
      return (
        (response.data as UserResourcePoolsPayload) ?? {
          resourcePools: [],
          defaultResourceId: null,
        }
      );
    },
    staleTime: 60 * 1000,
  });

  const {
    data: projectInitConfig,
    error: projectInitConfigError,
    isLoading: projectInitConfigLoading,
    refetch: refetchProjectInitConfig,
  } = useQuery<OrderProjectInitConfig | null>({
    queryKey: ['orders', 'initProjectConfig', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return null;
      const response =
        await orderInitApi.getOrderProjectInitConfig<OrderProjectInitConfig>(selectedProjectId);
      return (response.data as OrderProjectInitConfig | null) ?? null;
    },
    enabled: !!selectedProjectId,
    staleTime: 60 * 1000,
  });

  const selectedProject = useMemo(
    () => projects.find(project => project.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  const resourcePools = useMemo<ResourcePoolOption[]>(
    () => userResourceContext?.resourcePools ?? [],
    [userResourceContext?.resourcePools]
  );
  const defaultResourceId = useMemo<number | null>(() => {
    const backendDefault = userResourceContext?.defaultResourceId ?? null;
    if (backendDefault && resourcePools.some(pool => pool.id === backendDefault)) {
      return backendDefault;
    }
    return resourcePools[0]?.id ?? null;
  }, [resourcePools, userResourceContext?.defaultResourceId]);

  const participantCandidates = useMemo<ParticipantCandidate[]>(
    () => projectInitConfig?.participantCandidates ?? [],
    [projectInitConfig?.participantCandidates]
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
    conditionConfigsLoading ||
    userResourceLoading ||
    projectInitConfigLoading;

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
    conditionConfigsError ||
    userResourceError ||
    projectInitConfigError;

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
    void refetchUserResources();
    if (selectedProjectId) {
      void refetchProjectInitConfig();
    }
  }, [
    refetchConditionConfigs,
    refetchConditionDefs,
    refetchFoldTypes,
    refetchOutputDefs,
    refetchOutputSets,
    refetchParamDefs,
    refetchParamGroups,
    refetchProjectInitConfig,
    refetchProjects,
    refetchSimTypes,
    refetchSolvers,
    refetchUserResources,
    selectedProjectId,
  ]);

  const refreshSubmissionConfig = useCallback(async () => {
    const conditionConfigsResult = await refetchConditionConfigs();
    if (selectedProjectId) {
      await refetchProjectInitConfig();
    }
    await refetchUserResources();
    return {
      conditionConfigs: conditionConfigsResult.data ?? conditionConfigs,
    };
  }, [
    conditionConfigs,
    refetchConditionConfigs,
    refetchProjectInitConfig,
    refetchUserResources,
    selectedProjectId,
  ]);

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
    participantCandidates,
    selectedProject,
    projectPhases: (projectInitConfig?.phases || []) as PhaseOption[],
    defaultProjectPhaseId: projectInitConfig?.defaultPhaseId ?? null,
    resourcePools,
    defaultResourceId,
    projectInitConfig,
    userResourceContext,
    isConfigLoading,
    configError,
    retryConfig,
    refreshSubmissionConfig,
  };
};
