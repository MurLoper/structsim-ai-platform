import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  useProjects,
  useSimTypes,
  useFoldTypes,
  useParamDefs,
  useSolvers,
  useOutputDefs,
  useConditionDefs,
  useParamTplSets,
  useCondOutSets,
} from '@/features/config/queries';
import type {
  SimTypeConfig,
  GlobalSolverConfig,
  DrawerMode,
  CanvasTransform,
  SolverConfig,
} from '../types';

export const useSubmissionState = (selectedProjectId: number | null) => {
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
    data: paramTplSets = [],
    error: paramTplSetsError,
    isLoading: paramTplSetsLoading,
    refetch: refetchParamTplSets,
  } = useParamTplSets();
  const {
    data: condOutSets = [],
    error: condOutSetsError,
    isLoading: condOutSetsLoading,
    refetch: refetchCondOutSets,
  } = useCondOutSets();

  // 画布状态
  const [transform, setTransform] = useState<CanvasTransform>({ x: 60, y: 60, scale: 0.85 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // 仿真类型与配置状态
  const [selectedSimTypeIds, setSelectedSimTypeIds] = useState<number[]>([]);
  const [simTypeConfigs, setSimTypeConfigs] = useState<Record<number, SimTypeConfig>>({});

  // 全局求解器配置
  const [globalSolver, setGlobalSolver] = useState<GlobalSolverConfig>({
    solverId: 1,
    solverVersion: '2024',
    cpuType: 1,
    cpuCores: 16,
    applyToAll: true,
  });

  // UI状态
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('project');
  const [activeSimTypeId, setActiveSimTypeId] = useState<number | null>(null);

  // 安全数据 - 使用 useMemo 优化性能
  const safeSimTypes = useMemo(() => simTypes || [], [simTypes]);
  const safeFoldTypes = useMemo(() => foldTypes || [], [foldTypes]);
  const safeSolvers = useMemo(() => solvers || [], [solvers]);
  const safeParamDefs = useMemo(() => paramDefs || [], [paramDefs]);
  const safeOutputDefs = useMemo(() => outputDefs || [], [outputDefs]);
  const safeConditionDefs = useMemo(() => conditionDefs || [], [conditionDefs]);
  const safeParamTplSets = useMemo(() => paramTplSets || [], [paramTplSets]);
  const safeCondOutSets = useMemo(() => condOutSets || [], [condOutSets]);
  const selectedProject = (projects || []).find(p => p.id === selectedProjectId);

  // 初始化仿真类型配置
  const initSimTypeConfig = useCallback(
    (simTypeId: number) => {
      const simType = safeSimTypes.find(st => st.id === simTypeId);
      if (!simType) return;

      const defaultSolver =
        safeSolvers.find(s => s.id === simType.defaultSolverId) || safeSolvers[0];

      setSimTypeConfigs(prev => ({
        ...prev,
        [simTypeId]: {
          simTypeId,
          params: {
            mode: 'template',
            templateSetId: simType.defaultParamTplSetId || null,
            templateItemId: null,
            algorithm: 'doe',
            customValues: {},
          },
          condOut: {
            mode: 'template',
            condOutSetId: simType.defaultCondOutSetId || null,
            selectedConditionIds: [],
            conditionValues: {},
            selectedOutputIds: [],
          },
          solver: {
            solverId: defaultSolver?.id || 1,
            solverVersion: defaultSolver?.version || '2024',
            cpuType: 1,
            cpuCores: defaultSolver?.cpuCoreDefault || 16,
          },
        },
      }));
    },
    [safeSimTypes, safeSolvers]
  );

  // 初始化默认选中的仿真类型
  useEffect(() => {
    if (safeSimTypes.length > 0 && selectedSimTypeIds.length === 0) {
      const defaultType = safeSimTypes[0];
      setSelectedSimTypeIds([defaultType.id]);
      initSimTypeConfig(defaultType.id);
    }
  }, [safeSimTypes, selectedSimTypeIds.length, initSimTypeConfig]);

  // 切换仿真类型选择
  const toggleSimType = useCallback(
    (simTypeId: number) => {
      setSelectedSimTypeIds(prev => {
        if (prev.includes(simTypeId)) {
          return prev.filter(id => id !== simTypeId);
        } else {
          if (!simTypeConfigs[simTypeId]) {
            initSimTypeConfig(simTypeId);
          }
          return [...prev, simTypeId];
        }
      });
    },
    [simTypeConfigs, initSimTypeConfig]
  );

  // 更新仿真类型配置
  const updateSimTypeConfig = useCallback((simTypeId: number, updates: Partial<SimTypeConfig>) => {
    setSimTypeConfigs(prev => ({
      ...prev,
      [simTypeId]: { ...prev[simTypeId], ...updates },
    }));
  }, []);

  // 更新求解器配置
  const updateSolverConfig = useCallback((simTypeId: number, updates: Partial<SolverConfig>) => {
    setSimTypeConfigs(prev => ({
      ...prev,
      [simTypeId]: {
        ...prev[simTypeId],
        solver: { ...prev[simTypeId].solver, ...updates },
      },
    }));
  }, []);

  // 应用求解器配置到所有仿真类型
  const applySolverToAll = useCallback(
    (updates: Partial<SolverConfig>) => {
      selectedSimTypeIds.forEach(id => {
        updateSolverConfig(id, updates);
      });
    },
    [selectedSimTypeIds, updateSolverConfig]
  );

  // 计算仿真类型节点Y坐标
  const getSimTypeNodeY = useCallback((index: number) => {
    return 200 + index * 260;
  }, []);

  // 计算项目节点Y坐标（相对于所有仿真类型垂直居中）
  const getProjectNodeY = useCallback(() => {
    const simTypeCount = safeSimTypes.length;
    if (simTypeCount === 0) return 300;
    const firstY = 200;
    const lastY = 200 + (simTypeCount - 1) * 260;
    return (firstY + lastY) / 2;
  }, [safeSimTypes.length]);

  const isConfigLoading =
    projectsLoading ||
    simTypesLoading ||
    foldTypesLoading ||
    paramDefsLoading ||
    solversLoading ||
    outputDefsLoading ||
    conditionDefsLoading ||
    paramTplSetsLoading ||
    condOutSetsLoading;
  const configError =
    projectsError ||
    simTypesError ||
    foldTypesError ||
    paramDefsError ||
    solversError ||
    outputDefsError ||
    conditionDefsError ||
    paramTplSetsError ||
    condOutSetsError;
  const retryConfig = () => {
    void refetchProjects();
    void refetchSimTypes();
    void refetchFoldTypes();
    void refetchParamDefs();
    void refetchSolvers();
    void refetchOutputDefs();
    void refetchConditionDefs();
    void refetchParamTplSets();
    void refetchCondOutSets();
  };

  return {
    // 配置数据
    projects: projects || [],
    safeSimTypes,
    safeFoldTypes,
    safeSolvers,
    safeParamDefs,
    safeOutputDefs,
    safeConditionDefs,
    safeParamTplSets,
    safeCondOutSets,
    selectedProject,
    isConfigLoading,
    configError,
    retryConfig,
    // 画布状态
    transform,
    setTransform,
    isDragging,
    setIsDragging,
    startPan,
    setStartPan,
    // 仿真类型与配置状态
    selectedSimTypeIds,
    simTypeConfigs,
    globalSolver,
    setGlobalSolver,
    // UI状态
    isDrawerOpen,
    setIsDrawerOpen,
    drawerMode,
    setDrawerMode,
    activeSimTypeId,
    setActiveSimTypeId,
    // 方法
    toggleSimType,
    updateSimTypeConfig,
    updateSolverConfig,
    applySolverToAll,
    getSimTypeNodeY,
    getProjectNodeY,
  };
};
