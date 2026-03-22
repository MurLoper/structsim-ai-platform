import React, { useMemo, useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { SimTypeConfig, RespDetail, InpSetInfo } from '../types';
import { TargetType } from '../types';
import type { OutputSet, ConditionConfig } from '@/types/config';
import type { OutputInGroup } from '@/types/configGroups';
import { usePostProcessModes } from '@/features/config/queries';

const DEFAULT_POST_PROCESS_MODE = '18';
const POST_PROCESS_MODE_OPTIONS = [
  { value: '18', labelKey: 'sub.output.post_process_other' },
  { value: '35', labelKey: 'sub.output.post_process_rf_at_xx' },
] as const;

interface OutputDrawerContentProps {
  config: SimTypeConfig;
  simTypeId: number;
  outputSets: OutputSet[];
  conditionConfig?: ConditionConfig;
  inpSets?: InpSetInfo[];
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
  const { data: postProcessModes = [] } = usePostProcessModes();

  // 接口字段仍叫 component，但业务语义已切到“后处理方式”。
  const postProcessModeOptions = useMemo(() => {
    const options: Array<{ value: string; label: string }> =
      postProcessModes.length > 0
        ? postProcessModes.map(mode => ({
            value: mode.code,
            label: mode.name,
          }))
        : POST_PROCESS_MODE_OPTIONS.map(option => ({
            value: option.value,
            label: t(option.labelKey),
          }));

    (config.output.respDetails || []).forEach(detail => {
      const value = detail.component?.trim();
      if (value && !options.some(option => option.value === value)) {
        options.push({ value, label: value });
      }
    });

    return options;
  }, [config.output.respDetails, postProcessModes, t]);

  const filteredOutputSets = useMemo(() => {
    if (conditionConfig?.outputGroupIds?.length) {
      return outputSets.filter(s => conditionConfig.outputGroupIds.includes(s.id));
    }
    return outputSets;
  }, [outputSets, conditionConfig]);

  const addRespDetail = () => {
    const currentDetails = config.output.respDetails || [];
    const newDetail: RespDetail = {
      set: '',
      outputType: 'RF3',
      component: DEFAULT_POST_PROCESS_MODE,
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

  const outputTypeOptions = ['RF3', 'LEP2', 'LEP1', 'S33', 'S11', 'S22', 'U1', 'U2', 'U3'];
  const integrationPointOptions = ['', 'CENTROID', 'MAX', 'MIN', 'INTERPOLATE'];
  const targetTypeOptions = [
    { value: TargetType.MIN, label: t('sub.output.target_min') },
    { value: TargetType.MAX, label: t('sub.output.target_max') },
    { value: TargetType.TARGET, label: t('sub.output.target_value') },
    { value: TargetType.USER_DEFINED, label: t('sub.output.target_custom') },
  ];

  return (
    <div className="space-y-5">
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

            if (groupId && onFetchGroupOutputs) {
              setLoadingGroup(true);
              try {
                const groupOutputs = await onFetchGroupOutputs(groupId);
                if (groupOutputs.length > 0) {
                  const mapTargetType = (value?: number): TargetType => {
                    if (value === 1) return TargetType.MAX;
                    if (value === 2) return TargetType.MIN;
                    if (value === 3) return TargetType.TARGET;
                    return TargetType.MAX;
                  };

                  const newRespDetails: RespDetail[] = groupOutputs.map(output => ({
                    set: output.setName || 'push',
                    outputType: output.outputCode || 'RF3',
                    component: output.component || DEFAULT_POST_PROCESS_MODE,
                    integrationPoint: output.sectionPoint || undefined,
                    stepName: output.stepName || undefined,
                    specialOutputSet: output.specialOutputSet || undefined,
                    description: output.description || output.outputName || '',
                    lowerLimit: output.lowerLimit ?? null,
                    upperLimit: output.upperLimit ?? null,
                    weight: output.weight ?? 1,
                    multiple: output.multiple ?? 1,
                    targetValue: output.targetValue ?? null,
                    targetType: mapTargetType(output.targetType),
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

        <div className="border rounded-lg border-border overflow-hidden">
          <div className="grid grid-cols-[80px_70px_70px_80px_1fr_60px_60px_60px_60px_80px_60px_36px] bg-muted text-xs font-medium text-muted-foreground">
            <div className="px-1 py-2 border-r border-border text-center">
              {t('sub.output.set_name')}
            </div>
            <div className="px-1 py-2 border-r border-border text-center">
              {t('sub.output.output_type')}
            </div>
            <div className="px-1 py-2 border-r border-border text-center">
              {t('sub.output.integration_point')}
            </div>
            <div className="px-1 py-2 border-r border-border text-center">
              {t('sub.output.post_process_mode')}
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

          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {(config.output.respDetails || []).length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                {t('sub.output.add_resp')}
              </div>
            ) : (
              (config.output.respDetails || []).map((resp, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[80px_70px_70px_80px_1fr_60px_60px_60px_60px_80px_60px_36px] border-t border-border hover:bg-muted/50"
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
                    <select
                      className="w-full px-0 py-1 text-xs border-0 bg-transparent focus:ring-1 focus:ring-ring rounded"
                      value={resp.integrationPoint ?? ''}
                      onChange={e =>
                        updateRespDetail(idx, { integrationPoint: e.target.value || undefined })
                      }
                    >
                      {integrationPointOptions.map(opt => (
                        <option key={opt} value={opt}>
                          {opt || '--'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="px-1 py-1 border-r border-border">
                    <select
                      className="w-full px-0 py-1 text-xs border-0 bg-transparent focus:ring-1 focus:ring-ring rounded"
                      value={resp.component || DEFAULT_POST_PROCESS_MODE}
                      onChange={e => updateRespDetail(idx, { component: e.target.value })}
                    >
                      {postProcessModeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
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
