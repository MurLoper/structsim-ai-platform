import React from 'react';
import type { SimTypeConfig, SolverConfig, GlobalSolverConfig } from '../types';
import type { Solver } from '@/api/config';

interface SolverDrawerContentProps {
  config: SimTypeConfig;
  solvers: Solver[];
  globalSolver: GlobalSolverConfig;
  selectedSimTypeIds: number[];
  onUpdate: (updates: Partial<SolverConfig>) => void;
  onGlobalSolverChange: (config: GlobalSolverConfig) => void;
  onApplyToAll: (updates: Partial<SolverConfig>) => void;
}

export const SolverDrawerContent: React.FC<SolverDrawerContentProps> = ({
  config,
  solvers,
  globalSolver,
  selectedSimTypeIds,
  onUpdate,
  onGlobalSolverChange,
  onApplyToAll,
}) => {
  const handleChange = (updates: Partial<SolverConfig>) => {
    onUpdate(updates);
    if (globalSolver.applyToAll) {
      onGlobalSolverChange({ ...globalSolver, ...updates });
      onApplyToAll(updates);
    }
  };

  return (
    <div className="space-y-6">
      {/* 应用到所有仿真类型 */}
      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={globalSolver.applyToAll}
            onChange={e => {
              onGlobalSolverChange({ ...globalSolver, applyToAll: e.target.checked });
              if (e.target.checked) {
                onApplyToAll({
                  solverId: config.solver.solverId,
                  solverVersion: config.solver.solverVersion,
                  cpuType: config.solver.cpuType,
                  cpuCores: config.solver.cpuCores,
                });
              }
            }}
            className="rounded"
          />
          <div>
            <div className="text-sm font-bold text-purple-700 dark:text-purple-300">
              应用到所有仿真类型
            </div>
            <div className="text-xs text-purple-500">统一配置减少重复设置</div>
          </div>
        </label>
      </div>

      {/* 求解器选择 */}
      <div>
        <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
          求解器
        </label>
        <select
          className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
          value={config.solver.solverId}
          onChange={e => {
            const solver = solvers.find(s => s.id === Number(e.target.value));
            handleChange({
              solverId: Number(e.target.value),
              solverVersion: solver?.version || '2024',
            });
          }}
        >
          {solvers.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* 求解器版本 */}
      <div>
        <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
          版本
        </label>
        <select
          className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
          value={config.solver.solverVersion}
          onChange={e => handleChange({ solverVersion: e.target.value })}
        >
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
        </select>
      </div>

      {/* CPU类型 */}
      <div>
        <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
          计算模式
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleChange({ cpuType: -1, cpuCores: -1 })}
            className={`p-4 rounded-lg border-2 transition-all ${
              config.solver.cpuType === -1
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
            }`}
          >
            <div className="text-sm font-bold">单节点</div>
            <div className="text-xs text-slate-500 mt-1">不并行计算</div>
          </button>
          <button
            onClick={() => handleChange({ cpuType: 1, cpuCores: 16 })}
            className={`p-4 rounded-lg border-2 transition-all ${
              config.solver.cpuType === 1
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
            }`}
          >
            <div className="text-sm font-bold">并行计算</div>
            <div className="text-xs text-slate-500 mt-1">服务器节点</div>
          </button>
        </div>
      </div>

      {/* CPU核数 - 仅并行模式显示 */}
      {config.solver.cpuType === 1 && (
        <div>
          <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
            CPU 核数
          </label>
          <input
            type="range"
            min="1"
            max="512"
            step="1"
            className="w-full"
            value={config.solver.cpuCores}
            onChange={e => handleChange({ cpuCores: Number(e.target.value) })}
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>1</span>
            <span className="font-bold text-brand-600 text-lg">{config.solver.cpuCores} 核</span>
            <span>512</span>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[16, 32, 64, 128, 256, 512].map(cores => (
              <button
                key={cores}
                onClick={() => handleChange({ cpuCores: cores })}
                className={`py-2 text-sm rounded border transition-all ${
                  config.solver.cpuCores === cores
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'border-slate-300 dark:border-slate-600 hover:border-brand-300'
                }`}
              >
                {cores}核
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
