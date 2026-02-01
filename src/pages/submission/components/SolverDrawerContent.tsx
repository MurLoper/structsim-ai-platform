import React from 'react';
import type { SimTypeConfig, SolverConfig, GlobalSolverConfig } from '../types';
import type { Solver, SolverResource } from '@/types/config';

interface SolverDrawerContentProps {
  config: SimTypeConfig;
  solvers: Solver[];
  resourcePools?: SolverResource[];
  globalSolver: GlobalSolverConfig;
  onUpdate: (updates: Partial<SolverConfig>) => void;
  onGlobalSolverChange: (config: GlobalSolverConfig) => void;
  onApplyToAll: (updates: Partial<SolverConfig>) => void;
  t?: (key: string) => string;
}

export const SolverDrawerContent: React.FC<SolverDrawerContentProps> = ({
  config,
  solvers,
  resourcePools = [],
  globalSolver,
  onUpdate,
  onGlobalSolverChange,
  onApplyToAll,
  t = (key: string) => key,
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
                  double: config.solver.double,
                  resourceId: config.solver.resourceId,
                });
              }
            }}
            className="rounded"
          />
          <div>
            <div className="text-sm font-bold text-purple-700 dark:text-purple-300">
              {t('sub.solver.apply_all')}
            </div>
            <div className="text-xs text-purple-500">{t('sub.solver.apply_all_desc')}</div>
          </div>
        </label>
      </div>

      {/* 求解器选择 */}
      <div>
        <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
          {t('sub.solver.select')}
        </label>
        <select
          className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
          value={config.solver.solverId}
          onChange={e => {
            const solver = solvers.find(s => s.id === Number(e.target.value));
            handleChange({
              solverId: Number(e.target.value),
              solverVersion: solver?.version || '',
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

      {/* CPU类型 */}
      <div>
        <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
          {t('sub.solver.compute_mode')}
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
            <div className="text-sm font-bold">{t('sub.single_node')}</div>
            <div className="text-xs text-slate-500 mt-1">{t('sub.solver.no_parallel')}</div>
          </button>
          <button
            onClick={() => handleChange({ cpuType: 1, cpuCores: 16 })}
            className={`p-4 rounded-lg border-2 transition-all ${
              config.solver.cpuType === 1
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
            }`}
          >
            <div className="text-sm font-bold">{t('sub.solver.parallel')}</div>
            <div className="text-xs text-slate-500 mt-1">{t('sub.solver.server_node')}</div>
          </button>
        </div>
      </div>

      {/* CPU核数 - 仅并行模式显示 */}
      {config.solver.cpuType === 1 && (
        <div>
          <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
            {t('sub.solver.cpu_cores')}
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
            <span className="font-bold text-brand-600 text-lg">
              {config.solver.cpuCores} {t('sub.cores')}
            </span>
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
                {cores}
                {t('sub.cores')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 双精度设置 */}
      <div>
        <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
          {t('sub.solver.double')}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleChange({ double: 0 })}
            className={`p-3 rounded-lg border-2 transition-all ${
              config.solver.double === 0
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
            }`}
          >
            <div className="text-sm font-bold">{t('sub.solver.double_off')}</div>
          </button>
          <button
            onClick={() => handleChange({ double: 1 })}
            className={`p-3 rounded-lg border-2 transition-all ${
              config.solver.double === 1
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
            }`}
          >
            <div className="text-sm font-bold">{t('sub.solver.double_on')}</div>
          </button>
        </div>
      </div>

      {/* 资源池选择 - 选择求解器后显示 */}
      {config.solver.solverId > 0 && resourcePools.length > 0 && (
        <div>
          <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
            {t('sub.solver.resource')}
          </label>
          <select
            className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            value={config.solver.resourceId ?? ''}
            onChange={e =>
              handleChange({ resourceId: e.target.value ? Number(e.target.value) : null })
            }
          >
            <option value="">-- {t('sub.solver.resource_select')} --</option>
            {resourcePools
              .filter(r => r.valid === 1)
              .map(pool => (
                <option key={pool.id} value={pool.id}>
                  {pool.name}
                </option>
              ))}
          </select>
        </div>
      )}
    </div>
  );
};
