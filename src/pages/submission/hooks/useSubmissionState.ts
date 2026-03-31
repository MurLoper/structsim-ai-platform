import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { paramGroupsApi, outputGroupsApi } from '@/api/config/groups';
import { AlgorithmType, TargetType } from '../types';
import type {
  SimTypeConfig,
  GlobalSolverConfig,
  DrawerMode,
  CanvasTransform,
  SolverConfig,
  ParamDomain,
  OptParams,
  RespDetail,
} from '../types';
import type { SimType, ConditionConfig } from '@/types/config';
import type { ParamInGroup, OutputInGroup } from '@/types/configGroups';

// 姿态及其关联的仿真类型
export interface FoldTypeWithSimTypes {
  id: number;
  name: string;
  code?: string;
  angle?: number;
  simTypes: Array<SimType & { isDefault: boolean; relSort: number; conditionId: number }>;
}

// 选中的仿真类型（姿态+仿真类型组合，以 conditionId 为唯一标识）
export interface SelectedSimType {
  conditionId: number; // condition_config.id
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
    data: outputSets = [],
    error: outputSetsError,
    isLoading: outputSetsLoading,
    refetch: refetchOutputSets,
  } = useOutputSets();

  // 获取所有工况配置
  const {
    data: conditionConfigs = [],
    error: conditionConfigsError,
    isLoading: conditionConfigsLoading,
    refetch: refetchConditionConfigs,
  } = useConditionConfigs();

  // 获取用户列表（用于参与人选择）
  const { data: usersData, refetch: refetchUsers } = useQuery({
    queryKey: ['users', 'list'],
    queryFn: async () => {
      const response = await rbacApi.getUsers();
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
  const users = usersData || [];

  // 画布状态
  const [transform, setTransform] = useState<CanvasTransform>({ x: 60, y: 60, scale: 0.85 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // 仿真类型与配置状态（使用姿态+仿真类型组合）
  const [selectedSimTypes, setSelectedSimTypes] = useState<SelectedSimType[]>([]);
  const [simTypeConfigs, setSimTypeConfigs] = useState<Record<number, SimTypeConfig>>({});
  // 跟踪用户主动清空仿真类型的姿态ID（这些姿态不应该重新初始化默认值）
  const userClearedFoldTypeIds = useRef<Set<number>>(new Set());

  // 全局求解器配置
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

  // UI状态
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('project');
  const [activeSimTypeId, setActiveSimTypeId] = useState<number | null>(null);
  const [activeFoldTypeId, setActiveFoldTypeId] = useState<number | null>(null);
  const [activeConditionId, setActiveConditionId] = useState<number | null>(null);

  const buildFoldTypeTree = useCallback(
    (nextConditionConfigs: ConditionConfig[] = conditionConfigs): FoldTypeWithSimTypes[] => {
      if (!foldTypes.length || !simTypes.length) return [];

      return foldTypes.map(ft => {
        const configs = nextConditionConfigs
          .filter(config => config.foldTypeId === ft.id)
          .sort((a, b) => a.sort - b.sort);

        if (configs.length === 0) {
          return {
            id: ft.id,
            name: ft.name,
            code: ft.code,
            angle: ft.angle,
            simTypes: [],
          };
        }

        const configSimTypes = configs
          .map((config, idx) => {
            const st = simTypes.find(s => s.id === config.simTypeId);
            if (!st) return null;
            return {
              ...st,
              isDefault: config.isDefault === 1,
              relSort: config.sort || idx * 10,
              conditionId: config.id,
            };
          })
          .filter(
            (st): st is SimType & { isDefault: boolean; relSort: number; conditionId: number } =>
              st !== null
          );

        return {
          id: ft.id,
          name: ft.name,
          code: ft.code,
          angle: ft.angle,
          simTypes: configSimTypes,
        };
      });
    },
    [conditionConfigs, foldTypes, simTypes]
  );

  const conditionTree = useMemo<FoldTypeWithSimTypes[]>(() => {
    if (!foldTypes.length || !simTypes.length || conditionConfigsLoading) return [];
    return buildFoldTypeTree(conditionConfigs);
  }, [
    buildFoldTypeTree,
    conditionConfigs,
    conditionConfigsLoading,
    foldTypes.length,
    simTypes.length,
  ]);

  // 当前选中姿态的仿真类型（支持多姿态，含 conditionId）
  const safeSimTypes = useMemo(() => {
    if (foldTypeIds.length === 0) return [];
    // 合并所有选中姿态的仿真类型（保留 conditionId）
    const allSimTypes: Array<
      SimType & { isDefault: boolean; relSort: number; conditionId: number }
    > = [];
    foldTypeIds.forEach(ftId => {
      const foldTypeData = conditionTree.find(ft => ft.id === ftId);
      if (foldTypeData) {
        foldTypeData.simTypes.forEach(st => {
          // 注意：同一 simTypeId 在不同姿态下有不同 conditionId，所以用 conditionId 去重
          if (!allSimTypes.some(s => s.conditionId === st.conditionId)) {
            allSimTypes.push(st);
          }
        });
      }
    });
    return allSimTypes;
  }, [foldTypeIds, conditionTree]);

  const safeFoldTypes = useMemo(() => foldTypes || [], [foldTypes]);
  const safeSolvers = useMemo(() => solvers || [], [solvers]);
  const safeParamDefs = useMemo(() => paramDefs || [], [paramDefs]);
  const safeOutputDefs = useMemo(() => outputDefs || [], [outputDefs]);
  const safeConditionDefs = useMemo(() => conditionDefs || [], [conditionDefs]);
  const safeParamGroups = useMemo(() => paramGroups || [], [paramGroups]);
  const safeOutputSets = useMemo(() => outputSets || [], [outputSets]);
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

  const resolveGroupAlgorithmType = (algType?: number) => {
    if (algType === AlgorithmType.BAYESIAN || algType === AlgorithmType.DOE_FILE) {
      return algType;
    }
    return AlgorithmType.DOE;
  };

  const toCamelKey = useCallback(
    (key: string) => key.replace(/_([a-zA-Z])/g, (_, ch: string) => ch.toUpperCase()),
    []
  );

  const normalizeDoeDataByHeads = useCallback(
    (
      heads: string[],
      rows: Array<Record<string, number | string>>
    ): Array<Record<string, number | string>> =>
      rows.map(row => {
        const normalized: Record<string, number | string> = {};
        heads.forEach(head => {
          if (row[head] !== undefined) {
            normalized[head] = row[head];
          } else if (row[toCamelKey(head)] !== undefined) {
            normalized[head] = row[toCamelKey(head)];
          } else {
            normalized[head] = '';
          }
        });
        return normalized;
      }),
    [toCamelKey]
  );

  // 初始化仿真类型配置（以 conditionId 为 key）
  const initSimTypeConfig = useCallback(
    (conditionId: number, simTypeId: number, foldTypeId: number) => {
      const simType = simTypes.find(st => st.id === simTypeId);
      if (!simType) return;

      // 尝试获取工况配置
      const conditionConfig = getConditionConfig(foldTypeId, simTypeId);

      // 优先使用工况配置的默认值，否则使用仿真类型的默认值
      const defaultParamGroupId =
        conditionConfig?.defaultParamGroupId || simType.defaultParamGroupId;
      const defaultOutputGroupId =
        conditionConfig?.defaultOutputGroupId || simType.defaultOutputGroupId;
      const defaultSolverId = conditionConfig?.defaultSolverId || simType.defaultSolverId;

      const defaultSolver = safeSolvers.find(s => s.id === defaultSolverId) || safeSolvers[0];
      const defaultParamGroup = safeParamGroups.find(g => g.id === defaultParamGroupId);
      const defaultAlgType = resolveGroupAlgorithmType(defaultParamGroup?.algType);

      setSimTypeConfigs(prev => ({
        ...prev,
        [conditionId]: {
          conditionId,
          foldTypeId,
          simTypeId,
          params: {
            mode: 'template',
            templateSetId: defaultParamGroupId || null,
            templateItemId: null,
            algorithm: defaultAlgType === AlgorithmType.BAYESIAN ? 'bayesian' : 'doe',
            customValues: {},
            optParams: {
              algType: defaultAlgType,
              domain: [],
              doeParamHeads:
                defaultAlgType === AlgorithmType.DOE_FILE
                  ? defaultParamGroup?.doeFileHeads || []
                  : [],
              doeParamData:
                defaultAlgType === AlgorithmType.DOE_FILE
                  ? normalizeDoeDataByHeads(
                      defaultParamGroup?.doeFileHeads || [],
                      defaultParamGroup?.doeFileData || []
                    )
                  : [],
              doeParamCsvPath:
                defaultAlgType === AlgorithmType.DOE_FILE
                  ? defaultParamGroup?.doeFileName || undefined
                  : undefined,
              batchSize: [{ value: 5 }],
              maxIter: 1,
            },
          },
          output: {
            mode: 'template',
            outputSetId: defaultOutputGroupId || null,
            selectedConditionIds: [],
            conditionValues: {},
            selectedOutputIds: [],
          },
          solver: {
            solverId: defaultSolver?.id || 1,
            solverVersion: defaultSolver?.version || '2024',
            cpuType: 1,
            cpuCores: defaultSolver?.cpuCoreDefault || 16,
            double: 0,
            applyGlobal: null,
            useGlobalConfig: 0,
            resourceId: null,
          },
          careDeviceIds: [],
          conditionRemark: '',
        },
      }));
    },
    [simTypes, safeSolvers, safeParamGroups, getConditionConfig, normalizeDoeDataByHeads]
  );

  const paramGroupPrefillRef = useRef<Set<string>>(new Set());
  const outputGroupPrefillRef = useRef<Set<string>>(new Set());

  const buildDoeCombinations = useCallback((domain: ParamDomain[]): Partial<OptParams> => {
    const heads = domain.map(d => d.paramName.trim()).filter(Boolean);
    if (heads.length !== domain.length) return {};

    const valueLists = domain.map(d => {
      if (d.rangeList && d.rangeList.length > 0) return d.rangeList;
      if (d.range) {
        return d.range
          .split(',')
          .map(v => Number(v.trim()))
          .filter(v => !isNaN(v));
      }
      return [];
    });
    if (valueLists.some(list => list.length === 0)) return {};

    const cartesian = (...arrays: number[][]): number[][] =>
      arrays.reduce<number[][]>((acc, arr) => acc.flatMap(x => arr.map(y => [...x, y])), [[]]);
    const combinations = cartesian(...valueLists);

    const doeParamData: Record<string, number | string>[] = combinations.map(combo => {
      const row: Record<string, number | string> = {};
      heads.forEach((h, i) => {
        row[h] = combo[i];
      });
      return row;
    });

    return { doeParamHeads: heads, doeParamData };
  }, []);

  useEffect(() => {
    selectedSimTypes.forEach(item => {
      const config = simTypeConfigs[item.conditionId];
      if (!config) return;

      const templateSetId = config.params.templateSetId;
      const domain = config.params.optParams?.domain || [];
      if (config.params.mode === 'template' && templateSetId && domain.length === 0) {
        const prefillKey = `${item.conditionId}:${templateSetId}`;
        if (!paramGroupPrefillRef.current.has(prefillKey)) {
          paramGroupPrefillRef.current.add(prefillKey);
          void (async () => {
            try {
              const params = await paramGroupsApi.getParamGroupParams(templateSetId);
              const groupParams = (params.data as ParamInGroup[]) || [];
              if (groupParams.length === 0) return;

              const groupMeta = safeParamGroups.find(g => g.id === templateSetId);
              const groupAlgType = resolveGroupAlgorithmType(groupMeta?.algType);

              const nextDomain: ParamDomain[] = groupParams.map(p => {
                const paramDef = paramDefs.find(def => def.id === p.paramDefId);
                const defaultValStr = p.defaultValue || paramDef?.defaultVal || '';
                const defaultVal = parseFloat(defaultValStr);
                const enumStr = p.enumValues || '';
                const rangeStr = enumStr.trim().length > 0 ? enumStr : defaultValStr;
                const rangeList = rangeStr
                  .split(',')
                  .map(v => Number(v.trim()))
                  .filter(v => !isNaN(v));

                return {
                  paramName: paramDef?.key || p.paramKey || p.paramName || '',
                  minValue: p.minVal ?? paramDef?.minVal ?? 0,
                  maxValue: p.maxVal ?? paramDef?.maxVal ?? 100,
                  initValue: isNaN(defaultVal) ? 50 : defaultVal,
                  range: rangeStr,
                  rangeList,
                };
              });

              setSimTypeConfigs(prev => {
                const current = prev[item.conditionId];
                if (!current) return prev;
                if ((current.params.optParams?.domain || []).length > 0) return prev;

                const baseOpt: OptParams = current.params.optParams || {
                  algType: groupAlgType,
                  domain: [],
                  batchSize: [{ value: 5 }],
                  maxIter: 1,
                };
                const finalAlgType = baseOpt.algType ?? groupAlgType;
                const doeExtras =
                  finalAlgType === AlgorithmType.DOE ? buildDoeCombinations(nextDomain) : {};
                const doeFileExtras =
                  finalAlgType === AlgorithmType.DOE_FILE
                    ? {
                        doeParamHeads: groupMeta?.doeFileHeads || [],
                        doeParamData: normalizeDoeDataByHeads(
                          groupMeta?.doeFileHeads || [],
                          groupMeta?.doeFileData || []
                        ),
                        doeParamCsvPath: groupMeta?.doeFileName || undefined,
                      }
                    : {};

                return {
                  ...prev,
                  [item.conditionId]: {
                    ...current,
                    params: {
                      ...current.params,
                      algorithm: finalAlgType === AlgorithmType.BAYESIAN ? 'bayesian' : 'doe',
                      optParams: {
                        ...baseOpt,
                        algType: finalAlgType,
                        domain: nextDomain,
                        ...doeExtras,
                        ...doeFileExtras,
                      },
                    },
                  },
                };
              });
            } catch (error) {
              console.error('自动加载参数组失败:', error);
            }
          })();
        }
      }

      const outputSetId = config.output.outputSetId;
      const respDetails = config.output.respDetails || [];
      if (config.output.mode === 'template' && outputSetId && respDetails.length === 0) {
        const prefillKey = `${item.conditionId}:${outputSetId}`;
        if (!outputGroupPrefillRef.current.has(prefillKey)) {
          outputGroupPrefillRef.current.add(prefillKey);
          void (async () => {
            try {
              const outputs = await outputGroupsApi.getOutputGroupOutputs(outputSetId);
              const groupOutputs = (outputs.data as OutputInGroup[]) || [];
              if (groupOutputs.length === 0) return;

              const mapTargetType = (value?: number): TargetType => {
                if (value === 1) return TargetType.MAX;
                if (value === 2) return TargetType.MIN;
                if (value === 3) return TargetType.TARGET;
                return TargetType.MAX;
              };

              const nextRespDetails: RespDetail[] = groupOutputs.map(o => ({
                set: o.setName || 'push',
                outputType: o.outputCode || 'RF3',
                component: o.component || '18',
                integrationPoint: o.sectionPoint || undefined,
                stepName: o.stepName || undefined,
                specialOutputSet: o.specialOutputSet || undefined,
                description: o.description || o.outputName || '',
                lowerLimit: o.lowerLimit ?? null,
                upperLimit: o.upperLimit ?? null,
                weight: o.weight ?? 1,
                multiple: o.multiple ?? 1,
                targetValue: o.targetValue ?? null,
                targetType: mapTargetType(o.targetType),
              }));

              setSimTypeConfigs(prev => {
                const current = prev[item.conditionId];
                if (!current) return prev;
                if ((current.output.respDetails || []).length > 0) return prev;
                return {
                  ...prev,
                  [item.conditionId]: {
                    ...current,
                    output: {
                      ...current.output,
                      respDetails: nextRespDetails,
                    },
                  },
                };
              });
            } catch (error) {
              console.error('自动加载输出组失败:', error);
            }
          })();
        }
      }
    });
  }, [
    selectedSimTypes,
    simTypeConfigs,
    paramDefs,
    safeParamGroups,
    buildDoeCombinations,
    normalizeDoeDataByHeads,
  ]);

  // 初始化默认选中的仿真类型
  // 当姿态变化时：1. 移除被取消姿态的仿真类型 2. 为新增姿态自动选择默认仿真类型
  useEffect(() => {
    if (foldTypeIds.length === 0 || conditionTree.length === 0) return;

    // 清理已移除姿态的"用户清空"记录
    userClearedFoldTypeIds.current.forEach(ftId => {
      if (!foldTypeIds.includes(ftId)) {
        userClearedFoldTypeIds.current.delete(ftId);
      }
    });

    setSelectedSimTypes(prev => {
      // 过滤掉所属姿态被取消选择的项
      const validPrev = prev.filter(item => foldTypeIds.includes(item.foldTypeId));

      // 找出已有选择的姿态ID
      const existingFoldTypeIds = new Set(validPrev.map(item => item.foldTypeId));

      // 找出需要初始化默认仿真类型的姿态
      // 排除：1. 已有仿真类型选择的姿态 2. 用户主动清空过的姿态
      const foldTypeIdsNeedingDefaults = foldTypeIds.filter(
        ftId => !existingFoldTypeIds.has(ftId) && !userClearedFoldTypeIds.current.has(ftId)
      );

      // 如果没有需要初始化的姿态，直接返回
      if (foldTypeIdsNeedingDefaults.length === 0) {
        return prev.length === validPrev.length ? prev : validPrev;
      }

      // 为需要初始化的姿态添加默认仿真类型（含 conditionId）
      const newDefaults: SelectedSimType[] = [];
      foldTypeIdsNeedingDefaults.forEach(ftId => {
        const foldTypeData = conditionTree.find(ft => ft.id === ftId);
        if (!foldTypeData?.simTypes.length) return;

        // 优先使用标记为默认的仿真类型
        const defaultSts = foldTypeData.simTypes.filter(st => st.isDefault);
        if (defaultSts.length > 0) {
          defaultSts.forEach(st => {
            newDefaults.push({ conditionId: st.conditionId, foldTypeId: ftId, simTypeId: st.id });
          });
        } else {
          // 如果没有标记为默认的，则选择该姿态下的第一个仿真类型
          const first = foldTypeData.simTypes[0];
          newDefaults.push({
            conditionId: first.conditionId,
            foldTypeId: ftId,
            simTypeId: first.id,
          });
        }
      });

      if (newDefaults.length === 0) {
        return prev.length === validPrev.length ? prev : validPrev;
      }

      return [...validPrev, ...newDefaults];
    });
  }, [foldTypeIds, conditionTree]);

  // 为新选中的仿真类型初始化配置
  // 使用 useRef 跟踪已初始化的 conditionId，避免依赖 simTypeConfigs 导致无限循环
  const initializedConditionIds = useRef<Set<number>>(new Set());

  // 标记工况为已初始化（用于加载草稿时跳过默认初始化）
  const markConditionIdsAsInitialized = useCallback((ids: number[]) => {
    ids.forEach(id => initializedConditionIds.current.add(id));
  }, []);

  // 清除所有已初始化标记（重置时使用）
  const clearInitializedConditionIds = useCallback(() => {
    initializedConditionIds.current.clear();
  }, []);

  const clearUserClearedFoldTypeIds = useCallback(() => {
    userClearedFoldTypeIds.current.clear();
  }, []);

  const getDefaultSelections = useCallback(
    (nextConditionConfigs: ConditionConfig[] = conditionConfigs) => {
      const tree = buildFoldTypeTree(nextConditionConfigs);
      const selected = tree.flatMap(ft =>
        ft.simTypes
          .filter(st => st.isDefault)
          .map(st => ({ conditionId: st.conditionId, foldTypeId: ft.id, simTypeId: st.id }))
      );
      const foldTypeIds = [...new Set(selected.map(item => item.foldTypeId))];
      return { selectedSimTypes: selected, foldTypeIds };
    },
    [buildFoldTypeTree, conditionConfigs]
  );

  useEffect(() => {
    selectedSimTypes.forEach(item => {
      if (!initializedConditionIds.current.has(item.conditionId)) {
        initializedConditionIds.current.add(item.conditionId);
        initSimTypeConfig(item.conditionId, item.simTypeId, item.foldTypeId);
      }
    });
  }, [selectedSimTypes, initSimTypeConfig]);

  // 切换仿真类型选择（需要同时传入 conditionId、姿态ID和仿真类型ID）
  // 返回值：
  //   - 正数：该姿态下所有仿真类型都被取消，返回需要取消的姿态ID
  //   - null：正常切换，无需额外操作
  //   - -1：这是最后一个仿真类型，不允许取消
  const toggleSimType = useCallback(
    (
      conditionId: number,
      foldTypeId: number,
      simTypeId: number,
      currentFoldTypeIds: number[]
    ): number | null => {
      // 先同步计算结果，再更新状态
      const currentSelectedSimTypes = selectedSimTypes;
      const existingIndex = currentSelectedSimTypes.findIndex(
        item => item.conditionId === conditionId
      );

      if (existingIndex >= 0) {
        // 已选中，尝试取消选择
        const newList = currentSelectedSimTypes.filter((_, idx) => idx !== existingIndex);

        // 检查取消后是否还有任何仿真类型被选中
        if (newList.length === 0) {
          // 这是最后一个仿真类型，不允许取消
          return -1;
        }

        // 检查取消后该姿态下是否还有其他仿真类型被选中
        const remainingForFoldType = newList.filter(item => item.foldTypeId === foldTypeId);

        if (remainingForFoldType.length === 0) {
          // 该姿态下没有仿真类型了
          // 检查是否还有其他姿态被选中
          const otherFoldTypeIds = currentFoldTypeIds.filter(id => id !== foldTypeId);
          if (otherFoldTypeIds.length === 0) {
            // 没有其他姿态，不允许取消
            return -1;
          }
          // 有其他姿态，记录用户主动清空了该姿态的仿真类型
          userClearedFoldTypeIds.current.add(foldTypeId);
          // 更新状态并标记需要取消该姿态
          setSelectedSimTypes(newList);
          return foldTypeId;
        }

        // 正常取消
        setSelectedSimTypes(newList);
        return null;
      } else {
        // 未选中，添加选择
        if (!simTypeConfigs[conditionId]) {
          initSimTypeConfig(conditionId, simTypeId, foldTypeId);
        }
        setSelectedSimTypes([...currentSelectedSimTypes, { conditionId, foldTypeId, simTypeId }]);
        return null;
      }
    },
    [selectedSimTypes, simTypeConfigs, initSimTypeConfig]
  );

  // 更新仿真类型配置（以 conditionId 为 key）
  const updateSimTypeConfig = useCallback(
    (conditionId: number, updates: Partial<SimTypeConfig>) => {
      setSimTypeConfigs(prev => ({
        ...prev,
        [conditionId]: { ...prev[conditionId], ...updates },
      }));
    },
    []
  );

  // 更新求解器配置（以 conditionId 为 key）
  const updateSolverConfig = useCallback((conditionId: number, updates: Partial<SolverConfig>) => {
    setSimTypeConfigs(prev => ({
      ...prev,
      [conditionId]: {
        ...prev[conditionId],
        solver: { ...prev[conditionId].solver, ...updates },
      },
    }));
  }, []);

  // 应用求解器配置到所有仿真类型
  const applySolverToAll = useCallback(
    (updates: Partial<SolverConfig>) => {
      selectedSimTypes.forEach(item => {
        updateSolverConfig(item.conditionId, updates);
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
    if (conditionTree.length === 0) return 300;

    // 计算所有姿态的总仿真类型数量
    const totalSimTypes = conditionTree.reduce(
      (sum, ft) => sum + Math.max(ft.simTypes.length, 1),
      0
    );
    // 姿态之间的间隙数量
    const foldTypeGaps = Math.max(conditionTree.length - 1, 0);

    // 总高度 = 仿真类型数量 * 间距 + 姿态间隙
    const startY = 100;
    const simTypeSpacing = 240; // 与 CANVAS_LAYOUT.SIM_TYPE_VERTICAL_SPACING 保持一致
    const foldTypeGap = 60; // 与 CANVAS_LAYOUT.FOLD_TYPE_GAP 保持一致

    const totalHeight = (totalSimTypes - 1) * simTypeSpacing + foldTypeGaps * foldTypeGap;

    return startY + totalHeight / 2;
  }, [conditionTree]);

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
  const retryConfig = () => {
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
  };

  const refreshSubmissionConfig = useCallback(async () => {
    const conditionConfigsResult = await refetchConditionConfigs();
    return {
      conditionConfigs: conditionConfigsResult.data ?? conditionConfigs,
    };
  }, [conditionConfigs, refetchConditionConfigs]);

  // 获取参数组的参数详情
  const fetchParamGroupParams = useCallback(async (groupId: number): Promise<ParamInGroup[]> => {
    try {
      const response = await paramGroupsApi.getParamGroupParams(groupId);
      return (response.data as ParamInGroup[]) || [];
    } catch (error) {
      console.error('获取参数组详情失败:', error);
      return [];
    }
  }, []);

  // 获取输出组的输出详情
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
    // 配置数据
    projects: projects || [],
    users,
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
    isConfigLoading,
    configError,
    retryConfig,
    refreshSubmissionConfig,
    getDefaultSelections,
    // 画布状态
    transform,
    setTransform,
    isDragging,
    setIsDragging,
    startPan,
    setStartPan,
    // 仿真类型与配置状态
    selectedSimTypes,
    setSelectedSimTypes,
    simTypeConfigs,
    setSimTypeConfigs,
    globalSolver,
    setGlobalSolver,
    // UI状态
    isDrawerOpen,
    setIsDrawerOpen,
    drawerMode,
    setDrawerMode,
    activeSimTypeId,
    setActiveSimTypeId,
    activeFoldTypeId,
    setActiveFoldTypeId,
    activeConditionId,
    setActiveConditionId,
    // 方法
    toggleSimType,
    updateSimTypeConfig,
    updateSolverConfig,
    applySolverToAll,
    getSimTypeNodeY,
    getProjectNodeY,
    getConditionConfig,
    fetchParamGroupParams,
    fetchOutputGroupOutputs,
    markConditionIdsAsInitialized,
    clearInitializedConditionIds,
    clearUserClearedFoldTypeIds,
  };
};
