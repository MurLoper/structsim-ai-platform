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
import { ConfigDrawer, SubmissionCanvas, SubmissionDrawerContent } from './components';
import {
  DEFAULT_GLOBAL_SOLVER,
  DRAFT_SCOPE_SESSION_KEY,
  PROJECT_HABIT_STORAGE_KEY,
} from './constants';
import { estimateRoundsFromConditions } from './utils/submitEstimation';

const toNumber = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
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

  // 编辑模式：从 URL 获取订单 ID
  const urlOrderId = searchParams.get('orderId') ? Number(searchParams.get('orderId')) : null;
  const orderId = propOrderId !== undefined ? propOrderId : urlOrderId;
  const isEditMode = orderId !== null;
  const hasInitializedRef = useRef(false);
  const isLoadingDraftRef = useRef(false);
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

  // 使用页面级 hooks
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
  // INP 文件解析出的 set 集合，用于关注器件选择
  const [inpSets, setInpSets] = useState<InpSetInfo[]>([]);

  // 编辑模式：加载订单详情
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
    // 提取所有选中的 simTypeId 并去重
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
    if (currentFoldTypeIds.length === 0) {
      form.setValue('foldTypeIds', [state.safeFoldTypes[0].id], { shouldValidate: true });
    }
  }, [form, state.safeFoldTypes, foldTypeIds]);

  // 用 ref 保存最新数据，供卸载和关闭页面时复用
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

  // 组件卸载时保存草稿，新建态和编辑态使用各自独立 key
  useEffect(() => {
    return () => {
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

  // 页面关闭时保存草稿，新建态和编辑态使用各自独立 key
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

  // 打开抽屉方法，统一传入 conditionId
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

  // 重置处理，带确认弹窗
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

        const originFile = {
          type: values.originFile.type,
          path: values.originFile.path,
          name: values.originFile.name,
          fileId:
            values.originFile.type === 2 ? Number(values.originFile.path || '') || null : null,
        };

        // 构建工况概览，供列表页展示
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
          await ordersApi.createOrder(payload);
          showToast('success', t('sub.submit_success'));
          clearDraft(orderId, draftScopeIdRef.current);
        }

        queryClient.invalidateQueries({ queryKey: queryKeys.orders.list() });
        if (onClose) onClose();
        else navigate('/orders');
      } catch (error) {
        console.error('鎻愪氦璁㈠崟澶辫触:', error);
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

  // 获取抽屉标题，包含当前工况上下文
  const getDrawerTitle = () => {
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
          <SubmissionCanvas
            form={form}
            state={state}
            conditionOrderMap={conditionOrderMap}
            originFile={originFile}
            originFoldTypeId={originFoldTypeId}
            modelLevelId={modelLevelId}
            participantIds={participantIds}
            t={t}
            showToast={showToast}
            openProjectDrawer={openProjectDrawer}
            openParamsDrawer={openParamsDrawer}
            openOutputDrawer={openOutputDrawer}
            openSolverDrawer={openSolverDrawer}
            openCareDevicesDrawer={openCareDevicesDrawer}
          />
        </div>
        {/* 浮动快捷操作按钮 - 右下角 */}
        {state.activeConditionId && (
          <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
            {(
              [
                { mode: 'params', label: t('sub.params_config'), icon: '参' },
                { mode: 'output', label: t('sub.output_config'), icon: '出' },
                { mode: 'solver', label: t('sub.solver_config'), icon: '解' },
                { mode: 'careDevices', label: t('sub.care_devices'), icon: '器' },
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
        <SubmissionDrawerContent
          form={form}
          state={state}
          configCareDevices={configCareDevices}
          inpSets={inpSets}
          setInpSets={setInpSets}
          t={t}
          userMaxCpuCores={user?.maxCpuCores}
          submitLimitMaxCpuCores={submitLimits?.maxCpuCores}
        />
      </ConfigDrawer>
      <ConfirmDialogComponent />
    </div>
  );
};

export default Submission;
