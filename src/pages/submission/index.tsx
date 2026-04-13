import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useUIStore, useAuthStore } from '@/stores';
import { RESOURCES } from '@/locales';
import { useToast, useConfirmDialog } from '@/components/ui';
import { ordersApi } from '@/api';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCareDevices } from '@/features/config/queries';
import { useSubmissionState, useCanvasInteraction } from './hooks';
import { useSubmissionDrawerActions } from './hooks/useSubmissionDrawerActions';
import { useSubmissionDraftLifecycle } from './hooks/useSubmissionDraftLifecycle';
import { useSubmissionOrderRestore } from './hooks/useSubmissionOrderRestore';
import { useSubmissionProjectHabit } from './hooks/useSubmissionProjectHabit';
import { useSubmissionProjectPhaseSync } from './hooks/useSubmissionProjectPhaseSync';
import { useSubmissionResourcePoolSync } from './hooks/useSubmissionResourcePoolSync';
import { useSubmissionSubmitHandler } from './hooks/useSubmissionSubmitHandler';
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
      phaseId: null,
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
          rotateDropFlag: Boolean(
            (config?.params as { rotateDropFlag?: boolean } | undefined)?.rotateDropFlag
          ),
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
    globalParams: state.globalParams,
    user,
  });

  const preferredProjectIds = useMemo(() => {
    const recentProjectIds = Array.isArray(user?.recentProjectIds) ? user.recentProjectIds : [];
    const habitProjectIds = getProjectHabitIds(
      String(user?.domainAccount || user?.id || ''),
      PROJECT_HABIT_STORAGE_KEY
    );
    return [...habitProjectIds, ...recentProjectIds].filter(
      (projectId, index, source) => source.indexOf(projectId) === index
    );
  }, [user?.domainAccount, user?.id, user?.recentProjectIds]);

  const defaultFormValues = useMemo<SubmissionFormValues>(
    () => ({
      projectId:
        (getPreferredProjectId(state.projects || [], preferredProjectIds) as unknown as number) ??
        (null as unknown as number),
      phaseId: null,
      issueTitle: '',
      modelLevelId: 1,
      originFile: { type: 1, path: '', name: '', verified: false },
      originFoldTypeId: null,
      participantIds: [],
      foldTypeIds: [],
      remark: '',
      simTypeIds: [],
    }),
    [preferredProjectIds, state.projects]
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
      state.setGlobalParams({ applyToAll: false, rotateDropFlag: false });
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
        setGlobalParams: state.setGlobalParams,
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
      globalParams: state.globalParams,
      inpSets,
    },
    markConditionIdsAsInitialized: state.markConditionIdsAsInitialized,
    setSelectedSimTypes: state.setSelectedSimTypes,
    setSimTypeConfigs: state.setSimTypeConfigs,
    setGlobalSolver: state.setGlobalSolver,
    setGlobalParams: state.setGlobalParams,
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

  useSubmissionProjectPhaseSync({
    form,
    selectedProjectId,
    defaultPhaseId: state.defaultProjectPhaseId,
    availablePhaseIds: state.projectPhases.map((item: { phaseId: number }) => item.phaseId),
    isEditMode,
  });

  useSubmissionResourcePoolSync({
    selectedProjectId,
    selectedConditionIds: state.selectedSimTypes.map(item => item.conditionId),
    simTypeConfigs: state.simTypeConfigs,
    resourcePools: state.resourcePools,
    defaultResourceId: state.defaultResourceId,
    updateSolverConfig: state.updateSolverConfig,
  });

  useEffect(() => {
    if (state.safeFoldTypes.length === 0) return;
    const currentFoldTypeIds = form.getValues('foldTypeIds') || [];
    if (currentFoldTypeIds.length === 0) {
      form.setValue('foldTypeIds', [state.safeFoldTypes[0].id], { shouldValidate: true });
    }
  }, [form, state.safeFoldTypes, foldTypeIds]);

  const {
    openProjectDrawer,
    openParamsDrawer,
    openOutputDrawer,
    openSolverDrawer,
    openCareDevicesDrawer,
    getDrawerTitle,
  } = useSubmissionDrawerActions({
    state,
    conditionOrderMap,
    t,
  });

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

  const { handleSubmit } = useSubmissionSubmitHandler({
    form,
    state,
    submitRounds: submitMeta.currentSubmitRounds,
    orderId,
    isEditMode,
    language,
    inpSets,
    user,
    t,
    showToast,
    openProjectDrawer,
    navigateToOrders: () => navigate('/orders'),
    onClose,
    clearDraft: () => clearDraft(orderId, draftScopeIdRef.current),
  });

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
        width="xwide"
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
        />
      </ConfigDrawer>
      <ConfirmDialogComponent />
    </div>
  );
};

export default Submission;
