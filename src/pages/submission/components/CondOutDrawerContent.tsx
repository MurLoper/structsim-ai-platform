import React, { useMemo } from 'react';
import type { SimTypeConfig } from '../types';
import type { ConditionDef, OutputDef, CondOutSet, ConditionConfig } from '@/types/config';

interface CondOutDrawerContentProps {
  config: SimTypeConfig;
  simTypeId: number;
  conditionDefs: ConditionDef[];
  outputDefs: OutputDef[];
  condOutSets: CondOutSet[];
  conditionConfig?: ConditionConfig;
  onUpdate: (updates: Partial<SimTypeConfig>) => void;
}

export const CondOutDrawerContent: React.FC<CondOutDrawerContentProps> = ({
  config,
  simTypeId,
  conditionDefs,
  outputDefs,
  condOutSets,
  conditionConfig,
  onUpdate,
}) => {
  // 根据工况配置筛选输出组，如果没有工况配置则按 simTypeId 筛选
  const filteredCondOutSets = useMemo(() => {
    if (conditionConfig?.outputGroupIds?.length) {
      return condOutSets.filter(s => conditionConfig.outputGroupIds.includes(s.id));
    }
    return condOutSets.filter(s => s.simTypeId === simTypeId);
  }, [condOutSets, conditionConfig, simTypeId]);

  const toggleCondition = (condId: number) => {
    const current = config.condOut.selectedConditionIds;
    const newIds = current.includes(condId)
      ? current.filter(id => id !== condId)
      : [...current, condId];
    onUpdate({ condOut: { ...config.condOut, selectedConditionIds: newIds } });
  };

  const toggleOutput = (outputId: number) => {
    const current = config.condOut.selectedOutputIds;
    const newIds = current.includes(outputId)
      ? current.filter(id => id !== outputId)
      : [...current, outputId];
    onUpdate({ condOut: { ...config.condOut, selectedOutputIds: newIds } });
  };

  return (
    <div className="space-y-5">
      {/* 配置模式切换 */}
      <div>
        <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
          配置模式
        </label>
        <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
          <button
            onClick={() => onUpdate({ condOut: { ...config.condOut, mode: 'template' } })}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              config.condOut.mode === 'template'
                ? 'bg-white dark:bg-slate-600 shadow text-brand-600'
                : 'text-slate-500'
            }`}
          >
            应用模板
          </button>
          <button
            onClick={() => onUpdate({ condOut: { ...config.condOut, mode: 'custom' } })}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              config.condOut.mode === 'custom'
                ? 'bg-white dark:bg-slate-600 shadow text-brand-600'
                : 'text-slate-500'
            }`}
          >
            自定义
          </button>
        </div>
      </div>

      {/* 工况输出集模板选择 */}
      {config.condOut.mode === 'template' && (
        <div>
          <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
            工况输出集
          </label>
          <select
            className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            value={config.condOut.condOutSetId || ''}
            onChange={e =>
              onUpdate({
                condOut: { ...config.condOut, condOutSetId: Number(e.target.value) || null },
              })
            }
          >
            <option value="">-- 选择工况输出集 --</option>
            {filteredCondOutSets.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 自定义工况选择 */}
      {config.condOut.mode === 'custom' && (
        <>
          <div>
            <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
              工况选择
            </label>
            <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
              {conditionDefs.map(cond => {
                const isChecked = config.condOut.selectedConditionIds.includes(cond.id);
                return (
                  <label
                    key={cond.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300'
                        : 'bg-slate-50 dark:bg-slate-700/50'
                    } border`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCondition(cond.id)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{cond.name}</div>
                      <div className="text-xs text-slate-400">{cond.code}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 自定义输出指标选择 */}
          <div>
            <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
              输出指标
            </label>
            <div className="grid grid-cols-2 gap-2">
              {outputDefs.map(output => {
                const isChecked = config.condOut.selectedOutputIds.includes(output.id);
                return (
                  <label
                    key={output.id}
                    className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-brand-100 dark:bg-brand-900/30 border-brand-300'
                        : 'bg-slate-50 dark:bg-slate-700/50'
                    } border`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOutput(output.id)}
                      className="rounded"
                    />
                    <div>
                      <span className="text-sm font-medium">{output.name}</span>
                      {output.unit && (
                        <span className="text-xs text-slate-400 ml-1">({output.unit})</span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
