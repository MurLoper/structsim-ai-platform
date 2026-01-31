import React from 'react';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui';
import { ConfigCardHeader, ListItem, EditModal, FormInput } from '../components';
import { useConfigurationState } from '../hooks';

export const SolversTab: React.FC = () => {
  const state = useConfigurationState();

  return (
    <>
      <Card>
        <ConfigCardHeader
          title="求解器管理"
          icon={<AdjustmentsHorizontalIcon className="w-5 h-5" />}
          onAdd={() => state.openModal('solver')}
        />
        <div className="space-y-2">
          {state.solvers.map(s => (
            <ListItem
              key={s.id}
              title={s.name}
              subtitle={`v${s.version} | CPU: ${s.cpuCoreMin}-${s.cpuCoreMax} | 默认: ${s.cpuCoreDefault}核`}
              onEdit={() => state.openModal('solver', s)}
              onDelete={() => state.handleDelete('solver', s.id, s.name)}
            />
          ))}
        </div>
      </Card>

      <EditModal
        isOpen={state.modalOpen && state.modalType === 'solver'}
        onClose={state.closeModal}
        title={state.editingItem ? '编辑求解器' : '新建求解器'}
        onSave={state.handleSave}
        loading={state.loading}
      >
        <FormInput
          label="名称"
          value={state.formData.name || ''}
          onChange={v => state.updateFormData('name', v)}
          placeholder="请输入求解器名称"
        />
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="编码"
            value={state.formData.code || ''}
            onChange={v => state.updateFormData('code', v)}
            placeholder="如：NASTRAN"
          />
          <FormInput
            label="版本"
            value={state.formData.version || ''}
            onChange={v => state.updateFormData('version', v)}
            placeholder="如：2024"
          />
        </div>
        <div className="border-t pt-4 mt-2">
          <h4 className="text-sm font-medium mb-3">CPU 核数配置</h4>
          <div className="grid grid-cols-3 gap-4">
            <FormInput
              label="最小核数"
              value={state.formData.cpuCoreMin ?? 1}
              onChange={v => state.updateFormData('cpuCoreMin', Number(v))}
              type="number"
            />
            <FormInput
              label="最大核数"
              value={state.formData.cpuCoreMax ?? 64}
              onChange={v => state.updateFormData('cpuCoreMax', Number(v))}
              type="number"
            />
            <FormInput
              label="默认核数"
              value={state.formData.cpuCoreDefault ?? 8}
              onChange={v => state.updateFormData('cpuCoreDefault', Number(v))}
              type="number"
            />
          </div>
        </div>
        <FormInput
          label="排序"
          value={state.formData.sort ?? 100}
          onChange={v => state.updateFormData('sort', Number(v))}
          type="number"
        />
      </EditModal>

      <state.ConfirmDialogComponent />
    </>
  );
};
