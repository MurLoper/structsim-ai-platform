import React, { useMemo, useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { SimTypeConfig, RespDetail, InpSetInfo } from '../types';
import { TargetType } from '../types';
import type { OutputSet, ConditionConfig } from '@/types/config';
import type { OutputInGroup } from '@/types/configGroups';

interface OutputDrawerContentProps {
  config: SimTypeConfig;
  simTypeId: number;
  outputSets: OutputSet[];
  conditionConfig?: ConditionConfig;
  inpSets?: InpSetInfo[]; // INP 文件解析的 set 集
  onUpdate: (updates: Partial<SimTypeConfig>) => void;
  onFetchGroupOutputs?: (groupId: number) => Promise<OutputInGroup[]>;
  t?: (key: string) => string;
}

export const OutputDrawerContent: React.FC<OutputDrawerContentProps> = ({
  config,
  simTypeId: _simTypeId,
  outputSets,
  conditionConfig,
  inpSets = [],
  onUpdate,
  onFetchGroupOutputs,
  t = (key: string) => key,
}) => {
  const [loadingGroup, setLoadingGroup] = useState(false);

  // 根据工况配置筛选输出组
  const filteredOutputSets = useMemo(() => {
    if (conditionConfig?.outputGroupIds?.length) {
      return outputSets.filter(s => conditionConfig.outputGroupIds.includes(s.id));
    }
    return outputSets;
  }, [outputSets, conditionConfig]);

  // 响应详情管理函数
  const addRespDetail = () => {
    const currentDetails = config.output.respDetails || [];
    const newDetail: RespDetail = {
      set: '',
      outputType: 'RF3',
      component: '',
      description: '',
      lowerLimit: null,
      upperLimit: null,
      weight: 1,
      multiple: 1,
      targetValue: null,
      targetType: TargetType.MAX,
    };
    onUpdate({
      output: { ...config.output, respDetails: [...currentDetails, newDetail] },
    });
  };

  const updateRespDetail = (index: number, updates: Partial<RespDetail>) => {
    const currentDetails = config.output.respDetails || [];
    const newDetails = [...currentDetails];
    newDetails[index] = { ...newDetails[index], ...updates };
    onUpdate({ output: { ...config.output, respDetails: newDetails } });
  };

  const removeRespDetail = (index: number) => {
    const currentDetails = config.output.respDetails || [];
    onUpdate({
      output: { ...config.output, respDetails: currentDetails.filter((_, i) => i !== index) },
    });
  };

  // 输出类型选项
  const outputTypeOptions = ['RF3', 'LEP2', 'LEP1', 'S33', 'S11', 'S22', 'U1', 'U2', 'U3'];

  // 目标类型选项
  const targetTypeOptions = [
    { value: TargetType.MIN, label: t('sub.output.target_min') || '最小化' },
    { value: TargetType.MAX, label: t('sub.output.target_max') || '最大化' },
    { value: TargetType.TARGET, label: t('sub.output.target_value') || '靠近目标值' },
    { value: TargetType.USER_DEFINED, label: t('sub.output.target_custom') || '自定义' },
  ];

  return (
    <div className="space-y-5">
      {/* 输出组合选择 */}
      <div>
        <label className="block text-sm font-bold mb-2 text-foreground">
          {t('sub.output.output_set')}
        </label>
        <select
          className="w-full p-3 border rounded-lg bg-background text-foreground border-input"
          value={config.output.outputSetId || ''}
          disabled={loadingGroup}
          onChange={async e => {
            const groupId = Number(e.target.value) || null;
            onUpdate({
              output: { ...config.output, outputSetId: groupId },
            });
            // 选择输出组后，获取输出详情并填充 respDetails
            if (groupId && onFetchGroupOutputs) {
              setLoadingGroup(true);
              try {
                const groupOutputs = await onFetchGroupOutputs(groupId);
                if (groupOutputs.length > 0) {
                  const newRespDetails: RespDetail[] = groupOutputs.map(o => ({
                    set: '',
                    outputType: o.outputCode || 'RF3',
                    component: '',
                    description: o.outputName || '',
                    lowerLimit: null,
                    upperLimit: null,
                    weight: 1,
                    multiple: 1,
                    targetValue: null,
                    targetType: TargetType.MAX,
                  }));
                  onUpdate({
                    output: { ...config.output, outputSetId: groupId, respDetails: newRespDetails },
                  });
                }
              } finally {
                setLoadingGroup(false);
              }
            }
          }}
        >
          <option value="">-- {t('sub.params.select_group')} --</option>
          {filteredOutputSets.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {loadingGroup && <p className="text-xs text-muted-foreground mt-1">{t('sub.loading')}</p>}
      </div>

      {/* 响应输出详情配置 - 表格形式 */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-bold text-foreground">
            {t('sub.output.resp_details')}
          </label>
          <button
            onClick={addRespDetail}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
          >
            <PlusIcon className="w-4 h-4" />
            {t('sub.output.add_resp')}
          </button>
        </div>

        {/* 表格形式展示 */}
        <div className="border rounded-lg border-border overflow-hidden">
          {/* 表头 */}
          <div className="grid grid-cols-[80px_70px_80px_1fr_60px_60px_60px_60px_80px_60px_36px] bg-muted text-xs font-medium text-muted-foreground">
            <div className="px-1 py-2 border-r border-border text-center">
              {t('sub.output.set_name')}
            </div>
            <div className="px-1 py-2 border-r border-border text-center">
              {t('sub.output.output_type')}
            </div>
            <div className="px-1 py-2 border-r border-border text-center">
              {t('sub.output.component_id')}
            </div>
            <div className="px-1 py-2 border-r border-border text-center">
              {t('sub.output.description')}
            </div>
            <div className="px-1 py-2 border-r border-border text-center">
              {t('sub.output.lower_limit')}
            </div>
            <div className="px-1 py-2 border-r border-border text-center">
              {t('sub.output.upper_limit')}
            </div>
            <div className="px-1 py-2 border-r border-border text-center">
              {t('sub.output.weight')}
            </div>
            <div className="px-1 py-2 border-r border-border text-center">
              {t('sub.output.multiple')}
            </div>
            <div className="px-1 py-2 border-r border-border text-center">
              {t('sub.output.target_type')}
            </div>
            <div className="px-1 py-2 border-r border-border text-center">
              {t('sub.output.target_value')}
            </div>
            <div className="px-1 py-2"></div>
          </div>

          {/* 表格内容 */}
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {(config.output.respDetails || []).length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                {t('sub.output.add_resp')}
              </div>
            ) : (
              (config.output.respDetails || []).map((resp, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[80px_70px_80px_1fr_60px_60px_60px_60px_80px_60px_36px] border-t border-border hover:bg-muted/50"
                >
                  <div className="px-1 py-1 border-r border-border">
                    <input
                      type="text"
                      list={`set-options-${idx}`}
                      className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:ring-1 focus:ring-ring rounded"
                      placeholder="set"
                      value={resp.set}
                      onChange={e => updateRespDetail(idx, { set: e.target.value })}
                    />
                    {inpSets.length > 0 && (
                      <datalist id={`set-options-${idx}`}>
                        {inpSets.map(s => (
                          <option key={s.name} value={s.name} />
                        ))}
                      </datalist>
                    )}
                  </div>
                  <div className="px-1 py-1 border-r border-border">
                    <select
                      className="w-full px-0 py-1 text-xs border-0 bg-transparent focus:ring-1 focus:ring-ring rounded"
                      value={resp.outputType}
                      onChange={e => updateRespDetail(idx, { outputType: e.target.value })}
                    >
                      {outputTypeOptions.map(opt => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="px-1 py-1 border-r border-border">
                    <input
                      type="text"
                      className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:ring-1 focus:ring-ring rounded"
                      placeholder="comp"
                      value={resp.component}
                      onChange={e => updateRespDetail(idx, { component: e.target.value })}
                    />
                  </div>
                  <div className="px-1 py-1 border-r border-border">
                    <input
                      type="text"
                      className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:ring-1 focus:ring-ring rounded"
                      placeholder="desc"
                      value={resp.description || ''}
                      onChange={e => updateRespDetail(idx, { description: e.target.value })}
                    />
                  </div>
                  <div className="px-1 py-1 border-r border-border">
                    <input
                      type="number"
                      className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:ring-1 focus:ring-ring rounded text-center"
                      value={resp.lowerLimit ?? ''}
                      onChange={e =>
                        updateRespDetail(idx, {
                          lowerLimit: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="px-1 py-1 border-r border-border">
                    <input
                      type="number"
                      className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:ring-1 focus:ring-ring rounded text-center"
                      value={resp.upperLimit ?? ''}
                      onChange={e =>
                        updateRespDetail(idx, {
                          upperLimit: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="px-1 py-1 border-r border-border">
                    <input
                      type="number"
                      step="0.1"
                      className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:ring-1 focus:ring-ring rounded text-center"
                      value={resp.weight}
                      onChange={e => updateRespDetail(idx, { weight: Number(e.target.value) })}
                    />
                  </div>
                  <div className="px-1 py-1 border-r border-border">
                    <input
                      type="number"
                      className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:ring-1 focus:ring-ring rounded text-center"
                      value={resp.multiple}
                      onChange={e => updateRespDetail(idx, { multiple: Number(e.target.value) })}
                    />
                  </div>
                  <div className="px-1 py-1 border-r border-border">
                    <select
                      className="w-full px-0 py-1 text-xs border-0 bg-transparent focus:ring-1 focus:ring-ring rounded"
                      value={resp.targetType}
                      onChange={e =>
                        updateRespDetail(idx, { targetType: e.target.value as TargetType })
                      }
                    >
                      {targetTypeOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="px-1 py-1 border-r border-border">
                    <input
                      type="number"
                      className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:ring-1 focus:ring-ring rounded text-center"
                      value={resp.targetValue ?? ''}
                      onChange={e =>
                        updateRespDetail(idx, {
                          targetValue: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="px-1 py-1 flex items-center justify-center">
                    <button
                      onClick={() => removeRespDetail(idx)}
                      className="p-1 text-destructive hover:bg-destructive/10 rounded"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
