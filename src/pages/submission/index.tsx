import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores';
import { RESOURCES } from '@/locales';
import { Button } from '@/components/ui';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FolderIcon,
  CubeIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline';

import { useSubmissionState, useCanvasInteraction } from './hooks';
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
  const t = (key: string) => RESOURCES[language][key] || key;
  const containerRef = useRef<HTMLDivElement>(null);

  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionFormSchema),
    defaultValues: {
      projectId: null,
      originFile: { type: 1, path: '', name: '' },
      foldTypeId: 1,
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
  const foldTypeId = useWatch({ control: form.control, name: 'foldTypeId' }) ?? 1;
  const simTypeError = form.formState.errors.simTypeIds?.message;
  const isSubmitted = form.formState.isSubmitted;
  const showSimTypeError = isSubmitted ? simTypeError : undefined;

  // 使用自定义 hooks
  const state = useSubmissionState(selectedProjectId);
  const canvas = useCanvasInteraction({
    transform: state.transform,
    setTransform: state.setTransform,
    isDragging: state.isDragging,
    setIsDragging: state.setIsDragging,
    startPan: state.startPan,
    setStartPan: state.setStartPan,
  });

  useEffect(() => {
    form.setValue('simTypeIds', state.selectedSimTypeIds, { shouldValidate: isSubmitted });
  }, [form, state.selectedSimTypeIds, isSubmitted]);

  useEffect(() => {
    if (state.safeFoldTypes.length === 0) return;
    const currentFoldTypeId = form.getValues('foldTypeId');
    if (!state.safeFoldTypes.some(ft => ft.id === currentFoldTypeId)) {
      form.setValue('foldTypeId', state.safeFoldTypes[0].id, { shouldValidate: true });
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
    values => {
      const orderData = {
        projectId: values.projectId,
        originFile: values.originFile,
        foldTypeId: values.foldTypeId,
        remark: values.remark,
        simTypeIds: values.simTypeIds,
        simTypeConfigs: state.selectedSimTypeIds.map(id => state.simTypeConfigs[id]),
      };

      // TODO: 调用 API 提交订单
      // eslint-disable-next-line no-console
      console.log('提交订单:', orderData);
      alert('提交成功！（演示）');
      navigate('/orders');
    },
    errors => {
      if (errors.projectId || errors.originFile || errors.foldTypeId || errors.remark) {
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
          if (errors.foldTypeId) {
            form.setFocus('foldTypeId');
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
    SIM_TYPE_NODE_X,
    SIM_TYPE_NODE_WIDTH,
    CONFIG_BOX_X,
    CONFIG_BOX_WIDTH,
    CONFIG_BOX_HEIGHT,
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
            >
              <MagnifyingGlassMinusIcon className="w-5 h-5" />
            </button>
            <span className="px-2 text-sm font-medium min-w-[50px] text-center">
              {Math.round(state.transform.scale * 100)}%
            </span>
            <button
              onClick={canvas.zoomIn}
              className="p-2 hover:bg-white dark:hover:bg-slate-600 rounded"
            >
              <MagnifyingGlassPlusIcon className="w-5 h-5" />
            </button>
            <button
              onClick={canvas.resetView}
              className="p-2 hover:bg-white dark:hover:bg-slate-600 rounded"
            >
              <ArrowsPointingOutIcon className="w-5 h-5" />
            </button>
          </div>
          {showSimTypeError && (
            <span className="text-sm text-destructive" role="alert">
              {showSimTypeError}
            </span>
          )}
          <Button variant="primary" onClick={handleSubmit}>
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
                  <span>折叠类型:</span>
                  <span className="font-medium">
                    {state.safeFoldTypes.find(f => f.id === foldTypeId)?.name || '-'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-400 text-center italic py-2">点击选择项目</div>
            )}
          </CanvasNode>

          {/* 仿真类型节点 */}
          {state.safeSimTypes.map((simType, idx) => {
            const nodeY = state.getSimTypeNodeY(idx);
            const isSelected = state.selectedSimTypeIds.includes(simType.id);
            const config = state.simTypeConfigs[simType.id];
            const projectNodeY = state.getProjectNodeY();

            return (
              <React.Fragment key={simType.id}>
                {/* 连接线: 项目 -> 仿真类型 */}
                <ConnectionLine
                  x1={PROJECT_NODE_X + PROJECT_NODE_WIDTH}
                  y1={projectNodeY + LINE_OFFSET_Y}
                  x2={SIM_TYPE_NODE_X}
                  y2={nodeY + LINE_OFFSET_Y}
                  isActive={isSelected}
                />

                <CanvasNode
                  title={simType.name}
                  x={SIM_TYPE_NODE_X}
                  y={nodeY}
                  width={SIM_TYPE_NODE_WIDTH}
                  icon={<CubeIcon className="w-6 h-6" />}
                  isActive={isSelected}
                  onClick={() => state.toggleSimType(simType.id)}
                >
                  <div className="text-xs text-slate-500 text-center">
                    <span
                      className={`px-2 py-1 rounded ${
                        isSelected
                          ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30'
                          : 'bg-slate-100 dark:bg-slate-700'
                      }`}
                    >
                      {isSelected ? '已选择' : '点击选择'}
                    </span>
                  </div>
                </CanvasNode>

                {/* 配置模块组 */}
                {isSelected && config && (
                  <>
                    <ConnectionLine
                      x1={SIM_TYPE_NODE_X + SIM_TYPE_NODE_WIDTH}
                      y1={nodeY + LINE_OFFSET_Y}
                      x2={CONFIG_BOX_X}
                      y2={nodeY + CONFIG_BOX_HEIGHT / 2}
                      isActive={true}
                    />
                    <div
                      className="absolute border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50/50 dark:bg-slate-900/30"
                      style={{
                        left: CONFIG_BOX_X,
                        top: nodeY,
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
            paramTplSets={state.safeParamTplSets}
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
