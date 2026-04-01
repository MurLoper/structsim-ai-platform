import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useUIStore, useAuthStore } from '@/stores';
import { RESOURCES } from '@/locales';
import { useToast, useConfirmDialog } from '@/components/ui';
import { ordersApi } from '@/api';
import { queryClient, queryKeys } from '@/lib/queryClient';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCareDevices } from '@/features/config/queries';
import { useSubmissionState, useCanvasInteraction } from './hooks';
import { useSubmissionDraftLifecycle } from './hooks/useSubmissionDraftLifecycle';
import { useSubmissionOrderRestore } from './hooks/useSubmissionOrderRestore';
import { useSubmissionProjectHabit } from './hooks/useSubmissionProjectHabit';
import { useSubmissionSubmitMeta } from './hooks/useSubmissionSubmitMeta';
import { submissionFormSchema, type SubmissionFormValues, type InpSetInfo } from './types';
import { clearDraft } from './utils/draftStorage';
import {
  ConfigDrawer,
  SubmissionCanvas,
  SubmissionCanvasPane,
  SubmissionDrawerContent,
  SubmissionToolbar,
} from './components';
import {
  DEFAULT_GLOBAL_SOLVER,
  DRAFT_SCOPE_SESSION_KEY,
  PROJECT_HABIT_STORAGE_KEY,
} from './constants';
import {
  getPreferredProjectId,
  getProjectHabitIds,
  restoreOrderSnapshot,
} from './utils/submissionPageUtils';
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

  const currentSubmitConditions = useMemo(
    () =>
      state.selectedSimTypes.map(item => {
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
      }),
    [state.safeFoldTypes, state.safeSimTypes, state.selectedSimTypes, state.simTypeConfigs]
  );

  const submitMeta = useSubmissionSubmitMeta({
    conditions: currentSubmitConditions,
    submitLimits,
    user,
  });

  const defaultFormValues = useMemo<SubmissionFormValues>(
    () => ({
      projectId:
        (getPreferredProjectId(
          state.projects || [],
          getProjectHabitIds(
            String(user?.domainAccount || user?.id || ''),
            PROJECT_HABIT_STORAGE_KEY
          )
        ) as unknown as number) ?? (null as unknown as number),
      issueTitle: '',
      modelLevelId: 1,
      originFile: { type: 1, path: '', name: '', verified: false },
      originFoldTypeId: null,
      participantIds: [],
      foldTypeIds: [],
      remark: '',
      simTypeIds: [],
    }),
    [state.projects, user?.domainAccount, user?.id]
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

  const applyOrderSnapshot = useCallback(
    (order: Record<string, unknown>) =>
      restoreOrderSnapshot({
        order,
        form,
        findConditionId,
        clearInitializedConditionIds: state.clearInitializedConditionIds,
        setSelectedSimTypes: state.setSelectedSimTypes,
        markConditionIdsAsInitialized: state.markConditionIdsAsInitialized,
        setSimTypeConfigs: state.setSimTypeConfigs,
        setGlobalSolver: state.setGlobalSolver,
        setInpSets,
        defaultGlobalSolver: DEFAULT_GLOBAL_SOLVER,
      }),
    [findConditionId, form, state]
  );

  useSubmissionOrderRestore({
    isEditMode,
    isConfigLoading: state.isConfigLoading,
    hasInitializedRef,
    orderDetail: orderDetail as { data?: Record<string, unknown> } | undefined,
    applyOrderSnapshot,
  });

  useSubmissionDraftLifecycle({
    form,
    orderId,
    isEditMode,
    isConfigLoading: state.isConfigLoading,
    hasInitializedRef,
    draftScopeIdRef,
    draftPayload: {
      formValues: form.getValues(),
      selectedSimTypes: state.selectedSimTypes,
      simTypeConfigs: state.simTypeConfigs,
      globalSolver: state.globalSolver,
      inpSets,
    },
    markConditionIdsAsInitialized: state.markConditionIdsAsInitialized,
    setSelectedSimTypes: state.setSelectedSimTypes,
    setSimTypeConfigs: state.setSimTypeConfigs,
    setGlobalSolver: state.setGlobalSolver,
    setInpSets,
    showDraftRestored: () => showToast('info', t('sub.draft_restored')),
    resetToLatestDefaults,
  });

  useEffect(() => {
    // 提取所有选中的 simTypeId 并去重
    const simTypeIds = [...new Set(state.selectedSimTypes.map(item => item.simTypeId))];
    form.setValue('simTypeIds', simTypeIds, { shouldValidate: isSubmitted });
  }, [form, state.selectedSimTypes, isSubmitted]);

  useSubmissionProjectHabit({
    selectedProjectId,
    userKey: String(user?.domainAccount || user?.id || ''),
    storageKey: PROJECT_HABIT_STORAGE_KEY,
  });

  useEffect(() => {
    if (state.safeFoldTypes.length === 0) return;
    const currentFoldTypeIds = form.getValues('foldTypeIds') || [];
    if (currentFoldTypeIds.length === 0) {
      form.setValue('foldTypeIds', [state.safeFoldTypes[0].id], { shouldValidate: true });
    }
  }, [form, state.safeFoldTypes, foldTypeIds]);

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
          applyOrderSnapshot(orderDetail.data as unknown as Record<string, unknown>);
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

        const currentSubmitRounds = submitMeta.currentSubmitRounds;

        const limitResp = await ordersApi.getSubmitLimits();
        const limitData = limitResp?.data;

        const latestSubmitMeta = {
          maxBatchSize: limitData?.maxBatchSize ?? user?.maxBatchSize ?? 200,
          dailyRoundLimit: limitData?.dailyRoundLimit ?? user?.dailyRoundLimit ?? 500,
          todayUsedRounds: limitData?.todayUsedRounds ?? 0,
        };

        if (currentSubmitRounds > latestSubmitMeta.maxBatchSize) {
          showToast(
            'error',
            `本次提单轮次 ${currentSubmitRounds} 超过上限 ${latestSubmitMeta.maxBatchSize}`
          );
          return;
        }

        if (
          latestSubmitMeta.todayUsedRounds + currentSubmitRounds >
          latestSubmitMeta.dailyRoundLimit
        ) {
          showToast(
            'error',
            `今日轮次上限 ${latestSubmitMeta.dailyRoundLimit}，已用 ${latestSubmitMeta.todayUsedRounds}，本次需 ${currentSubmitRounds}`
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
      <SubmissionToolbar
        title={t('sub.title')}
        zoomPercent={Math.round(state.transform.scale * 100)}
        hasConfigError={!!state.configError}
        isConfigLoading={state.isConfigLoading}
        showSimTypeError={showSimTypeError}
        isSubmitting={form.formState.isSubmitting}
        onZoomOut={canvas.zoomOut}
        onZoomIn={canvas.zoomIn}
        onResetView={canvas.resetView}
        onRetryConfig={state.retryConfig}
        onReset={handleReset}
        onSubmit={handleSubmit}
        t={t}
      />

      <SubmissionCanvasPane
        containerRef={containerRef}
        canvasContainerRef={canvasContainerRef}
        transform={state.transform}
        activeConditionId={state.activeConditionId}
        isDrawerOpen={state.isDrawerOpen}
        activeMode={state.drawerMode}
        t={t}
        onWheel={canvas.handleWheel}
        onMouseDown={canvas.handleMouseDown}
        onMouseMove={canvas.handleMouseMove}
        onMouseUp={canvas.handleMouseUp}
        onMouseLeave={canvas.handleMouseUp}
        onOpenMode={mode => {
          state.setDrawerMode(mode);
          state.setIsDrawerOpen(true);
        }}
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
      </SubmissionCanvasPane>

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
