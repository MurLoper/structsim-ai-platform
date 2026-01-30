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
  useFoldTypeSimTypeRels,
} from '@/features/config/queries';
import type {
  SimTypeConfig,
  GlobalSolverConfig,
  DrawerMode,
  CanvasTransform,
  SolverConfig,
} from '../types';
import type { SimType } from '@/types/config';

// 姿态及其关联的仿真类型
export interface FoldTypeWithSimTypes {
  id: number;
  name: string;
  code?: string;
  angle?: number;
  simTypes: Array<SimType & { isDefault: boolean; relSort: number }>;
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

  // 获取所有姿态-仿真类型关联
  const {
    data: foldTypeSimTypeRels = [],
    error: foldTypeSimTypeRelsError,
    isLoading: foldTypeSimTypeRelsLoading,
    refetch: refetchFoldTypeSimTypeRels,
  } = useFoldTypeSimTypeRels();
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
  // 构建姿态及其关联仿真类型的完整数据结构
  const foldTypesWithSimTypes = useMemo<FoldTypeWithSimTypes[]>(() => {
    if (!foldTypes.length || !simTypes.length) return [];

    return foldTypes.map(ft => {
      const rels = foldTypeSimTypeRels.filter(rel => rel.foldTypeId === ft.id);
      const ftSimTypes = rels
        .map(rel => {
          const st = simTypes.find(s => s.id === rel.simTypeId);
          if (!st) return null;
          return {
            ...st,
            isDefault: rel.isDefault === 1,
            relSort: rel.sort,
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
  }, [foldTypes, simTypes, foldTypeSimTypeRels]);

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

  // 获取默认选中的仿真类型ID（根据 isDefault 标记，支持多姿态）
  const defaultSimTypeIds = useMemo(() => {
    if (foldTypeIds.length === 0) return [];
    const defaultIds: number[] = [];
    foldTypeIds.forEach(ftId => {
      const foldTypeData = foldTypesWithSimTypes.find(ft => ft.id === ftId);
      (foldTypeData?.simTypes || [])
        .filter(st => st.isDefault)
        .forEach(st => {
          if (!defaultIds.includes(st.id)) {
            defaultIds.push(st.id);
          }
        });
    });
    return defaultIds;
  }, [foldTypeIds, foldTypesWithSimTypes]);
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
  // 当姿态变化时，添加新姿态的默认仿真类型（保留已选择的）
  useEffect(() => {
    if (safeSimTypes.length === 0) return;

    // 合并：保留已选择的 + 添加新的默认仿真类型
    setSelectedSimTypeIds(prev => {
      // 过滤掉不再有效的仿真类型（所属姿态被取消选择）
      const validPrev = prev.filter(id => safeSimTypes.some(st => st.id === id));

      // 添加新的默认仿真类型（如果还没选择）
      const newDefaults = defaultSimTypeIds.filter(id => !validPrev.includes(id));

      // 如果没有任何选择，至少选择第一个
      if (validPrev.length === 0 && newDefaults.length === 0 && safeSimTypes.length > 0) {
        const firstId = safeSimTypes[0].id;
        initSimTypeConfig(firstId);
        return [firstId];
      }

      // 初始化新添加的默认仿真类型配置
      newDefaults.forEach(id => {
        initSimTypeConfig(id);
      });

      return [...validPrev, ...newDefaults];
    });
  }, [foldTypeIds, safeSimTypes, defaultSimTypeIds, initSimTypeConfig]);

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
    foldTypeSimTypeRelsLoading ||
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
    foldTypeSimTypeRelsError ||
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
    void refetchFoldTypeSimTypeRels();
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
