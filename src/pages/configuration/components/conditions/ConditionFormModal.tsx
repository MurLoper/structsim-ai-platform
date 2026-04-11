import React from 'react';
import { X } from 'lucide-react';
import type { ConditionConfig } from '@/types';
import type { ParamGroup, OutputGroup } from '@/types/configGroups';
import { useI18n } from '@/hooks/useI18n';
import {
  managementFieldClass,
  managementModalOverlayClass,
  managementModalPanelClass,
  managementPrimaryButtonDisabledClass,
  managementSecondaryButtonClass,
} from '../managementSurfaceTokens';

export interface ConditionFormData {
  name: string;
  code: string;
  foldTypeId: number | null;
  simTypeId: number | null;
  paramGroupIds: number[];
  outputGroupIds: number[];
  defaultParamGroupId: number | null;
  defaultOutputGroupId: number | null;
  defaultSolverId: number | null;
  sort: number;
  remark: string;
}

interface FoldTypeOption {
  id: number;
  name: string;
}

interface SimTypeOption {
  id: number;
  name: string;
}

interface SolverOption {
  id: number;
  name: string;
}

interface ConditionFormModalProps {
  showModal: boolean;
  editingConfig: ConditionConfig | null;
  formData: ConditionFormData;
  foldTypes: FoldTypeOption[];
  simTypes: SimTypeOption[];
  paramGroups: ParamGroup[];
  outputGroups: OutputGroup[];
  solvers: SolverOption[];
  isDuplicateCombo: boolean;
  pending: boolean;
  autoGenerateName: (foldId: number | null, simId: number | null) => string;
  setFormData: React.Dispatch<React.SetStateAction<ConditionFormData>>;
  onClose: () => void;
  onSave: () => void;
}

export const ConditionFormModal: React.FC<ConditionFormModalProps> = ({
  showModal,
  editingConfig,
  formData,
  foldTypes,
  simTypes,
  paramGroups,
  outputGroups,
  solvers,
  isDuplicateCombo,
  pending,
  autoGenerateName,
  setFormData,
  onClose,
  onSave,
}) => {
  const { t } = useI18n();

  if (!showModal) {
    return null;
  }

  return (
    <div className={managementModalOverlayClass}>
      <div className={`${managementModalPanelClass} max-h-[90vh] w-full max-w-2xl overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-lg font-semibold text-foreground">
            {editingConfig ? t('cfg.condition_config.edit') : t('cfg.condition_config.create')}
          </h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                {t('cfg.condition_config.name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={event => setFormData(prev => ({ ...prev, name: event.target.value }))}
                className={managementFieldClass}
                placeholder={t('cfg.condition_config.name_placeholder')}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                {t('cfg.condition_config.code')}
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={event => setFormData(prev => ({ ...prev, code: event.target.value }))}
                className={managementFieldClass}
                placeholder={t('cfg.condition_config.code_placeholder')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                {t('cfg.condition_config.fold_type')} <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.foldTypeId?.toString() || ''}
                onChange={event => {
                  const foldTypeId = event.target.value ? Number(event.target.value) : null;
                  setFormData(prev => {
                    const generated = autoGenerateName(foldTypeId, prev.simTypeId);
                    return {
                      ...prev,
                      foldTypeId,
                      name:
                        prev.name === autoGenerateName(prev.foldTypeId, prev.simTypeId)
                          ? generated
                          : prev.name,
                    };
                  });
                }}
                className={managementFieldClass}
                disabled={!!editingConfig}
              >
                <option value="">{t('cfg.condition_config.select_fold_type')}</option>
                {foldTypes.map(foldType => (
                  <option key={foldType.id} value={foldType.id.toString()}>
                    {foldType.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                {t('cfg.condition_config.sim_type')} <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.simTypeId?.toString() || ''}
                onChange={event => {
                  const simTypeId = event.target.value ? Number(event.target.value) : null;
                  setFormData(prev => {
                    const generated = autoGenerateName(prev.foldTypeId, simTypeId);
                    return {
                      ...prev,
                      simTypeId,
                      name:
                        prev.name === autoGenerateName(prev.foldTypeId, prev.simTypeId) ||
                        prev.name === ''
                          ? generated
                          : prev.name,
                    };
                  });
                }}
                className={managementFieldClass}
                disabled={!!editingConfig}
              >
                <option value="">{t('cfg.condition_config.select_sim_type')}</option>
                {simTypes.map(simType => (
                  <option key={simType.id} value={simType.id.toString()}>
                    {simType.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isDuplicateCombo && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              {t('cfg.condition_config.duplicate_combo')}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t('cfg.condition_config.available_param_groups')}
            </label>
            <div className="max-h-32 overflow-y-auto rounded-lg border border-border p-3">
              {paramGroups.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {paramGroups.map(paramGroup => (
                    <label key={paramGroup.id} className="flex cursor-pointer items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={formData.paramGroupIds.includes(paramGroup.id)}
                        onChange={event => {
                          if (event.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              paramGroupIds: [...prev.paramGroupIds, paramGroup.id],
                            }));
                            return;
                          }
                          setFormData(prev => ({
                            ...prev,
                            paramGroupIds: prev.paramGroupIds.filter(id => id !== paramGroup.id),
                            defaultParamGroupId:
                              prev.defaultParamGroupId === paramGroup.id
                                ? null
                                : prev.defaultParamGroupId,
                          }));
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{paramGroup.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {t('cfg.condition_config.empty_param_groups')}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t('cfg.condition_config.available_output_groups')}
            </label>
            <div className="max-h-32 overflow-y-auto rounded-lg border border-border p-3">
              {outputGroups.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {outputGroups.map(outputGroup => (
                    <label
                      key={outputGroup.id}
                      className="flex cursor-pointer items-center gap-1.5"
                    >
                      <input
                        type="checkbox"
                        checked={formData.outputGroupIds.includes(outputGroup.id)}
                        onChange={event => {
                          if (event.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              outputGroupIds: [...prev.outputGroupIds, outputGroup.id],
                            }));
                            return;
                          }
                          setFormData(prev => ({
                            ...prev,
                            outputGroupIds: prev.outputGroupIds.filter(id => id !== outputGroup.id),
                            defaultOutputGroupId:
                              prev.defaultOutputGroupId === outputGroup.id
                                ? null
                                : prev.defaultOutputGroupId,
                          }));
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{outputGroup.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {t('cfg.condition_config.empty_output_groups')}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              {
                key: 'defaultParamGroupId' as const,
                labelKey: 'cfg.condition_config.default_param_group',
                ids: formData.paramGroupIds,
                source: paramGroups,
              },
              {
                key: 'defaultOutputGroupId' as const,
                labelKey: 'cfg.condition_config.default_output_group',
                ids: formData.outputGroupIds,
                source: outputGroups,
              },
            ].map(field => (
              <div key={field.key}>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  {t(field.labelKey)}
                </label>
                <select
                  value={formData[field.key] || ''}
                  onChange={event =>
                    setFormData(prev => ({
                      ...prev,
                      [field.key]: Number(event.target.value) || null,
                    }))
                  }
                  className={`${managementFieldClass} text-sm`}
                >
                  <option value="">{t('cfg.condition_config.not_set')}</option>
                  {field.ids.map(id => {
                    const item = field.source.find(candidate => candidate.id === id);
                    return item ? (
                      <option key={id} value={id}>
                        {item.name}
                      </option>
                    ) : null;
                  })}
                </select>
              </div>
            ))}
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                {t('cfg.condition_config.default_solver')}
              </label>
              <select
                value={formData.defaultSolverId || ''}
                onChange={event =>
                  setFormData(prev => ({
                    ...prev,
                    defaultSolverId: Number(event.target.value) || null,
                  }))
                }
                className={`${managementFieldClass} text-sm`}
              >
                <option value="">{t('cfg.condition_config.not_set')}</option>
                {solvers.map(solver => (
                  <option key={solver.id} value={solver.id}>
                    {solver.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                {t('common.sort')}
              </label>
              <input
                type="number"
                value={formData.sort}
                onChange={event =>
                  setFormData(prev => ({ ...prev, sort: Number(event.target.value) || 0 }))
                }
                className={`${managementFieldClass} text-sm`}
                min={0}
                step={10}
              />
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t('cfg.condition_config.sort_tip')}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                {t('cfg.remark')}
              </label>
              <input
                type="text"
                value={formData.remark}
                onChange={event => setFormData(prev => ({ ...prev, remark: event.target.value }))}
                className={`${managementFieldClass} text-sm`}
                placeholder={t('cfg.remark_placeholder')}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-4">
          <button onClick={onClose} className={managementSecondaryButtonClass}>
            {t('common.cancel')}
          </button>
          <button
            onClick={onSave}
            disabled={pending}
            className={managementPrimaryButtonDisabledClass}
          >
            {pending ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};
