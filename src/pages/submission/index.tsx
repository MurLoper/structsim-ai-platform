import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores';
import { RESOURCES } from '@/locales';
import { Button } from '@/components/ui';
import {
  FolderIcon,
  CubeIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline';

import { useSubmissionState, useCanvasInteraction } from './hooks';
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

  // 使用自定义 hooks
  const state = useSubmissionState();
  const canvas = useCanvasInteraction({
    transform: state.transform,
    setTransform: state.setTransform,
    isDragging: state.isDragging,
    setIsDragging: state.setIsDragging,
    startPan: state.startPan,
    setStartPan: state.setStartPan,
  });

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
  const handleSubmit = () => {
    if (!state.selectedProjectId) {
      alert(t('sub.error.project') || '请选择项目');
      return;
    }
    if (state.selectedSimTypeIds.length === 0) {
      alert(t('sub.error.sim_type') || '请至少选择一个仿真类型');
      return;
    }
    if (!state.originFile.path && !state.originFile.name) {
      alert(t('sub.error.source') || '请填写源文件信息');
      return;
    }

    const orderData = {
      projectId: state.selectedProjectId,
      originFile: state.originFile,
      foldTypeId: state.foldTypeId,
      remark: state.remark,
      simTypeIds: state.selectedSimTypeIds,
      simTypeConfigs: state.selectedSimTypeIds.map(id => state.simTypeConfigs[id]),
    };

    // TODO: 调用 API 提交订单
    // eslint-disable-next-line no-console
    console.log('提交订单:', orderData);
    alert('提交成功！（演示）');
    navigate('/orders');
  };

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
            isComplete={!!state.selectedProject && !!state.originFile.path}
            onClick={openProjectDrawer}
          >
            {state.selectedProject ? (
              <div className="text-xs text-slate-500 space-y-1 bg-slate-50 dark:bg-slate-900/50 p-2 rounded">
                <div className="flex justify-between">
                  <span>源文件:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                    {state.originFile.path || state.originFile.name || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>折叠类型:</span>
                  <span className="font-medium">
                    {state.safeFoldTypes.find(f => f.id === state.foldTypeId)?.name || '-'}
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
            selectedProjectId={state.selectedProjectId}
            onProjectChange={state.setSelectedProjectId}
            originFile={state.originFile}
            onOriginFileChange={state.setOriginFile}
            foldTypes={state.safeFoldTypes}
            foldTypeId={state.foldTypeId}
            onFoldTypeChange={state.setFoldTypeId}
            remark={state.remark}
            onRemarkChange={state.setRemark}
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
            selectedSimTypeIds={state.selectedSimTypeIds}
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
