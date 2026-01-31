import React from 'react';
import { BeakerIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui';
import { ConfigCardHeader, ListItem, EditModal, FormInput } from '../components';
import { useConfigurationState } from '../hooks';

export const FoldTypesTab: React.FC = () => {
  const state = useConfigurationState();

  return (
    <>
      <Card>
        <ConfigCardHeader
          title="姿态类型管理"
          icon={<BeakerIcon className="w-5 h-5" />}
          onAdd={() => state.openModal('foldType')}
        />
        <div className="space-y-2">
          {state.foldTypes.map(f => (
            <ListItem
              key={f.id}
              title={f.name}
              subtitle={`${f.code || '-'} | 角度: ${f.angle}°`}
              onEdit={() => state.openModal('foldType', f)}
              onDelete={() => state.handleDelete('foldType', f.id, f.name)}
            />
          ))}
        </div>
      </Card>

      <EditModal
        isOpen={state.modalOpen && state.modalType === 'foldType'}
        onClose={state.closeModal}
        title={state.editingItem ? '编辑姿态' : '新建姿态'}
        onSave={state.handleSave}
        loading={state.loading}
      >
        <FormInput
          label="名称"
          value={state.formData.name || ''}
          onChange={v => state.updateFormData('name', v)}
          placeholder="请输入姿态名称"
        />
        <FormInput
          label="编码"
          value={state.formData.code || ''}
          onChange={v => state.updateFormData('code', v)}
          placeholder="请输入姿态编码"
        />
        <FormInput
          label="角度"
          value={state.formData.angle ?? 0}
          onChange={v => state.updateFormData('angle', Number(v))}
          type="number"
        />
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
