import React from 'react';
import { CogIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import type { SimTypeConfig, DrawerMode, GlobalSolverConfig } from '../types';
import type { Solver } from '@/api/config';

interface SimTypeConfigBoxProps {
  simType: { id: number; name: string };
  config: SimTypeConfig;
  solvers: Solver[];
  globalSolver: GlobalSolverConfig;
  drawerMode: DrawerMode;
  activeSimTypeId: number | null;
  onOpenParams: () => void;
  onOpenCondOut: () => void;
  onOpenSolver: () => void;
}

export const SimTypeConfigBox: React.FC<SimTypeConfigBoxProps> = ({
  simType,
  config,
  solvers,
  globalSolver,
  drawerMode,
  activeSimTypeId,
  onOpenParams,
  onOpenCondOut,
  onOpenSolver,
}) => {
  const hasParams =
    config.params.mode === 'template'
      ? config.params.templateSetId
      : Object.keys(config.params.customValues).length > 0;
  const hasCondOut =
    config.condOut.mode === 'template'
      ? config.condOut.condOutSetId
      : config.condOut.selectedOutputIds.length > 0;
  const hasSolver = config.solver.solverId > 0;

  const isParamsActive = drawerMode === 'params' && activeSimTypeId === simType.id;
  const isCondOutActive = drawerMode === 'condOut' && activeSimTypeId === simType.id;
  const isSolverActive = drawerMode === 'solver' && activeSimTypeId === simType.id;

  return (
    <div className="flex gap-3 p-3 pt-4">
      {/* 参数配置模块 */}
      <div
        className={`flex-1 bg-white dark:bg-slate-800 rounded-lg border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
          isParamsActive
            ? 'border-brand-500 ring-2 ring-brand-200'
            : hasParams
              ? 'border-green-400'
              : 'border-slate-200 dark:border-slate-700'
        }`}
        onClick={onOpenParams}
      >
        <div className="flex items-center gap-2 mb-2">
          <CogIcon className="w-4 h-4 text-brand-500" />
          <span className="text-sm font-semibold">参数配置</span>
          {hasParams && <CheckCircleIcon className="w-4 h-4 text-green-500 ml-auto" />}
        </div>
        <div className="text-xs space-y-1 text-slate-500">
          <div className="flex justify-between">
            <span>模式:</span>
            <span className="font-medium">
              {config.params.mode === 'template' ? '模板' : '自定义'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>算法:</span>
            <span
              className={`font-medium ${config.params.algorithm === 'bayesian' ? 'text-purple-600' : 'text-blue-600'}`}
            >
              {config.params.algorithm === 'bayesian' ? '贝叶斯' : 'DOE'}
            </span>
          </div>
        </div>
      </div>

      {/* 工况输出模块 */}
      <div
        className={`flex-1 bg-white dark:bg-slate-800 rounded-lg border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
          isCondOutActive
            ? 'border-brand-500 ring-2 ring-brand-200'
            : hasCondOut
              ? 'border-green-400'
              : 'border-slate-200 dark:border-slate-700'
        }`}
        onClick={onOpenCondOut}
      >
        <div className="flex items-center gap-2 mb-2">
          <CogIcon className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-semibold">工况 & 输出</span>
          {hasCondOut && <CheckCircleIcon className="w-4 h-4 text-green-500 ml-auto" />}
        </div>
        <div className="text-xs space-y-1 text-slate-500">
          <div className="flex justify-between">
            <span>模式:</span>
            <span className="font-medium">
              {config.condOut.mode === 'template' ? '模板' : '自定义'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>工况/输出:</span>
            <span className="font-medium text-brand-600">
              {config.condOut.selectedConditionIds.length}/{config.condOut.selectedOutputIds.length}
            </span>
          </div>
        </div>
      </div>

      {/* 求解器模块 */}
      <div
        className={`flex-1 bg-white dark:bg-slate-800 rounded-lg border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
          isSolverActive
            ? 'border-brand-500 ring-2 ring-brand-200'
            : hasSolver
              ? 'border-green-400'
              : 'border-slate-200 dark:border-slate-700'
        }`}
        onClick={onOpenSolver}
      >
        <div className="flex items-center gap-2 mb-2">
          <CogIcon className="w-4 h-4 text-green-500" />
          <span className="text-sm font-semibold">求解器</span>
          {hasSolver && <CheckCircleIcon className="w-4 h-4 text-green-500 ml-auto" />}
        </div>
        <div className="text-xs space-y-1 text-slate-500">
          <div className="flex justify-between">
            <span>求解器:</span>
            <span className="font-medium truncate max-w-[80px]">
              {solvers.find(s => s.id === config.solver.solverId)?.name || '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>模式:</span>
            <span
              className={`font-medium ${config.solver.cpuType === 1 ? 'text-green-600' : 'text-slate-500'}`}
            >
              {config.solver.cpuType === 1 ? `${config.solver.cpuCores}核` : '单节点'}
            </span>
          </div>
          {globalSolver.applyToAll && (
            <div className="text-purple-500 text-[10px]">使用全局配置</div>
          )}
        </div>
      </div>
    </div>
  );
};
