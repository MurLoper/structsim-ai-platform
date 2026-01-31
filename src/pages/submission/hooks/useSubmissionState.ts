import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  useProjects,
  useSimTypes,
  useFoldTypes,
  useParamDefs,
  useSolvers,
  useOutputDefs,
  useConditionDefs,
  useParamGroups,
  useCondOutSets,
  useConditionConfigs,
} from '@/features/config/queries';
import type {
  SimTypeConfig,
  GlobalSolverConfig,
  DrawerMode,
  CanvasTransform,
  SolverConfig,
} from '../types';
import type { SimType, ConditionConfig } from '@/types/config';

// 姿态及其关联的仿真类型
export interface FoldTypeWithSimTypes {
  id: number;
  name: string;
  code?: string;
  angle?: number;
  simTypes: Array<SimType & { isDefault: boolean; relSort: number }>;
}

// 选中的仿真类型（姿态+仿真类型组合）
export interface SelectedSimType {
  foldTypeId: number;
  simTypeId: number;
}

export const useSubmissionState = (
  selectedProjectId: number | null,
  foldTypeIds: number[] = []
) => {
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
    data: condOutSets = [],
    error: condOutSetsError,
    isLoading: condOutSetsLoading,
    refetch: refetchCondOutSets,
  } = useCondOutSets();

  // 获取所有工况配置
  const {
    data: conditionConfigs = [],
    error: conditionConfigsError,
    isLoading: conditionConfigsLoading,
    refetch: refetchConditionConfigs,
  } = useConditionConfigs();

  // 画布状态
  const [transform, setTransform] = useState<CanvasTransform>({ x: 60, y: 60, scale: 0.85 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // 仿真类型与配置状态（使用姿态+仿真类型组合）
  const [selectedSimTypes, setSelectedSimTypes] = useState<SelectedSimType[]>([]);
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
  // 构建姿态及其关联仿真类型的完整数据结构（从 conditionConfigs 获取）
  const foldTypesWithSimTypes = useMemo<FoldTypeWithSimTypes[]>(() => {
    if (!foldTypes.length || !simTypes.length) return [];

    return foldTypes.map(ft => {
      // 从工况配置中获取该姿态关联的仿真类型
      const configs = conditionConfigs.filter(c => c.foldTypeId === ft.id);
      const ftSimTypes = configs
        .map((config, idx) => {
          const st = simTypes.find(s => s.id === config.simTypeId);
          if (!st) return null;
          return {
            ...st,
            // 使用工况配置的 defaultParamGroupId 存在与否判断是否为默认
            isDefault: !!config.defaultParamGroupId,
            relSort: config.sort || idx * 10,
          };
        })
        .filter((st): st is SimType & { isDefault: boolean; relSort: number } => st !== null)
        .sort((a, b) => a.relSort - b.relSort);

      return {
        id: ft.id,
        name: ft.name,
        code: ft.code,
        angle: ft.angle,
        simTypes: ftSimTypes,
      };
    });
  }, [foldTypes, simTypes, conditionConfigs]);

  // 当前选中姿态的仿真类型（支持多姿态）
  const safeSimTypes = useMemo(() => {
    if (foldTypeIds.length === 0) return simTypes || [];
    // 合并所有选中姿态的仿真类型
    const allSimTypes: Array<SimType & { isDefault: boolean; relSort: number }> = [];
    foldTypeIds.forEach(ftId => {
      const foldTypeData = foldTypesWithSimTypes.find(ft => ft.id === ftId);
      if (foldTypeData) {
        foldTypeData.simTypes.forEach(st => {
          if (!allSimTypes.some(s => s.id === st.id)) {
            allSimTypes.push(st);
          }
        });
      }
    });
    return allSimTypes;
  }, [foldTypeIds, foldTypesWithSimTypes, simTypes]);

  // 获取默认选中的仿真类型（根据 isDefault 标记，支持多姿态多默认）
  const defaultSimTypes = useMemo<SelectedSimType[]>(() => {
    if (foldTypeIds.length === 0) return [];
    const defaults: SelectedSimType[] = [];
    foldTypeIds.forEach(ftId => {
      const foldTypeData = foldTypesWithSimTypes.find(ft => ft.id === ftId);
      // 获取该姿态下所有默认仿真类型（可能有多个）
      const defaultSts = foldTypeData?.simTypes.filter(st => st.isDefault) || [];
      defaultSts.forEach(st => {
        defaults.push({ foldTypeId: ftId, simTypeId: st.id });
      });
    });
    return defaults;
  }, [foldTypeIds, foldTypesWithSimTypes]);
  const safeFoldTypes = useMemo(() => foldTypes || [], [foldTypes]);
  const safeSolvers = useMemo(() => solvers || [], [solvers]);
  const safeParamDefs = useMemo(() => paramDefs || [], [paramDefs]);
  const safeOutputDefs = useMemo(() => outputDefs || [], [outputDefs]);
  const safeConditionDefs = useMemo(() => conditionDefs || [], [conditionDefs]);
  const safeParamGroups = useMemo(() => paramGroups || [], [paramGroups]);
  const safeCondOutSets = useMemo(() => condOutSets || [], [condOutSets]);
  const safeConditionConfigs = useMemo(() => conditionConfigs || [], [conditionConfigs]);
  const selectedProject = (projects || []).find(p => p.id === selectedProjectId);

  // 根据姿态+仿真类型查找工况配置
  const getConditionConfig = useCallback(
    (foldTypeId: number, simTypeId: number): ConditionConfig | undefined => {
      return safeConditionConfigs.find(
        c => c.foldTypeId === foldTypeId && c.simTypeId === simTypeId
      );
    },
    [safeConditionConfigs]
  );

  // 初始化仿真类型配置（支持工况配置）
  const initSimTypeConfig = useCallback(
    (simTypeId: number, foldTypeId?: number) => {
      const simType = safeSimTypes.find(st => st.id === simTypeId);
      if (!simType) return;

      // 尝试获取工况配置
      let conditionConfig: ConditionConfig | undefined;
      if (foldTypeId) {
        conditionConfig = getConditionConfig(foldTypeId, simTypeId);
      }

      // 优先使用工况配置的默认值，否则使用仿真类型的默认值
      const defaultParamGroupId =
        conditionConfig?.defaultParamGroupId || simType.defaultParamGroupId;
      const defaultOutputGroupId =
        conditionConfig?.defaultOutputGroupId || simType.defaultOutputGroupId;
      const defaultSolverId = conditionConfig?.defaultSolverId || simType.defaultSolverId;

      const defaultSolver = safeSolvers.find(s => s.id === defaultSolverId) || safeSolvers[0];

      setSimTypeConfigs(prev => ({
        ...prev,
        [simTypeId]: {
          simTypeId,
          params: {
            mode: 'template',
            templateSetId: defaultParamGroupId || null,
            templateItemId: null,
            algorithm: 'doe',
            customValues: {},
          },
          condOut: {
            mode: 'template',
            condOutSetId: defaultOutputGroupId || null,
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
    [safeSimTypes, safeSolvers, getConditionConfig]
  );

  // 初始化默认选中的仿真类型
  // 当姿态变化时：1. 移除被取消姿态的仿真类型 2. 为新增姿态自动选择默认仿真类型
  useEffect(() => {
    if (foldTypeIds.length === 0 || foldTypesWithSimTypes.length === 0) return;

    setSelectedSimTypes(prev => {
      // 过滤掉所属姿态被取消选择的项
      const validPrev = prev.filter(item => foldTypeIds.includes(item.foldTypeId));

      // 找出已有选择的姿态ID
      const existingFoldTypeIds = new Set(validPrev.map(item => item.foldTypeId));

      // 找出新增的姿态（还没有任何仿真类型被选中的姿态）
      const newFoldTypeIds = foldTypeIds.filter(ftId => !existingFoldTypeIds.has(ftId));

      // 如果没有新增姿态，直接返回
      if (newFoldTypeIds.length === 0) {
        return validPrev;
      }

      // 为新增姿态添加默认仿真类型（支持多个默认）
      const newDefaults: SelectedSimType[] = [];
      newFoldTypeIds.forEach(ftId => {
        const defaultStsForFold = defaultSimTypes.filter(d => d.foldTypeId === ftId);
        defaultStsForFold.forEach(defaultSt => {
          newDefaults.push(defaultSt);
        });
      });

      return [...validPrev, ...newDefaults];
    });
  }, [foldTypeIds, foldTypesWithSimTypes, defaultSimTypes]);

  // 为新选中的仿真类型初始化配置（单独的 effect 避免循环）
  useEffect(() => {
    selectedSimTypes.forEach(item => {
      if (!simTypeConfigs[item.simTypeId]) {
        initSimTypeConfig(item.simTypeId, item.foldTypeId);
      }
    });
  }, [selectedSimTypes, simTypeConfigs, initSimTypeConfig]);

  // 切换仿真类型选择（需要同时传入姿态ID和仿真类型ID）
  const toggleSimType = useCallback(
    (foldTypeId: number, simTypeId: number) => {
      setSelectedSimTypes(prev => {
        const existingIndex = prev.findIndex(
          item => item.foldTypeId === foldTypeId && item.simTypeId === simTypeId
        );
        if (existingIndex >= 0) {
          // 已选中，取消选择
          return prev.filter((_, idx) => idx !== existingIndex);
        } else {
          // 未选中，添加选择
          if (!simTypeConfigs[simTypeId]) {
            initSimTypeConfig(simTypeId, foldTypeId);
          }
          return [...prev, { foldTypeId, simTypeId }];
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
      selectedSimTypes.forEach(item => {
        updateSolverConfig(item.simTypeId, updates);
      });
    },
    [selectedSimTypes, updateSolverConfig]
  );

  // 计算仿真类型节点Y坐标（已废弃，改用页面内计算）
  const getSimTypeNodeY = useCallback((index: number) => {
    return 200 + index * 260;
  }, []);

  // 计算项目节点Y坐标（相对于所有姿态垂直居中）
  const getProjectNodeY = useCallback(() => {
    if (foldTypesWithSimTypes.length === 0) return 300;

    // 计算所有姿态的总仿真类型数量
    const totalSimTypes = foldTypesWithSimTypes.reduce(
      (sum, ft) => sum + Math.max(ft.simTypes.length, 1),
      0
    );
    // 姿态之间的间隙数量
    const foldTypeGaps = Math.max(foldTypesWithSimTypes.length - 1, 0);

    // 总高度 = 仿真类型数量 * 间距 + 姿态间隙
    const startY = 100;
    const simTypeSpacing = 240; // 与 CANVAS_LAYOUT.SIM_TYPE_VERTICAL_SPACING 保持一致
    const foldTypeGap = 60; // 与 CANVAS_LAYOUT.FOLD_TYPE_GAP 保持一致

    const totalHeight = (totalSimTypes - 1) * simTypeSpacing + foldTypeGaps * foldTypeGap;

    return startY + totalHeight / 2;
  }, [foldTypesWithSimTypes]);

  const isConfigLoading =
    projectsLoading ||
    simTypesLoading ||
    foldTypesLoading ||
    paramDefsLoading ||
    solversLoading ||
    outputDefsLoading ||
    conditionDefsLoading ||
    paramGroupsLoading ||
    condOutSetsLoading ||
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
    condOutSetsError ||
    conditionConfigsError;
  const retryConfig = () => {
    void refetchProjects();
    void refetchSimTypes();
    void refetchFoldTypes();
    void refetchParamDefs();
    void refetchSolvers();
    void refetchOutputDefs();
    void refetchConditionDefs();
    void refetchParamGroups();
    void refetchCondOutSets();
    void refetchConditionConfigs();
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
    safeParamGroups,
    safeCondOutSets,
    safeConditionConfigs,
    foldTypesWithSimTypes,
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
    selectedSimTypes,
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
    getConditionConfig,
  };
};
