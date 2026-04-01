import React from 'react';
import { X } from 'lucide-react';
import type { ConditionConfig } from '@/types';
import type { ParamGroup, OutputGroup } from '@/types/configGroups';
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
  if (!showModal) {
    return null;
  }

  return (
    <div className={managementModalOverlayClass}>
      <div className={`${managementModalPanelClass} w-full max-w-2xl max-h-[90vh] overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-lg font-semibold text-foreground">
            {editingConfig ? '编辑工况配置' : '新增工况配置'}
          </h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                工况名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={event => setFormData(prev => ({ ...prev, name: event.target.value }))}
                className={managementFieldClass}
                placeholder="如：展开态-静力分析"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">工况编码</label>
              <input
                type="text"
                value={formData.code}
                onChange={event => setFormData(prev => ({ ...prev, code: event.target.value }))}
                className={managementFieldClass}
                placeholder="如：DEPLOY_STATIC"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                目标姿态 <span className="text-red-500">*</span>
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
                <option value="">请选择姿态</option>
                {foldTypes.map(foldType => (
                  <option key={foldType.id} value={foldType.id.toString()}>
                    {foldType.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                仿真类型 <span className="text-red-500">*</span>
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
                <option value="">请选择仿真类型</option>
                {simTypes.map(simType => (
                  <option key={simType.id} value={simType.id.toString()}>
                    {simType.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isDuplicateCombo && (
            <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-sm text-amber-700 dark:text-amber-400">
              该姿态与仿真类型的组合已存在，保存时会被拒绝。
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">可用参数组</label>
            <div className="max-h-32 overflow-y-auto rounded-lg border border-border p-3">
              {paramGroups.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {paramGroups.map(paramGroup => (
                    <label key={paramGroup.id} className="flex items-center gap-1.5 cursor-pointer">
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
                <span className="text-sm text-muted-foreground">暂无参数组</span>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">可用输出组</label>
            <div className="max-h-32 overflow-y-auto rounded-lg border border-border p-3">
              {outputGroups.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {outputGroups.map(outputGroup => (
                    <label
                      key={outputGroup.id}
                      className="flex items-center gap-1.5 cursor-pointer"
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
                <span className="text-sm text-muted-foreground">暂无输出组</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">默认参数组</label>
              <select
                value={formData.defaultParamGroupId || ''}
                onChange={event =>
                  setFormData(prev => ({
                    ...prev,
                    defaultParamGroupId: Number(event.target.value) || null,
                  }))
                }
                className={`${managementFieldClass} text-sm`}
              >
                <option value="">不设置</option>
                {formData.paramGroupIds.map(id => {
                  const paramGroup = paramGroups.find(item => item.id === id);
                  return paramGroup ? (
                    <option key={id} value={id}>
                      {paramGroup.name}
                    </option>
                  ) : null;
                })}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">默认输出组</label>
              <select
                value={formData.defaultOutputGroupId || ''}
                onChange={event =>
                  setFormData(prev => ({
                    ...prev,
                    defaultOutputGroupId: Number(event.target.value) || null,
                  }))
                }
                className={`${managementFieldClass} text-sm`}
              >
                <option value="">不设置</option>
                {formData.outputGroupIds.map(id => {
                  const outputGroup = outputGroups.find(item => item.id === id);
                  return outputGroup ? (
                    <option key={id} value={id}>
                      {outputGroup.name}
                    </option>
                  ) : null;
                })}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">默认求解器</label>
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
                <option value="">不设置</option>
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
              <label className="mb-1 block text-sm font-medium text-foreground">排序</label>
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
              <p className="mt-0.5 text-xs text-muted-foreground">值越小越靠前</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">备注</label>
              <input
                type="text"
                value={formData.remark}
                onChange={event => setFormData(prev => ({ ...prev, remark: event.target.value }))}
                className={`${managementFieldClass} text-sm`}
                placeholder="可选备注信息"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-4">
          <button onClick={onClose} className={managementSecondaryButtonClass}>
            取消
          </button>
          <button
            onClick={onSave}
            disabled={pending}
            className={managementPrimaryButtonDisabledClass}
          >
            {pending ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};
