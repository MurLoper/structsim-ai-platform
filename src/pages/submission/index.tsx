import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useUIStore, useAuthStore } from '@/stores';
import { RESOURCES } from '@/locales';
import { Button, useToast, useConfirmDialog } from '@/components/ui';
import { ordersApi } from '@/api';
import { queryClient, queryKeys } from '@/lib/queryClient';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCareDevices } from '@/features/config/queries';
import {
  FolderIcon,
  CubeIcon,
  DevicePhoneMobileIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline';

import { useSubmissionState, useCanvasInteraction } from './hooks';
import {
  submissionFormSchema,
  type SubmissionFormValues,
  type InpSetInfo,
  type SimTypeConfig,
  type GlobalSolverConfig,
} from './types';
import { saveDraft, loadDraft, clearDraft } from './utils/draftStorage';
import {
  CanvasNode,
  ConnectionLine,
  ConfigDrawer,
  ProjectDrawerContent,
  ParamsDrawerContent,
  OutputDrawerContent,
  SolverDrawerContent,
  CareDevicesDrawerContent,
  SimTypeConfigBox,
} from './components';
import { CANVAS_LAYOUT } from '@/constants/submission';

const DRAFT_SCOPE_SESSION_KEY = 'submission_draft_scope_id';
const PROJECT_HABIT_STORAGE_KEY = 'submission_project_habits';

const toNumber = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const DEFAULT_GLOBAL_SOLVER: GlobalSolverConfig = {
  solverId: 1,
  solverVersion: '2024',
  cpuType: 1,
  cpuCores: 16,
  double: 0,
  applyGlobal: null,
  useGlobalConfig: 0,
  resourceId: null,
  applyToAll: true,
};

// 资源池最终将由外部接口返回“用户可用资源池 + 默认资源池”。
// 当前开发环境先沿用本地配置数据，接口联通后直接替换这里的数据来源。
const MOCK_RESOURCE_POOLS = [
  {
    id: 1,
    name: '标准节点',
    code: 'STD',
    description: '标准计算节点',
    cpuCores: 16,
    memoryGb: 64,
    valid: 1,
    sort: 10,
  },
  {
    id: 2,
    name: '大内存节点',
    code: 'MEM',
    description: '高内存计算节点',
    cpuCores: 32,
    memoryGb: 256,
    valid: 1,
    sort: 20,
  },
  {
    id: 3,
    name: 'GPU节点',
    code: 'GPU',
    description: 'GPU 计算节点',
    cpuCores: 16,
    memoryGb: 128,
    valid: 1,
    sort: 30,
  },
];

const toSafeInt = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
};

const estimateRoundsFromOptParams = (optParams: Record<string, unknown> | undefined): number => {
  if (!optParams) return 0;

  const algType = toSafeInt(optParams.algType, 2);

  if (algType === 2 || algType === 5) {
    const doeData = Array.isArray(optParams.doeParamData) ? optParams.doeParamData : [];
    return doeData.length;
  }

  if (algType !== 1) return 0;

  const batchSizeType = toSafeInt(optParams.batchSizeType, 1);
  const maxIter = Math.max(toSafeInt(optParams.maxIter, 1), 0);

  if (batchSizeType === 2) {
    const custom = Array.isArray(optParams.customBatchSize) ? optParams.customBatchSize : [];
    let total = 0;
    for (let idx = 1; idx <= maxIter; idx += 1) {
      let value = 0;
      for (const item of custom) {
        const row = item as Record<string, unknown>;
        const start = toSafeInt(row.startIndex, 0);
        const end = toSafeInt(row.endIndex, 0);
        if (start <= idx && idx <= end) {
          value = Math.max(toSafeInt(row.value, 0), 0);
          break;
        }
      }
      total += value;
    }
    return total;
  }

  const batchSize = Array.isArray(optParams.batchSize) ? optParams.batchSize : [];
  const values = batchSize.map(item => {
    const row = item as Record<string, unknown>;
    return Math.max(toSafeInt(row.value, 0), 0);
  });

  if (maxIter <= 0 || values.length === 0) return 0;
  if (values.length >= maxIter) return values.slice(0, maxIter).reduce((a, b) => a + b, 0);
  if (values.length === 1) return values[0] * maxIter;
  return values.reduce((a, b) => a + b, 0) + values[values.length - 1] * (maxIter - values.length);
};

const estimateRoundsFromConditions = (conditions: Array<Record<string, unknown>>): number => {
  return conditions.reduce((total, cond) => {
    const params = cond.params as Record<string, unknown> | undefined;
    const optParams = params?.optParams as Record<string, unknown> | undefined;
    return total + estimateRoundsFromOptParams(optParams);
  }, 0);
};

export interface SubmissionProps {
  orderId?: number;
  onClose?: () => void;
}

const Submission: React.FC<SubmissionProps> = ({ orderId: propOrderId, onClose }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useUIStore();
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const { showConfirm, ConfirmDialogComponent } = useConfirmDialog();
  const t = (key: string) => RESOURCES[language][key] || key;
  const containerRef = useRef<HTMLDivElement>(null);

  // 获取关注器件配置数据
  const { data: configCareDevices = [] } = useCareDevices();

  // 编辑模式：从 URL 获取申请单 ID
  const urlOrderId = searchParams.get('orderId') ? Number(searchParams.get('orderId')) : null;
  const orderId = propOrderId !== undefined ? propOrderId : urlOrderId;
  const isEditMode = orderId !== null;
  const hasInitializedRef = useRef(false);
  const isLoadingDraftRef = useRef(false); // 防止加载草稿期间保存空数据
  const draftScopeIdRef = useRef('');
  if (!draftScopeIdRef.current) {
    const exist = sessionStorage.getItem(DRAFT_SCOPE_SESSION_KEY);
    if (exist) {
      draftScopeIdRef.current = exist;
    } else {
      const next = `tab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(DRAFT_SCOPE_SESSION_KEY, next);
      draftScopeIdRef.current = next;
    }
  }

  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionFormSchema),
    defaultValues: {
      projectId: null as unknown as number,
      issueTitle: '',
      modelLevelId: 1,
      originFile: { type: 1, path: '', name: '', verified: false },
      originFoldTypeId: null,
      participantIds: [],
      foldTypeIds: [],
      remark: '',
      simTypeIds: [],
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  });

  const selectedProjectId = useWatch({ control: form.control, name: 'projectId' }) ?? null;
  const originFile = useWatch({ control: form.control, name: 'originFile' }) ?? {
    type: 1,
    path: '',
    name: '',
  };
  const originFoldTypeId = useWatch({ control: form.control, name: 'originFoldTypeId' });
  const modelLevelId = useWatch({ control: form.control, name: 'modelLevelId' }) ?? 1;
  const participantIds = useWatch({ control: form.control, name: 'participantIds' }) ?? [];
  const rawFoldTypeIds = useWatch({ control: form.control, name: 'foldTypeIds' });
  const foldTypeIds = useMemo(() => rawFoldTypeIds ?? [], [rawFoldTypeIds]);
  const simTypeError = form.formState.errors.simTypeIds?.message;
  const isSubmitted = form.formState.isSubmitted;
  const showSimTypeError = isSubmitted ? simTypeError : undefined;

  // 使用自定义 hooks
  const state = useSubmissionState(selectedProjectId, foldTypeIds);
  const canvas = useCanvasInteraction({
    transform: state.transform,
    setTransform: state.setTransform,
    isDragging: state.isDragging,
    setIsDragging: state.setIsDragging,
    startPan: state.startPan,
    setStartPan: state.setStartPan,
  });
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // INP 文件解析出的 set 集合（用于关注器件选择）
  const [inpSets, setInpSets] = useState<InpSetInfo[]>([]);

  // 编辑模式：加载申请单详情
  const { data: orderDetail } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getOrder(orderId!),
    enabled: isEditMode && orderId !== null,
  });

  const { data: submitLimitsResp } = useQuery({
    queryKey: ['orders', 'submitLimits', user?.domainAccount || user?.id || 'anonymous'],
    queryFn: () => ordersApi.getSubmitLimits(),
    enabled: !!(user?.domainAccount || user?.id),
    staleTime: 60 * 1000,
  });

  const submitLimits = submitLimitsResp?.data;

  const getProjectHabitIds = useCallback((): number[] => {
    const userKey = user?.domainAccount || user?.id || '';
    if (!userKey) return [];
    try {
      const raw = localStorage.getItem(PROJECT_HABIT_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Record<string, number[]>;
      return Array.isArray(parsed?.[userKey]) ? parsed[userKey] : [];
    } catch {
      return [];
    }
  }, [user?.domainAccount, user?.id]);

  const getPreferredProjectId = useCallback((): number | null => {
    const projects = state.projects || [];
    if (projects.length === 0) return null;
    const preferredIds = getProjectHabitIds();
    for (const id of preferredIds) {
      if (projects.some(p => p.id === id)) return id;
    }
    return projects[0].id;
  }, [getProjectHabitIds, state.projects]);

  const updateProjectHabit = useCallback(
    (projectId: number | null | undefined) => {
      const userKey = user?.domainAccount || user?.id || '';
      if (!userKey || projectId == null) return;
      try {
        const raw = localStorage.getItem(PROJECT_HABIT_STORAGE_KEY);
        const parsed = raw ? (JSON.parse(raw) as Record<string, number[]>) : {};
        const current = Array.isArray(parsed[userKey]) ? parsed[userKey] : [];
        parsed[userKey] = [projectId, ...current.filter(id => id !== projectId)].slice(0, 10);
        localStorage.setItem(PROJECT_HABIT_STORAGE_KEY, JSON.stringify(parsed));
      } catch {
        // ignore
      }
    },
    [user?.domainAccount, user?.id]
  );

  const defaultFormValues = useMemo<SubmissionFormValues>(
    () => ({
      projectId: (getPreferredProjectId() as unknown as number) ?? (null as unknown as number),
      issueTitle: '',
      modelLevelId: 1,
      originFile: { type: 1, path: '', name: '', verified: false },
      originFoldTypeId: null,
      participantIds: [],
      foldTypeIds: [],
      remark: '',
      simTypeIds: [],
    }),
    [getPreferredProjectId]
  );

  const conditionOrderMap = useMemo(() => {
    const selectedConditionIds = new Set(state.selectedSimTypes.map(item => item.conditionId));
    const orderMap = new Map<number, number>();
    let order = 1;

    state.foldTypesWithSimTypes.forEach(foldTypeData => {
      if (!foldTypeIds.includes(foldTypeData.id)) {
        return;
      }
      foldTypeData.simTypes.forEach(simType => {
        if (!selectedConditionIds.has(simType.conditionId)) {
          return;
        }
        orderMap.set(simType.conditionId, order);
        order += 1;
      });
    });

    return orderMap;
  }, [foldTypeIds, state.foldTypesWithSimTypes, state.selectedSimTypes]);

  const applyNewEntryDefaults = useCallback(
    (
      defaults: {
        selectedSimTypes: Array<{ conditionId: number; foldTypeId: number; simTypeId: number }>;
        foldTypeIds: number[];
      } = state.getDefaultSelections()
    ) => {
      const simTypeIds = [...new Set(defaults.selectedSimTypes.map(item => item.simTypeId))];
      state.clearUserClearedFoldTypeIds();
      state.clearInitializedConditionIds();
      form.reset({
        ...defaultFormValues,
        foldTypeIds: defaults.foldTypeIds,
        simTypeIds,
      });
      state.setSelectedSimTypes(defaults.selectedSimTypes);
      state.setSimTypeConfigs({});
      state.setGlobalSolver(DEFAULT_GLOBAL_SOLVER);
      setInpSets([]);
    },
    [defaultFormValues, form, state]
  );

  const resetToLatestDefaults = useCallback(async () => {
    const latest = await state.refreshSubmissionConfig();
    applyNewEntryDefaults(state.getDefaultSelections(latest.conditionConfigs));
  }, [applyNewEntryDefaults, state]);

  const findConditionId = useCallback(
    (foldTypeId: number, simTypeId: number) => {
      return (
        state.foldTypesWithSimTypes
          .find(ft => ft.id === foldTypeId)
          ?.simTypes.find(st => st.id === simTypeId)?.conditionId ?? null
      );
    },
    [state.foldTypesWithSimTypes]
  );

  const restoreOrderSnapshot = useCallback(
    (order: Record<string, unknown>) => {
      const rawInput = order.inputJson ?? order.input_json;
      const inputJson =
        typeof rawInput === 'string'
          ? ((JSON.parse(rawInput) as Record<string, unknown>) ?? {})
          : ((rawInput as Record<string, unknown>) ?? {});

      const projectInfo =
        ((inputJson.projectInfo || inputJson.project_info) as Record<string, unknown>) ?? {};
      const rawConditions = inputJson.conditions;
      const conditions = Array.isArray(rawConditions)
        ? rawConditions
        : rawConditions && typeof rawConditions === 'object'
          ? Object.values(rawConditions as Record<string, unknown>)
          : [];

      const foldTypeIdsFromInput = conditions
        .map(c =>
          toNumber(
            (c as Record<string, unknown>).foldTypeId ?? (c as Record<string, unknown>).fold_type_id
          )
        )
        .filter((n): n is number => n != null);
      const simTypeIdsFromInput = conditions
        .map(c =>
          toNumber(
            (c as Record<string, unknown>).simTypeId ?? (c as Record<string, unknown>).sim_type_id
          )
        )
        .filter((n): n is number => n != null);

      const foldTypeIds =
        (Array.isArray(order.foldTypeIds) ? order.foldTypeIds : order.fold_type_ids) ??
        foldTypeIdsFromInput;
      const simTypeIds =
        (Array.isArray(order.simTypeIds) ? order.simTypeIds : order.sim_type_ids) ??
        simTypeIdsFromInput;

      form.reset({
        projectId: toNumber(order.projectId ?? order.project_id) as unknown as number,
        issueTitle: String(projectInfo.issueTitle ?? projectInfo.issue_title ?? ''),
        modelLevelId: toNumber(order.modelLevelId ?? order.model_level_id) ?? 1,
        originFile: {
          type:
            toNumber(
              order.originFileType ??
                order.origin_file_type ??
                (order.originFile as Record<string, unknown> | undefined)?.type
            ) ?? 1,
          path: String(
            (order.originFile as Record<string, unknown> | undefined)?.path ??
              order.originFilePath ??
              order.origin_file_path ??
              ''
          ),
          name: String(
            (order.originFile as Record<string, unknown> | undefined)?.name ??
              order.originFileName ??
              order.origin_file_name ??
              ''
          ),
          verified: true,
        },
        originFoldTypeId: toNumber(order.originFoldTypeId ?? order.origin_fold_type_id),
        participantIds: Array.isArray(order.participantIds)
          ? (order.participantIds as string[])
          : [],
        foldTypeIds: Array.isArray(foldTypeIds) ? (foldTypeIds as number[]) : [],
        remark: String(order.remark ?? projectInfo.remark ?? ''),
        simTypeIds: Array.isArray(simTypeIds) ? (simTypeIds as number[]) : [],
      });

      const selected: Array<{ conditionId: number; foldTypeId: number; simTypeId: number }> = [];
      const configs: Record<number, SimTypeConfig> = {};
      const initializedConditionIds: number[] = [];

      if (conditions.length > 0) {
        conditions.forEach(item => {
          const c = item as Record<string, unknown>;
          const foldTypeId = toNumber(c.foldTypeId ?? c.fold_type_id);
          const simTypeId = toNumber(c.simTypeId ?? c.sim_type_id);
          if (foldTypeId == null || simTypeId == null) return;
          const conditionId =
            toNumber(c.conditionId ?? c.condition_id) ?? findConditionId(foldTypeId, simTypeId);
          if (conditionId == null) return;
          selected.push({ conditionId, foldTypeId, simTypeId });

          if (c.params && c.output && c.solver) {
            configs[conditionId] = {
              conditionId,
              foldTypeId,
              simTypeId,
              params: c.params as SimTypeConfig['params'],
              output: c.output as SimTypeConfig['output'],
              solver: c.solver as SimTypeConfig['solver'],
              careDeviceIds: Array.isArray(c.careDeviceIds)
                ? (c.careDeviceIds as string[])
                : Array.isArray(c.care_device_ids)
                  ? (c.care_device_ids as string[])
                  : [],
              conditionRemark:
                typeof c.remark === 'string'
                  ? c.remark
                  : typeof c.conditionRemark === 'string'
                    ? c.conditionRemark
                    : typeof c.condition_remark === 'string'
                      ? c.condition_remark
                      : '',
            };
            initializedConditionIds.push(conditionId);
          }
        });
      } else if (order.optParam && typeof order.optParam === 'object') {
        const legacyOpt = order.optParam as Record<string, unknown>;
        const foldIds = Array.isArray(foldTypeIds) ? (foldTypeIds as number[]) : [];
        const simIds = Array.isArray(simTypeIds) ? (simTypeIds as number[]) : [];
        foldIds.forEach(foldTypeId => {
          simIds.forEach(simTypeId => {
            const conditionId = findConditionId(foldTypeId, simTypeId);
            if (conditionId == null) return;
            selected.push({ conditionId, foldTypeId, simTypeId });
            const oldCfg = legacyOpt[String(simTypeId)] as Record<string, unknown> | undefined;
            if (oldCfg) {
              configs[conditionId] = {
                conditionId,
                foldTypeId,
                simTypeId,
                params: (oldCfg.params as SimTypeConfig['params']) ?? {
                  mode: 'template',
                  templateSetId: null,
                  templateItemId: null,
                  algorithm: 'doe',
                  customValues: {},
                },
                output: (oldCfg.output as SimTypeConfig['output']) ?? {
                  mode: 'template',
                  outputSetId: null,
                  selectedConditionIds: [],
                  conditionValues: {},
                  selectedOutputIds: [],
                },
                solver: (oldCfg.solver as SimTypeConfig['solver']) ?? DEFAULT_GLOBAL_SOLVER,
                careDeviceIds: [],
                conditionRemark: '',
              };
              initializedConditionIds.push(conditionId);
            }
          });
        });
      }

      state.clearInitializedConditionIds();
      state.setSelectedSimTypes(selected);
      if (initializedConditionIds.length > 0) {
        state.markConditionIdsAsInitialized(initializedConditionIds);
      }
      state.setSimTypeConfigs(configs);
      state.setGlobalSolver(
        (inputJson.globalSolver as GlobalSolverConfig) || DEFAULT_GLOBAL_SOLVER
      );
      setInpSets(Array.isArray(inputJson.inpSets) ? (inputJson.inpSets as InpSetInfo[]) : []);
    },
    [findConditionId, form, state]
  );

  // 数据初始化逻辑
  useEffect(() => {
    if (hasInitializedRef.current) return;
    if (state.isConfigLoading) return;

    if (isEditMode && orderDetail?.data) {
      restoreOrderSnapshot(orderDetail.data as unknown as Record<string, unknown>);
      hasInitializedRef.current = true;
      return;
    }

    if (!isEditMode) {
      const draft = loadDraft(orderId, 7 * 24 * 60 * 60 * 1000, draftScopeIdRef.current);
      if (draft) {
        isLoadingDraftRef.current = true;
        const conditionIds = Object.keys(draft.simTypeConfigs).map(Number);
        state.markConditionIdsAsInitialized(conditionIds);
        form.reset(draft.formValues);
        state.setSelectedSimTypes(draft.selectedSimTypes);
        state.setSimTypeConfigs(draft.simTypeConfigs);
        state.setGlobalSolver(draft.globalSolver);
        setInpSets(draft.inpSets);
        showToast('info', t('sub.draft_restored'));
        setTimeout(() => {
          isLoadingDraftRef.current = false;
        }, 100);
      } else {
        void resetToLatestDefaults();
      }
      hasInitializedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, orderDetail, state.isConfigLoading]);

  useEffect(() => {
    // 提取所有选中的 simTypeId（去重）
    const simTypeIds = [...new Set(state.selectedSimTypes.map(item => item.simTypeId))];
    form.setValue('simTypeIds', simTypeIds, { shouldValidate: isSubmitted });
  }, [form, state.selectedSimTypes, isSubmitted]);

  useEffect(() => {
    if (selectedProjectId != null) {
      updateProjectHabit(selectedProjectId);
    }
  }, [selectedProjectId, updateProjectHabit]);

  useEffect(() => {
    if (state.safeFoldTypes.length === 0) return;
    const currentFoldTypeIds = form.getValues('foldTypeIds') || [];
    // 如果当前没有选中任何姿态，默认选中第一个
    if (currentFoldTypeIds.length === 0) {
      form.setValue('foldTypeIds', [state.safeFoldTypes[0].id], { shouldValidate: true });
    }
  }, [form, state.safeFoldTypes, foldTypeIds]);

  // 用 ref 保存最新数据，供组件卸载时使用
  const draftDataRef = useRef({
    selectedSimTypes: state.selectedSimTypes,
    simTypeConfigs: state.simTypeConfigs,
    globalSolver: state.globalSolver,
    inpSets,
  });

  // 实时同步 ref
  draftDataRef.current = {
    selectedSimTypes: state.selectedSimTypes,
    simTypeConfigs: state.simTypeConfigs,
    globalSolver: state.globalSolver,
    inpSets,
  };

  // 只在组件卸载时保存草稿（编辑态和新建态各自独立 key）
  useEffect(() => {
    return () => {
      // 组件卸载时保存
      if (hasInitializedRef.current && !isLoadingDraftRef.current) {
        const formValues = form.getValues();
        const data = draftDataRef.current;
        saveDraft(
          {
            formValues,
            selectedSimTypes: data.selectedSimTypes,
            simTypeConfigs: data.simTypeConfigs,
            globalSolver: data.globalSolver,
            inpSets: data.inpSets,
          },
          orderId,
          draftScopeIdRef.current
        );
      }
    };
  }, [form, orderId]);

  // 页面关闭时保存草稿（编辑态和新建态各自独立 key）
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasInitializedRef.current && !isLoadingDraftRef.current) {
        const formValues = form.getValues();
        const data = draftDataRef.current;
        saveDraft(
          {
            formValues,
            selectedSimTypes: data.selectedSimTypes,
            simTypeConfigs: data.simTypeConfigs,
            globalSolver: data.globalSolver,
            inpSets: data.inpSets,
          },
          orderId,
          draftScopeIdRef.current
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [form, orderId, state.selectedSimTypes, state.simTypeConfigs, state.globalSolver, inpSets]);

  // 打开抽屉方法（统一传入 conditionId）
  const openProjectDrawer = () => {
    state.setDrawerMode('project');
    state.setIsDrawerOpen(true);
  };

  const openParamsDrawer = (conditionId: number, foldTypeId: number, simTypeId: number) => {
    state.setActiveConditionId(conditionId);
    state.setActiveFoldTypeId(foldTypeId);
    state.setActiveSimTypeId(simTypeId);
    state.setDrawerMode('params');
    state.setIsDrawerOpen(true);
  };

  const openOutputDrawer = (conditionId: number, foldTypeId: number, simTypeId: number) => {
    state.setActiveConditionId(conditionId);
    state.setActiveFoldTypeId(foldTypeId);
    state.setActiveSimTypeId(simTypeId);
    state.setDrawerMode('output');
    state.setIsDrawerOpen(true);
  };

  const openSolverDrawer = (conditionId: number, foldTypeId: number, simTypeId: number) => {
    state.setActiveConditionId(conditionId);
    state.setActiveFoldTypeId(foldTypeId);
    state.setActiveSimTypeId(simTypeId);
    state.setDrawerMode('solver');
    state.setIsDrawerOpen(true);
  };

  const openCareDevicesDrawer = (conditionId: number, foldTypeId: number, simTypeId: number) => {
    state.setActiveConditionId(conditionId);
    state.setActiveFoldTypeId(foldTypeId);
    state.setActiveSimTypeId(simTypeId);
    state.setDrawerMode('careDevices');
    state.setIsDrawerOpen(true);
  };

  // 重置处理（带确认对话框）
  const handleReset = () => {
    const title = isEditMode ? t('sub.reset_title_edit') : t('sub.reset_title_new');
    const message = isEditMode ? t('sub.reset_confirm_edit') : t('sub.reset_confirm_new');

    showConfirm(
      title,
      message,
      () => {
        if (isEditMode && orderDetail?.data) {
          restoreOrderSnapshot(orderDetail.data as unknown as Record<string, unknown>);
          showToast('info', t('sub.reset_to_original'));
        } else {
          clearDraft(orderId, draftScopeIdRef.current);
          void resetToLatestDefaults();
          showToast('info', t('sub.reset_to_default'));
        }
      },
      'warning'
    );
  };

  // 提交处理
  const handleSubmit = form.handleSubmit(
    async values => {
      try {
        // 提取所有选中的 simTypeId（去重）
        const selectedSimTypeIds = [...new Set(state.selectedSimTypes.map(item => item.simTypeId))];

        // 构建新版 InputJson（以 conditionId 为核心的 conditions 数组）
        const conditions = state.selectedSimTypes.map(item => {
          const config = state.simTypeConfigs[item.conditionId];
          const foldType = state.safeFoldTypes.find(ft => ft.id === item.foldTypeId);
          const simType = state.safeSimTypes.find(st => st.id === item.simTypeId);
          return {
            conditionId: item.conditionId,
            foldTypeId: item.foldTypeId,
            foldTypeName: foldType?.name,
            simTypeId: item.simTypeId,
            simTypeName: simType?.name,
            params: config?.params,
            output: config?.output,
            solver: config?.solver,
            careDeviceIds: config?.careDeviceIds || [],
            remark: config?.conditionRemark || '',
          };
        });

        const currentSubmitRounds = estimateRoundsFromConditions(
          conditions as Array<Record<string, unknown>>
        );

        const limitResp = await ordersApi.getSubmitLimits();
        const limitData = limitResp?.data;

        const maxBatchSize = limitData?.maxBatchSize ?? user?.maxBatchSize ?? 200;
        if (currentSubmitRounds > maxBatchSize) {
          showToast('error', `本次提单轮次 ${currentSubmitRounds} 超过上限 ${maxBatchSize}`);
          return;
        }

        const dailyRoundLimit = limitData?.dailyRoundLimit ?? user?.dailyRoundLimit ?? 500;
        const todayUsedRounds = limitData?.todayUsedRounds ?? 0;
        if (todayUsedRounds + currentSubmitRounds > dailyRoundLimit) {
          showToast(
            'error',
            `今日轮次上限 ${dailyRoundLimit}，已用 ${todayUsedRounds}，本次需 ${currentSubmitRounds}`
          );
          return;
        }

        // 兼容旧版 optParam（以 simTypeId 为 key）
        const optParam = selectedSimTypeIds.reduce<Record<string, unknown>>((acc, simTypeId) => {
          // 找到该 simTypeId 对应的第一个 conditionId 的配置
          const item = state.selectedSimTypes.find(s => s.simTypeId === simTypeId);
          const config = item ? state.simTypeConfigs[item.conditionId] : undefined;
          if (config) {
            acc[String(simTypeId)] = {
              params: config.params,
              output: config.output,
              solver: config.solver,
            };
          }
          return acc;
        }, {});

        const originFile = {
          type: values.originFile.type,
          path: values.originFile.path,
          name: values.originFile.name,
          fileId:
            values.originFile.type === 2 ? Number(values.originFile.path || '') || null : null,
        };

        // 构建工况概览（供列表页展示）: { "姿态A": ["静力学","模态"], "姿态B": ["热仿真"] }
        const conditionSummary: Record<string, string[]> = {};
        for (const c of conditions) {
          const fName = c.foldTypeName || `${t('sub.fold_type_prefix')}${c.foldTypeId}`;
          if (!conditionSummary[fName]) conditionSummary[fName] = [];
          const sName = c.simTypeName || `${t('sub.sim_type_prefix')}${c.simTypeId}`;
          if (!conditionSummary[fName].includes(sName)) {
            conditionSummary[fName].push(sName);
          }
        }

        const payload = {
          projectId: values.projectId!,
          modelLevelId: values.modelLevelId,
          originFile,
          originFoldTypeId: values.originFoldTypeId ?? null,
          participantIds: values.participantIds,
          remark: values.remark,
          inputJson: {
            version: 2,
            projectInfo: {
              projectId: values.projectId!,
              projectName: state.projects.find(p => p.id === values.projectId)?.name,
              modelLevelId: values.modelLevelId,
              originFile: values.originFile,
              originFoldTypeId: values.originFoldTypeId ?? null,
              participantIds: values.participantIds,
              issueTitle: values.issueTitle,
              remark: values.remark,
            },
            conditions,
            globalSolver: state.globalSolver,
            inpSets,
          },
          clientMeta: { lang: language },
        };

        if (isEditMode && orderId) {
          // 编辑模式：调用更新 API
          await ordersApi.updateOrder(orderId, payload);
          showToast('success', t('sub.update_success'));
        } else {
          // 新建模式：调用创建 API
          await ordersApi.createOrder(payload);
          showToast('success', t('sub.submit_success'));
          // 提交成功后清除草稿
          clearDraft(orderId, draftScopeIdRef.current);
        }

        queryClient.invalidateQueries({ queryKey: queryKeys.orders.list() });
        if (onClose) onClose();
        else navigate('/orders');
      } catch (error) {
        console.error('提交订单失败:', error);
        const message = (error as { message?: string })?.message || t('sub.submit_fail');
        showToast('error', message);
      }
    },
    errors => {
      if (errors.projectId || errors.originFile || errors.foldTypeIds || errors.remark) {
        openProjectDrawer();
        requestAnimationFrame(() => {
          if (errors.projectId) {
            form.setFocus('projectId');
            return;
          }
          if (errors.originFile?.path) {
            form.setFocus('originFile.path');
            return;
          }
          if (errors.originFile?.name) {
            form.setFocus('originFile.name');
            return;
          }
          if (errors.foldTypeIds) {
            // foldTypeIds 是数组，不需要 setFocus
          }
        });
      }
    }
  );

  // 获取抽屉标题（包含工况关联信息）
  const getDrawerTitle = () => {
    // 获取当前工况和仿真类型名称
    const foldType = state.safeFoldTypes.find(ft => ft.id === state.activeFoldTypeId);
    const simType = state.safeSimTypes.find(st => st.id === state.activeSimTypeId);
    const conditionOrder = state.activeConditionId
      ? conditionOrderMap.get(state.activeConditionId)
      : undefined;
    const prefix =
      foldType && simType
        ? `${t('sub.condition')}${conditionOrder ?? '-'}-${foldType.name}${simType.name} - `
        : '';

    switch (state.drawerMode) {
      case 'project':
        return t('sub.proj_select');
      case 'params':
        return `${prefix}${t('sub.params_config')}`;
      case 'output':
        return `${prefix}${t('sub.output_config')}`;
      case 'solver':
        return `${prefix}${t('sub.solver_config')}`;
      case 'careDevices':
        return `${prefix}${t('sub.care_devices')}`;
      default:
        return '';
    }
  };

  const {
    PROJECT_NODE_X,
    PROJECT_NODE_WIDTH,
    FOLD_TYPE_NODE_X,
    FOLD_TYPE_NODE_WIDTH,
    SIM_TYPE_NODE_X,
    SIM_TYPE_NODE_WIDTH,
    CONFIG_BOX_X,
    CONFIG_BOX_WIDTH,
    CONFIG_BOX_HEIGHT,
    SIM_TYPE_VERTICAL_SPACING,
    FOLD_TYPE_GAP,
    START_Y,
    LINE_OFFSET_Y,
  } = CANVAS_LAYOUT;

  return (
    <div className="h-full flex flex-col bg-slate-100 dark:bg-slate-900 eyecare:bg-background">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-800 eyecare:bg-card border-b border-slate-200 dark:border-slate-700 eyecare:border-border">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white eyecare:text-foreground">
          {t('sub.title')}
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 eyecare:bg-muted rounded-lg p-1">
            <button
              onClick={canvas.zoomOut}
              className="p-2 hover:bg-white dark:hover:bg-slate-600 eyecare:hover:bg-card rounded"
              title={t('sub.zoom_out')}
            >
              <MagnifyingGlassMinusIcon className="w-5 h-5" />
            </button>
            <span className="px-2 text-sm font-medium min-w-[50px] text-center">
              {Math.round(state.transform.scale * 100)}%
            </span>
            <button
              onClick={canvas.zoomIn}
              className="p-2 hover:bg-white dark:hover:bg-slate-600 eyecare:hover:bg-card rounded"
              title={t('sub.zoom_in')}
            >
              <MagnifyingGlassPlusIcon className="w-5 h-5" />
            </button>
            <button
              onClick={canvas.resetView}
              className="p-2 hover:bg-white dark:hover:bg-slate-600 eyecare:hover:bg-card rounded"
              title={t('sub.reset_view')}
            >
              <ArrowsPointingOutIcon className="w-5 h-5" />
            </button>
          </div>
          {state.configError && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <span>{t('sub.config_load_failed')}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={state.retryConfig}
                disabled={state.isConfigLoading}
              >
                {t('sub.retry')}
              </Button>
            </div>
          )}
          {showSimTypeError && (
            <span className="text-sm text-destructive" role="alert">
              {showSimTypeError}
            </span>
          )}
          <Button variant="outline" onClick={handleReset} disabled={form.formState.isSubmitting}>
            {t('sub.reset')}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={form.formState.isSubmitting}>
            {t('sub.submit')}
          </Button>
        </div>
      </div>

      {/* 画布区域 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing relative"
        onWheel={canvas.handleWheel}
        onMouseDown={canvas.handleMouseDown}
        onMouseMove={canvas.handleMouseMove}
        onMouseUp={canvas.handleMouseUp}
        onMouseLeave={canvas.handleMouseUp}
      >
        <div
          ref={canvasContainerRef}
          style={{
            transform: `translate(${state.transform.x}px, ${state.transform.y}px) scale(${state.transform.scale})`,
            transformOrigin: '0 0',
          }}
          className="absolute transition-transform duration-75"
        >
          {/* 项目节点 - 相对于仿真类型垂直居中 */}
          <CanvasNode
            title={state.selectedProject ? state.selectedProject.name : t('sub.sel_project')}
            x={PROJECT_NODE_X}
            y={state.getProjectNodeY()}
            width={PROJECT_NODE_WIDTH}
            icon={<FolderIcon className="w-6 h-6" />}
            isActive={!!state.selectedProject}
            isComplete={!!state.selectedProject && !!(originFile.path || originFile.name)}
            onClick={openProjectDrawer}
          >
            {state.selectedProject ? (
              <div className="text-xs text-slate-500 eyecare:text-muted-foreground space-y-1 bg-slate-50 dark:bg-slate-900/50 eyecare:bg-muted/50 p-2 rounded">
                <div className="flex justify-between">
                  <span>{t('sub.source_file_label')}:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 eyecare:text-foreground truncate max-w-[180px]">
                    {originFile.path || originFile.name || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('sub.origin_fold_type')}:</span>
                  <span className="font-medium">
                    {originFoldTypeId != null
                      ? state.safeFoldTypes.find(f => f.id === originFoldTypeId)?.name || '-'
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('sub.model_level')}:</span>
                  <span className="font-medium">
                    {modelLevelId === 1 ? t('sub.model_level_whole') : t('sub.model_level_part')}
                  </span>
                </div>
                {participantIds.length > 0 && (
                  <div className="flex justify-between">
                    <span>{t('sub.participants')}:</span>
                    <span className="font-medium">
                      {participantIds.length}
                      {t('sub.person_unit')}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-400 eyecare:text-muted-foreground text-center italic py-2">
                {t('sub.click_select_project')}
              </div>
            )}
          </CanvasNode>

          {/* 姿态节点和仿真类型节点 */}
          {state.foldTypesWithSimTypes.map((foldTypeData, foldIdx) => {
            const isFoldTypeSelected = foldTypeIds.includes(foldTypeData.id);
            const simTypeCount = Math.max(foldTypeData.simTypes.length, 1);
            // 计算该姿态下所有仿真类型的起始Y坐标
            const prevFoldTypesSimCount = state.foldTypesWithSimTypes
              .slice(0, foldIdx)
              .reduce((sum, ft) => sum + Math.max(ft.simTypes.length, 1), 0);
            const baseY =
              START_Y + prevFoldTypesSimCount * SIM_TYPE_VERTICAL_SPACING + foldIdx * FOLD_TYPE_GAP;
            // 姿态节点居中于其仿真类型
            const simTypesHeight = (simTypeCount - 1) * SIM_TYPE_VERTICAL_SPACING;
            const foldTypeNodeY = baseY + simTypesHeight / 2;
            const projectNodeY = state.getProjectNodeY();

            return (
              <React.Fragment key={`fold-${foldTypeData.id}`}>
                {/* 连接线: 项目 -> 姿态 */}
                <ConnectionLine
                  x1={PROJECT_NODE_X + PROJECT_NODE_WIDTH}
                  y1={projectNodeY + LINE_OFFSET_Y}
                  x2={FOLD_TYPE_NODE_X}
                  y2={foldTypeNodeY + LINE_OFFSET_Y}
                  isActive={isFoldTypeSelected}
                />

                {/* 姿态节点 */}
                <CanvasNode
                  title={foldTypeData.name}
                  x={FOLD_TYPE_NODE_X}
                  y={foldTypeNodeY}
                  width={FOLD_TYPE_NODE_WIDTH}
                  icon={<DevicePhoneMobileIcon className="w-6 h-6" />}
                  isActive={isFoldTypeSelected}
                  onClick={() => {
                    // 切换姿态选择（多选）
                    const currentIds = form.getValues('foldTypeIds') || [];
                    if (currentIds.includes(foldTypeData.id)) {
                      // 取消选择（至少保留一个）
                      if (currentIds.length > 1) {
                        form.setValue(
                          'foldTypeIds',
                          currentIds.filter(id => id !== foldTypeData.id)
                        );
                      }
                    } else {
                      // 添加选择
                      form.setValue('foldTypeIds', [...currentIds, foldTypeData.id]);
                    }
                  }}
                >
                  <div className="text-xs text-slate-500 eyecare:text-muted-foreground text-center">
                    <span
                      className={`px-2 py-1 rounded ${
                        isFoldTypeSelected
                          ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30'
                          : 'bg-slate-100 dark:bg-slate-700 eyecare:bg-muted'
                      }`}
                    >
                      {isFoldTypeSelected ? t('sub.selected') : t('sub.click_select')}
                    </span>
                  </div>
                </CanvasNode>

                {/* 该姿态下的仿真类型节点 */}
                {foldTypeData.simTypes.map((simType, simIdx) => {
                  const simTypeNodeY = baseY + simIdx * SIM_TYPE_VERTICAL_SPACING;
                  // 使用 conditionId 判断选中状态
                  const isSimTypeSelected = state.selectedSimTypes.some(
                    item => item.conditionId === simType.conditionId
                  );
                  const config = state.simTypeConfigs[simType.conditionId];

                  return (
                    <React.Fragment key={`sim-${simType.id}`}>
                      {/* 连接线: 姿态 -> 仿真类型 */}
                      <ConnectionLine
                        x1={FOLD_TYPE_NODE_X + FOLD_TYPE_NODE_WIDTH}
                        y1={foldTypeNodeY + LINE_OFFSET_Y}
                        x2={SIM_TYPE_NODE_X}
                        y2={simTypeNodeY + LINE_OFFSET_Y}
                        isActive={isFoldTypeSelected && isSimTypeSelected}
                      />

                      <CanvasNode
                        title={simType.name}
                        x={SIM_TYPE_NODE_X}
                        y={simTypeNodeY}
                        width={SIM_TYPE_NODE_WIDTH}
                        icon={<CubeIcon className="w-6 h-6" />}
                        isActive={isFoldTypeSelected && isSimTypeSelected}
                        onClick={() => {
                          // 如果姿态未选中，先添加到选择列表
                          if (!isFoldTypeSelected) {
                            const currentIds = form.getValues('foldTypeIds') || [];
                            form.setValue('foldTypeIds', [...currentIds, foldTypeData.id]);
                          }
                          // 切换仿真类型选择（传入 conditionId、姿态ID、仿真类型ID和当前选中的姿态列表）
                          const currentFoldTypeIds = form.getValues('foldTypeIds') || [];
                          const result = state.toggleSimType(
                            simType.conditionId,
                            foldTypeData.id,
                            simType.id,
                            currentFoldTypeIds
                          );

                          if (result === -1) {
                            // 这是最后一个仿真类型，不允许取消，显示提示
                            showToast('warning', t('sub.keep_at_least_one_sim_type'));
                          } else if (result !== null) {
                            // 该姿态下所有仿真类型都被取消，取消该姿态的选中
                            // 注意：result 可能为 0（姿态ID为0的情况）
                            form.setValue(
                              'foldTypeIds',
                              currentFoldTypeIds.filter(id => id !== result)
                            );
                          }
                        }}
                      >
                        <div className="text-xs text-slate-500 eyecare:text-muted-foreground text-center">
                          {simType.isDefault && (
                            <span className="px-1.5 py-0.5 mr-1 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded">
                              {t('sub.default_tag')}
                            </span>
                          )}
                          <span
                            className={`px-2 py-1 rounded ${
                              isFoldTypeSelected && isSimTypeSelected
                                ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30'
                                : 'bg-slate-100 dark:bg-slate-700 eyecare:bg-muted'
                            }`}
                          >
                            {isSimTypeSelected ? t('sub.selected') : t('sub.click_select')}
                          </span>
                        </div>
                      </CanvasNode>

                      {/* 配置模块组 */}
                      {isFoldTypeSelected && isSimTypeSelected && config && (
                        <>
                          <ConnectionLine
                            x1={SIM_TYPE_NODE_X + SIM_TYPE_NODE_WIDTH}
                            y1={simTypeNodeY + LINE_OFFSET_Y}
                            x2={CONFIG_BOX_X}
                            y2={simTypeNodeY + CONFIG_BOX_HEIGHT / 2}
                            isActive={true}
                          />
                          <div
                            className="absolute border-2 border-dashed border-slate-300 dark:border-slate-600 eyecare:border-border rounded-xl bg-slate-50/50 dark:bg-slate-900/30 eyecare:bg-muted/30"
                            style={{
                              left: CONFIG_BOX_X,
                              top: simTypeNodeY,
                              width: CONFIG_BOX_WIDTH,
                              height: CONFIG_BOX_HEIGHT,
                            }}
                          >
                            {(() => {
                              const conditionOrder =
                                conditionOrderMap.get(simType.conditionId) ?? foldIdx + simIdx + 1;
                              return (
                                <div className="absolute -top-3 left-4 px-2 bg-white dark:bg-slate-800 eyecare:bg-card text-xs text-slate-500 font-medium">
                                  {t('sub.condition')}
                                  {conditionOrder}-{foldTypeData.name}
                                  {simType.name} {t('sub.config')}
                                </div>
                              );
                            })()}
                            <SimTypeConfigBox
                              simType={simType}
                              foldType={foldTypeData}
                              config={config}
                              solvers={state.safeSolvers}
                              globalSolver={state.globalSolver}
                              drawerMode={state.drawerMode}
                              activeSimTypeId={state.activeSimTypeId}
                              onOpenParams={() =>
                                openParamsDrawer(simType.conditionId, foldTypeData.id, simType.id)
                              }
                              onOpenOutput={() =>
                                openOutputDrawer(simType.conditionId, foldTypeData.id, simType.id)
                              }
                              onOpenSolver={() =>
                                openSolverDrawer(simType.conditionId, foldTypeData.id, simType.id)
                              }
                              onOpenCareDevices={() =>
                                openCareDevicesDrawer(
                                  simType.conditionId,
                                  foldTypeData.id,
                                  simType.id
                                )
                              }
                              t={t}
                            />
                          </div>
                        </>
                      )}
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>

        {/* 浮动快捷操作按钮 - 右下角 */}
        {state.activeConditionId && (
          <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
            {(
              [
                { mode: 'params', label: t('sub.params_config'), icon: '⚙️' },
                { mode: 'output', label: t('sub.output_config'), icon: '📊' },
                { mode: 'solver', label: t('sub.solver_config'), icon: '🖥️' },
                { mode: 'careDevices', label: t('sub.care_devices'), icon: '🔍' },
              ] as const
            ).map(fab => (
              <button
                key={fab.mode}
                title={fab.label}
                onClick={() => {
                  state.setDrawerMode(fab.mode);
                  state.setIsDrawerOpen(true);
                }}
                className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-xl transition-all hover:scale-110 active:scale-95 ${
                  state.isDrawerOpen && state.drawerMode === fab.mode
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                    : 'bg-background border border-border hover:border-primary/50 hover:bg-primary/5'
                }`}
              >
                {fab.icon}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 配置抽屉 */}
      <ConfigDrawer
        isOpen={state.isDrawerOpen}
        onClose={() => state.setIsDrawerOpen(false)}
        title={getDrawerTitle()}
        width={state.drawerMode === 'output' ? 'xwide' : 'normal'}
        resizable={state.drawerMode === 'params' || state.drawerMode === 'output'}
        activeMode={state.drawerMode}
        onModeChange={mode => {
          state.setDrawerMode(mode);
        }}
        t={t}
      >
        {state.drawerMode === 'project' ? (
          <ProjectDrawerContent
            projects={state.projects}
            foldTypes={state.safeFoldTypes}
            users={state.users}
            control={form.control}
            setValue={form.setValue}
            t={t}
            onVerifyFile={async (filePath, fileType) => {
              try {
                const resp = await ordersApi.verifyFile(filePath, fileType);
                const result = resp.data ?? resp;
                if (result.success) {
                  // 保存 inpSets 用于关注器件选择
                  const parsedSets: InpSetInfo[] = (result.inpSets || []).map(
                    (s: { type: string; name: string }) => ({
                      type: s.type as InpSetInfo['type'],
                      name: s.name,
                    })
                  );
                  setInpSets(parsedSets);
                  return {
                    success: true,
                    name: result.name || filePath.split(/[/\\]/).pop() || filePath,
                    path: result.path || filePath,
                    inpSets: parsedSets.length > 0 ? parsedSets : undefined,
                  };
                }
                return { success: false, error: result.error || t('sub.file_verify_fail') };
              } catch (err) {
                const msg = (err as { message?: string })?.message || t('sub.verify_request_fail');
                return { success: false, error: msg };
              }
            }}
          />
        ) : state.drawerMode === 'params' &&
          state.activeConditionId &&
          state.simTypeConfigs[state.activeConditionId] ? (
          <ParamsDrawerContent
            config={state.simTypeConfigs[state.activeConditionId]}
            simTypeId={state.activeSimTypeId!}
            paramDefs={state.safeParamDefs}
            paramGroups={state.safeParamGroups}
            conditionConfig={
              state.activeFoldTypeId && state.activeSimTypeId
                ? state.getConditionConfig(state.activeFoldTypeId, state.activeSimTypeId)
                : undefined
            }
            onUpdate={updates => state.updateSimTypeConfig(state.activeConditionId!, updates)}
            onFetchGroupParams={state.fetchParamGroupParams}
            t={t}
          />
        ) : state.drawerMode === 'output' &&
          state.activeConditionId &&
          state.simTypeConfigs[state.activeConditionId] ? (
          <OutputDrawerContent
            config={state.simTypeConfigs[state.activeConditionId]}
            simTypeId={state.activeSimTypeId!}
            outputSets={state.safeOutputSets}
            conditionConfig={
              state.activeFoldTypeId && state.activeSimTypeId
                ? state.getConditionConfig(state.activeFoldTypeId, state.activeSimTypeId)
                : undefined
            }
            inpSets={inpSets}
            onUpdate={updates => state.updateSimTypeConfig(state.activeConditionId!, updates)}
            onFetchGroupOutputs={state.fetchOutputGroupOutputs}
            t={t}
          />
        ) : state.drawerMode === 'solver' &&
          state.activeConditionId &&
          state.simTypeConfigs[state.activeConditionId] ? (
          <SolverDrawerContent
            config={state.simTypeConfigs[state.activeConditionId]}
            solvers={state.safeSolvers}
            resourcePools={MOCK_RESOURCE_POOLS}
            globalSolver={state.globalSolver}
            maxCpuCores={submitLimits?.maxCpuCores ?? user?.maxCpuCores}
            onUpdate={updates => state.updateSolverConfig(state.activeConditionId!, updates)}
            onGlobalSolverChange={state.setGlobalSolver}
            onApplyToAll={state.applySolverToAll}
            t={t}
          />
        ) : state.drawerMode === 'careDevices' &&
          state.activeConditionId &&
          state.simTypeConfigs[state.activeConditionId] ? (
          <CareDevicesDrawerContent
            configCareDevices={configCareDevices}
            selectedDeviceIds={state.simTypeConfigs[state.activeConditionId].careDeviceIds || []}
            conditionRemark={state.simTypeConfigs[state.activeConditionId].conditionRemark || ''}
            onUpdate={deviceIds =>
              state.updateSimTypeConfig(state.activeConditionId!, { careDeviceIds: deviceIds })
            }
            onRemarkChange={remark =>
              state.updateSimTypeConfig(state.activeConditionId!, { conditionRemark: remark })
            }
            t={t}
          />
        ) : (
          <div className="text-center text-slate-500 eyecare:text-muted-foreground py-8">
            请选择配置项
          </div>
        )}
      </ConfigDrawer>
      <ConfirmDialogComponent />
    </div>
  );
};

export default Submission;
