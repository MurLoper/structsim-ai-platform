import React from 'react';
import { FormItem, Checkbox } from '@/components/ui';
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
      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
        <Checkbox
          checked={globalSolver.applyToAll}
          onChange={e => {
            onGlobalSolverChange({
              ...globalSolver,
              applyToAll: (e.target as HTMLInputElement).checked,
            });
            if ((e.target as HTMLInputElement).checked) {
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
          label={t('sub.solver.apply_all')}
        />
        <p className="text-xs text-muted-foreground ml-6">{t('sub.solver.apply_all_desc')}</p>
      </div>

      {/* 求解器选择 */}
      <FormItem label={t('sub.solver.select')}>
        <select
          className="w-full p-3 border rounded-lg bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring"
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
      </FormItem>

      {/* CPU类型 */}
      <FormItem label={t('sub.solver.compute_mode')}>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleChange({ cpuType: -1, cpuCores: -1 })}
            className={`p-4 rounded-lg border-2 transition-all ${
              config.solver.cpuType === -1
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="text-sm font-bold text-foreground">{t('sub.single_node')}</div>
            <div className="text-xs text-muted-foreground mt-1">{t('sub.solver.no_parallel')}</div>
          </button>
          <button
            onClick={() => handleChange({ cpuType: 1, cpuCores: 16 })}
            className={`p-4 rounded-lg border-2 transition-all ${
              config.solver.cpuType === 1
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="text-sm font-bold text-foreground">{t('sub.solver.parallel')}</div>
            <div className="text-xs text-muted-foreground mt-1">{t('sub.solver.server_node')}</div>
          </button>
        </div>
      </FormItem>

      {/* CPU核数 - 仅并行模式显示 */}
      {config.solver.cpuType === 1 && (
        <FormItem label={t('sub.solver.cpu_cores')}>
          <input
            type="range"
            min="1"
            max="512"
            step="1"
            className="w-full"
            value={config.solver.cpuCores}
            onChange={e => handleChange({ cpuCores: Number(e.target.value) })}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>1</span>
            <span className="font-bold text-primary text-lg">
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
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {cores}
                {t('sub.cores')}
              </button>
            ))}
          </div>
        </FormItem>
      )}

      {/* 双精度设置 */}
      <FormItem label={t('sub.solver.double')}>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleChange({ double: 0 })}
            className={`p-3 rounded-lg border-2 transition-all ${
              config.solver.double === 0
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="text-sm font-bold text-foreground">{t('sub.solver.double_off')}</div>
          </button>
          <button
            onClick={() => handleChange({ double: 1 })}
            className={`p-3 rounded-lg border-2 transition-all ${
              config.solver.double === 1
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="text-sm font-bold text-foreground">{t('sub.solver.double_on')}</div>
          </button>
        </div>
      </FormItem>

      {/* 资源池选择 - 选择求解器后显示 */}
      {config.solver.solverId > 0 && resourcePools.length > 0 && (
        <FormItem label={t('sub.solver.resource')}>
          <select
            className="w-full p-3 border rounded-lg bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring"
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
        </FormItem>
      )}
    </div>
  );
};
