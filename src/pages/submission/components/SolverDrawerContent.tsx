import React, { useCallback, useEffect, useMemo } from 'react';
import { FormItem, Checkbox } from '@/components/ui';
import type { SimTypeConfig, SolverConfig, GlobalSolverConfig } from '../types';
import type { Solver } from '@/types/config';

interface ResourcePoolOption {
  id: number;
  name: string;
  valid?: number;
  cpuCores?: number;
}

interface SolverDrawerContentProps {
  config: SimTypeConfig;
  solvers: Solver[];
  resourcePools?: ResourcePoolOption[];
  globalSolver: GlobalSolverConfig;
  /** 用户允许的最大 CPU 核数，优先取 submit-limits 实时接口 */
  maxCpuCores?: number;
  onUpdate: (updates: Partial<SolverConfig>) => void;
  onGlobalSolverChange: (config: GlobalSolverConfig) => void;
  onApplyToAll: (updates: Partial<SolverConfig>) => void;
  t?: (key: string) => string;
}

const DEFAULT_MAX_CPU = 192;
const MACHINE_MAX_CPU = 96;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const SolverDrawerContent: React.FC<SolverDrawerContentProps> = ({
  config,
  solvers,
  resourcePools = [],
  globalSolver,
  maxCpuCores = DEFAULT_MAX_CPU,
  onUpdate,
  onGlobalSolverChange,
  onApplyToAll,
  t = (key: string) => key,
}) => {
  const selectedSolver = solvers.find(s => s.id === config.solver.solverId);
  const externalSolverId = Number(selectedSolver?.code);
  const isGpuSolver = Number.isFinite(externalSolverId) && externalSolverId === 0;
  const solverParallelMax =
    typeof selectedSolver?.cpuCoreMax === 'number' && selectedSolver.cpuCoreMax > 0
      ? selectedSolver.cpuCoreMax
      : DEFAULT_MAX_CPU;
  const solverParallelDefault =
    typeof selectedSolver?.cpuCoreDefault === 'number' && selectedSolver.cpuCoreDefault > 0
      ? selectedSolver.cpuCoreDefault
      : 16;
  const parallelMax = Math.max(1, Math.min(maxCpuCores, solverParallelMax));

  const normalizeSingleNodeCores = useCallback((value: number): number => {
    if (value === -1) return -1;
    return clamp(Number.isFinite(value) ? value : 1, 1, MACHINE_MAX_CPU);
  }, []);

  const normalizeParallelCores = useCallback(
    (value: number): number => {
      return clamp(Number.isFinite(value) ? value : solverParallelDefault, 1, parallelMax);
    },
    [parallelMax, solverParallelDefault]
  );

  const handleChange = useCallback(
    (updates: Partial<SolverConfig>) => {
      onUpdate(updates);
      if (globalSolver.applyToAll) {
        onGlobalSolverChange({ ...globalSolver, ...updates });
        onApplyToAll(updates);
      }
    },
    [globalSolver, onApplyToAll, onGlobalSolverChange, onUpdate]
  );

  const singleNodeSliderValue =
    config.solver.cpuCores <= 0 ? 0 : normalizeSingleNodeCores(config.solver.cpuCores);
  const parallelSliderValue = normalizeParallelCores(config.solver.cpuCores);

  const quickCoreOptions = useMemo(() => {
    const candidates = [solverParallelDefault, 8, 16, 24, 32, 48, 64, 96, 128, 160, 192];
    return Array.from(new Set(candidates))
      .filter(core => core >= 1 && core <= parallelMax)
      .sort((a, b) => a - b);
  }, [parallelMax, solverParallelDefault]);

  const singleNodeQuickOptions = useMemo(() => {
    const candidates = [-1, 8, 16, 32, 48, 64, 96];
    return candidates.filter(core => core === -1 || (core >= 1 && core <= MACHINE_MAX_CPU));
  }, []);

  useEffect(() => {
    if (isGpuSolver) {
      return;
    }
    if (config.solver.cpuType === 1) {
      const normalized = normalizeParallelCores(config.solver.cpuCores);
      if (normalized !== config.solver.cpuCores) {
        handleChange({ cpuCores: normalized });
      }
      return;
    }
    const normalized = normalizeSingleNodeCores(config.solver.cpuCores);
    if (normalized !== config.solver.cpuCores) {
      handleChange({ cpuCores: normalized });
    }
  }, [
    config.solver.cpuCores,
    config.solver.cpuType,
    handleChange,
    isGpuSolver,
    normalizeParallelCores,
    normalizeSingleNodeCores,
    selectedSolver?.id,
  ]);

  return (
    <div className="space-y-6">
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

      <FormItem label={t('sub.solver.select')}>
        <select
          className="w-full p-3 border rounded-lg bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring"
          value={config.solver.solverId}
          onChange={e => {
            const solver = solvers.find(s => s.id === Number(e.target.value));
            const nextExternalSolverId = Number(solver?.code);
            const nextIsGpu = Number.isFinite(nextExternalSolverId) && nextExternalSolverId === 0;
            const nextDefaultCores =
              typeof solver?.cpuCoreDefault === 'number' && solver.cpuCoreDefault > 0
                ? solver.cpuCoreDefault
                : 16;
            handleChange({
              solverId: Number(e.target.value),
              solverVersion: solver?.version || '',
              cpuType: nextIsGpu ? -1 : 1,
              cpuCores: nextIsGpu ? -1 : normalizeParallelCores(nextDefaultCores),
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

      {!isGpuSolver && (
        <>
          <FormItem label={t('sub.solver.compute_mode')}>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() =>
                  handleChange({
                    cpuType: -1,
                    cpuCores: normalizeSingleNodeCores(config.solver.cpuCores || -1),
                  })
                }
                className={`p-4 rounded-lg border-2 transition-all ${
                  config.solver.cpuType === -1
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-sm font-bold text-foreground">{t('sub.single_node')}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t('sub.solver.no_parallel')}
                </div>
              </button>
              <button
                onClick={() =>
                  handleChange({
                    cpuType: 1,
                    cpuCores: normalizeParallelCores(
                      config.solver.cpuCores || solverParallelDefault
                    ),
                  })
                }
                className={`p-4 rounded-lg border-2 transition-all ${
                  config.solver.cpuType === 1
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-sm font-bold text-foreground">{t('sub.solver.parallel')}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t('sub.solver.server_node')}
                </div>
              </button>
            </div>
          </FormItem>

          <FormItem label={t('sub.solver.cpu_cores')}>
            {config.solver.cpuType === 1 ? (
              <div className="space-y-3">
                <input
                  type="range"
                  min="1"
                  max={parallelMax}
                  step="1"
                  className="w-full accent-primary"
                  value={parallelSliderValue}
                  onChange={e =>
                    handleChange({ cpuCores: normalizeParallelCores(Number(e.target.value)) })
                  }
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>1 核</span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                    当前 {parallelSliderValue} 核
                  </span>
                  <span>{parallelMax} 核</span>
                </div>
                {quickCoreOptions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {quickCoreOptions.map(cores => (
                      <button
                        key={cores}
                        type="button"
                        onClick={() => handleChange({ cpuCores: cores })}
                        className={`rounded-full border px-3 py-1 text-sm transition-all ${
                          parallelSliderValue === cores
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {cores} 核
                      </button>
                    ))}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  并行模式范围：1-{parallelMax} 核
                  {`，权限上限 ${maxCpuCores} 核，求解器上限 ${solverParallelMax} 核`}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="range"
                  min="0"
                  max={String(MACHINE_MAX_CPU)}
                  step="1"
                  className="w-full accent-primary"
                  value={singleNodeSliderValue}
                  onChange={e => {
                    const sliderValue = Number(e.target.value);
                    handleChange({
                      cpuCores: sliderValue === 0 ? -1 : normalizeSingleNodeCores(sliderValue),
                    });
                  }}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>-1 全部核数</span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                    当前 {singleNodeSliderValue === 0 ? '-1' : singleNodeSliderValue} 核
                  </span>
                  <span>96 核</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {singleNodeQuickOptions.map(cores => (
                    <button
                      key={cores}
                      type="button"
                      onClick={() => handleChange({ cpuCores: cores })}
                      className={`rounded-full border px-3 py-1 text-sm transition-all ${
                        config.solver.cpuCores === cores
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {cores === -1 ? '全部核数' : `${cores} 核`}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  单节点模式范围：-1 或 1-96，0 核已禁用（-1 表示使用节点全部核数）
                </div>
              </div>
            )}
          </FormItem>
        </>
      )}

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

      {resourcePools.length > 0 && (
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
              .filter(r => (typeof r.valid === 'number' ? r.valid === 1 : true))
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
