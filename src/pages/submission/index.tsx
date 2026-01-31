import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores';
import { RESOURCES } from '@/locales';
import { Button, useToast } from '@/components/ui';
import { ordersApi } from '@/api';
import { queryClient, queryKeys } from '@/lib/queryClient';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FolderIcon,
  CubeIcon,
  DevicePhoneMobileIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowsPointingOutIcon,
  CameraIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

import { useSubmissionState, useCanvasInteraction, useCanvasExport } from './hooks';
import { submissionFormSchema, type SubmissionFormValues } from './types';
import {
  CanvasNode,
  ConnectionLine,
  ConfigDrawer,
  ProjectDrawerContent,
  ParamsDrawerContent,
  CondOutDrawerContent,
  SolverDrawerContent,
  SimTypeConfigBox,
} from './components';
import { CANVAS_LAYOUT } from '@/constants/submission';

const Submission: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useUIStore();
  const { showToast } = useToast();
  const t = (key: string) => RESOURCES[language][key] || key;
  const containerRef = useRef<HTMLDivElement>(null);

  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionFormSchema),
    defaultValues: {
      projectId: null as unknown as number,
      originFile: { type: 1, path: '', name: '' },
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
  const foldTypeIds = useWatch({ control: form.control, name: 'foldTypeIds' }) ?? [];
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
  const { exportAsImage, exportAsFlowData } = useCanvasExport();
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 提取所有选中的 simTypeId（去重）
    const simTypeIds = [...new Set(state.selectedSimTypes.map(item => item.simTypeId))];
    form.setValue('simTypeIds', simTypeIds, { shouldValidate: isSubmitted });
  }, [form, state.selectedSimTypes, isSubmitted]);

  useEffect(() => {
    if (state.safeFoldTypes.length === 0) return;
    const currentFoldTypeIds = form.getValues('foldTypeIds') || [];
    // 如果当前没有选中任何姿态，默认选中第一个
    if (currentFoldTypeIds.length === 0) {
      form.setValue('foldTypeIds', [state.safeFoldTypes[0].id], { shouldValidate: true });
    }
  }, [form, state.safeFoldTypes]);

  // 打开抽屉方法
  const openProjectDrawer = () => {
    state.setDrawerMode('project');
    state.setIsDrawerOpen(true);
  };

  const openParamsDrawer = (simTypeId: number) => {
    state.setActiveSimTypeId(simTypeId);
    state.setDrawerMode('params');
    state.setIsDrawerOpen(true);
  };

  const openCondOutDrawer = (simTypeId: number) => {
    state.setActiveSimTypeId(simTypeId);
    state.setDrawerMode('condOut');
    state.setIsDrawerOpen(true);
  };

  const openSolverDrawer = (simTypeId: number) => {
    state.setActiveSimTypeId(simTypeId);
    state.setDrawerMode('solver');
    state.setIsDrawerOpen(true);
  };

  // 提交处理
  const handleSubmit = form.handleSubmit(
    async values => {
      try {
        // 提取所有选中的 simTypeId（去重）
        const selectedSimTypeIds = [...new Set(state.selectedSimTypes.map(item => item.simTypeId))];
        const optParam = selectedSimTypeIds.reduce<Record<string, unknown>>((acc, simTypeId) => {
          const config = state.simTypeConfigs[simTypeId];
          if (config) {
            acc[String(simTypeId)] = config;
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

        const response = await ordersApi.createOrder({
          projectId: values.projectId!,
          originFile,
          foldTypeIds: values.foldTypeIds,
          remark: values.remark,
          simTypeIds: values.simTypeIds,
          optParam,
          clientMeta: { lang: language },
        });

        showToast('success', '提交成功');
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.list() });
        navigate(`/results/${response.data.id}`);
      } catch (error) {
        console.error('提交订单失败:', error);
        const message = (error as { message?: string })?.message || '提交失败，请稍后重试';
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

  // 获取抽屉标题
  const getDrawerTitle = () => {
    switch (state.drawerMode) {
      case 'project':
        return t('sub.proj_select');
      case 'params':
        return '参数配置';
      case 'condOut':
        return '工况 & 输出配置';
      case 'solver':
        return '求解器设置';
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
    <div className="h-full flex flex-col bg-slate-100 dark:bg-slate-900">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('sub.title')}</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            <button
              onClick={canvas.zoomOut}
              className="p-2 hover:bg-white dark:hover:bg-slate-600 rounded"
              title="缩小"
            >
              <MagnifyingGlassMinusIcon className="w-5 h-5" />
            </button>
            <span className="px-2 text-sm font-medium min-w-[50px] text-center">
              {Math.round(state.transform.scale * 100)}%
            </span>
            <button
              onClick={canvas.zoomIn}
              className="p-2 hover:bg-white dark:hover:bg-slate-600 rounded"
              title="放大"
            >
              <MagnifyingGlassPlusIcon className="w-5 h-5" />
            </button>
            <button
              onClick={canvas.resetView}
              className="p-2 hover:bg-white dark:hover:bg-slate-600 rounded"
              title="重置视图"
            >
              <ArrowsPointingOutIcon className="w-5 h-5" />
            </button>
          </div>
          {/* 导出按钮组 */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => exportAsImage(canvasContainerRef.current, { scale: 3 })}
              className="p-2 hover:bg-white dark:hover:bg-slate-600 rounded"
              title="导出高清图片"
            >
              <CameraIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                const flowData = {
                  version: '1.0',
                  exportTime: new Date().toISOString(),
                  project: {
                    id: selectedProjectId,
                    name: state.selectedProject?.name || '',
                  },
                  foldTypes: foldTypeIds.map(ftId => ({
                    id: ftId,
                    name: state.safeFoldTypes.find(f => f.id === ftId)?.name || '',
                  })),
                  simTypes: state.selectedSimTypes.map(item => {
                    const st = state.safeSimTypes.find(s => s.id === item.simTypeId);
                    const config = state.simTypeConfigs[item.simTypeId];
                    return {
                      id: item.simTypeId,
                      foldTypeId: item.foldTypeId,
                      name: st?.name || '',
                      isDefault: (st as { isDefault?: boolean })?.isDefault || false,
                      config: config
                        ? {
                            params: config.params,
                            condOut: config.condOut,
                            solver: config.solver,
                          }
                        : undefined,
                    };
                  }),
                };
                exportAsFlowData(flowData);
              }}
              className="p-2 hover:bg-white dark:hover:bg-slate-600 rounded"
              title="导出流程数据"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
            </button>
          </div>
          {state.configError && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <span>基础数据加载失败</span>
              <Button
                size="sm"
                variant="outline"
                onClick={state.retryConfig}
                disabled={state.isConfigLoading}
              >
                重试
              </Button>
            </div>
          )}
          {showSimTypeError && (
            <span className="text-sm text-destructive" role="alert">
              {showSimTypeError}
            </span>
          )}
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
              <div className="text-xs text-slate-500 space-y-1 bg-slate-50 dark:bg-slate-900/50 p-2 rounded">
                <div className="flex justify-between">
                  <span>源文件:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                    {originFile.path || originFile.name || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>目标姿态:</span>
                  <span className="font-medium">
                    {foldTypeIds.length > 0
                      ? foldTypeIds
                          .map(id => state.safeFoldTypes.find(f => f.id === id)?.name)
                          .filter(Boolean)
                          .join(', ')
                      : '-'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-400 text-center italic py-2">点击选择项目</div>
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
                  <div className="text-xs text-slate-500 text-center">
                    <span
                      className={`px-2 py-1 rounded ${
                        isFoldTypeSelected
                          ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30'
                          : 'bg-slate-100 dark:bg-slate-700'
                      }`}
                    >
                      {isFoldTypeSelected ? '已选择' : '点击选择'}
                    </span>
                  </div>
                </CanvasNode>

                {/* 该姿态下的仿真类型节点 */}
                {foldTypeData.simTypes.map((simType, simIdx) => {
                  const simTypeNodeY = baseY + simIdx * SIM_TYPE_VERTICAL_SPACING;
                  // 使用姿态+仿真类型组合判断选中状态
                  const isSimTypeSelected = state.selectedSimTypes.some(
                    item => item.foldTypeId === foldTypeData.id && item.simTypeId === simType.id
                  );
                  const config = state.simTypeConfigs[simType.id];

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
                          // 切换仿真类型选择（传入姿态ID和仿真类型ID）
                          state.toggleSimType(foldTypeData.id, simType.id);
                        }}
                      >
                        <div className="text-xs text-slate-500 text-center">
                          {simType.isDefault && (
                            <span className="px-1.5 py-0.5 mr-1 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded">
                              默认
                            </span>
                          )}
                          <span
                            className={`px-2 py-1 rounded ${
                              isFoldTypeSelected && isSimTypeSelected
                                ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30'
                                : 'bg-slate-100 dark:bg-slate-700'
                            }`}
                          >
                            {isSimTypeSelected ? '已选择' : '点击选择'}
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
                            className="absolute border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50/50 dark:bg-slate-900/30"
                            style={{
                              left: CONFIG_BOX_X,
                              top: simTypeNodeY,
                              width: CONFIG_BOX_WIDTH,
                              height: CONFIG_BOX_HEIGHT,
                            }}
                          >
                            <div className="absolute -top-3 left-4 px-2 bg-white dark:bg-slate-800 text-xs text-slate-500 font-medium">
                              {simType.name} 配置
                            </div>
                            <SimTypeConfigBox
                              simType={simType}
                              config={config}
                              solvers={state.safeSolvers}
                              globalSolver={state.globalSolver}
                              drawerMode={state.drawerMode}
                              activeSimTypeId={state.activeSimTypeId}
                              onOpenParams={() => openParamsDrawer(simType.id)}
                              onOpenCondOut={() => openCondOutDrawer(simType.id)}
                              onOpenSolver={() => openSolverDrawer(simType.id)}
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
      </div>

      {/* 配置抽屉 */}
      <ConfigDrawer
        isOpen={state.isDrawerOpen}
        onClose={() => state.setIsDrawerOpen(false)}
        title={getDrawerTitle()}
      >
        {state.drawerMode === 'project' ? (
          <ProjectDrawerContent
            projects={state.projects}
            foldTypes={state.safeFoldTypes}
            control={form.control}
            setValue={form.setValue}
            t={t}
          />
        ) : state.drawerMode === 'params' &&
          state.activeSimTypeId &&
          state.simTypeConfigs[state.activeSimTypeId] ? (
          <ParamsDrawerContent
            config={state.simTypeConfigs[state.activeSimTypeId]}
            simTypeId={state.activeSimTypeId}
            paramDefs={state.safeParamDefs}
            paramGroups={state.safeParamGroups}
            conditionConfig={
              foldTypeIds.length > 0
                ? state.getConditionConfig(foldTypeIds[0], state.activeSimTypeId)
                : undefined
            }
            onUpdate={updates => state.updateSimTypeConfig(state.activeSimTypeId!, updates)}
          />
        ) : state.drawerMode === 'condOut' &&
          state.activeSimTypeId &&
          state.simTypeConfigs[state.activeSimTypeId] ? (
          <CondOutDrawerContent
            config={state.simTypeConfigs[state.activeSimTypeId]}
            simTypeId={state.activeSimTypeId}
            conditionDefs={state.safeConditionDefs}
            outputDefs={state.safeOutputDefs}
            condOutSets={state.safeCondOutSets}
            conditionConfig={
              foldTypeIds.length > 0
                ? state.getConditionConfig(foldTypeIds[0], state.activeSimTypeId)
                : undefined
            }
            onUpdate={updates => state.updateSimTypeConfig(state.activeSimTypeId!, updates)}
          />
        ) : state.drawerMode === 'solver' &&
          state.activeSimTypeId &&
          state.simTypeConfigs[state.activeSimTypeId] ? (
          <SolverDrawerContent
            config={state.simTypeConfigs[state.activeSimTypeId]}
            solvers={state.safeSolvers}
            globalSolver={state.globalSolver}
            onUpdate={updates => state.updateSolverConfig(state.activeSimTypeId!, updates)}
            onGlobalSolverChange={state.setGlobalSolver}
            onApplyToAll={state.applySolverToAll}
          />
        ) : (
          <div className="text-center text-slate-500 py-8">请选择配置项</div>
        )}
      </ConfigDrawer>
    </div>
  );
};

export default Submission;
