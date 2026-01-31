import React, { useMemo } from 'react';
import type { SimTypeConfig } from '../types';
import type { ParamDef, ConditionConfig } from '@/types/config';
import type { ParamGroup } from '@/types/configGroups';

interface ParamsDrawerContentProps {
  config: SimTypeConfig;
  simTypeId: number;
  paramDefs: ParamDef[];
  paramGroups: ParamGroup[];
  conditionConfig?: ConditionConfig;
  onUpdate: (updates: Partial<SimTypeConfig>) => void;
}

export const ParamsDrawerContent: React.FC<ParamsDrawerContentProps> = ({
  config,
  simTypeId,
  paramDefs,
  paramGroups,
  conditionConfig,
  onUpdate,
}) => {
  // 根据工况配置筛选参数组
  const filteredParamGroups = useMemo(() => {
    if (conditionConfig?.paramGroupIds?.length) {
      return paramGroups.filter(g => conditionConfig.paramGroupIds.includes(g.id));
    }
    // 如果没有工况配置，返回所有参数组
    return paramGroups;
  }, [paramGroups, conditionConfig]);

  return (
    <div className="space-y-5">
      {/* 配置模式切换 */}
      <div>
        <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
          配置模式
        </label>
        <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
          <button
            onClick={() => onUpdate({ params: { ...config.params, mode: 'template' } })}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              config.params.mode === 'template'
                ? 'bg-white dark:bg-slate-600 shadow text-brand-600'
                : 'text-slate-500'
            }`}
          >
            应用模板
          </button>
          <button
            onClick={() => onUpdate({ params: { ...config.params, mode: 'custom' } })}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              config.params.mode === 'custom'
                ? 'bg-white dark:bg-slate-600 shadow text-brand-600'
                : 'text-slate-500'
            }`}
          >
            自定义
          </button>
        </div>
      </div>

      {/* 模板选择 */}
      {config.params.mode === 'template' && (
        <div>
          <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
            参数模板集
          </label>
          <select
            className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            value={config.params.templateSetId || ''}
            onChange={e =>
              onUpdate({
                params: { ...config.params, templateSetId: Number(e.target.value) || null },
              })
            }
          >
            <option value="">-- 选择参数组 --</option>
            {filteredParamGroups.map(g => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 优化算法选择 */}
      <div>
        <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
          优化算法
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onUpdate({ params: { ...config.params, algorithm: 'doe' } })}
            className={`p-4 rounded-lg border-2 transition-all ${
              config.params.algorithm === 'doe'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-slate-200 dark:border-slate-600'
            }`}
          >
            <div className="text-sm font-bold text-blue-600">DOE 覆盖</div>
            <div className="text-xs text-slate-500 mt-1">实验设计法</div>
          </button>
          <button
            onClick={() => onUpdate({ params: { ...config.params, algorithm: 'bayesian' } })}
            className={`p-4 rounded-lg border-2 transition-all ${
              config.params.algorithm === 'bayesian'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-slate-200 dark:border-slate-600'
            }`}
          >
            <div className="text-sm font-bold text-purple-600">贝叶斯优化</div>
            <div className="text-xs text-slate-500 mt-1">智能搜索</div>
          </button>
        </div>
      </div>

      {/* 自定义参数 */}
      {config.params.mode === 'custom' && (
        <div>
          <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
            自定义参数值
          </label>
          <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
            {paramDefs.map(param => (
              <div key={param.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{param.name}</span>
                  <span className="text-xs text-slate-500">{param.unit || ''}</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="flex-1 p-2 text-sm border rounded dark:bg-slate-600 dark:border-slate-500"
                    placeholder={`${param.minVal || 0}`}
                    value={config.params.customValues[param.key] || ''}
                    onChange={e => {
                      const newValues = { ...config.params.customValues };
                      newValues[param.key] = Number(e.target.value);
                      onUpdate({ params: { ...config.params, customValues: newValues } });
                    }}
                  />
                  <span className="text-xs text-slate-400 self-center whitespace-nowrap">
                    ({param.minVal} - {param.maxVal})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
