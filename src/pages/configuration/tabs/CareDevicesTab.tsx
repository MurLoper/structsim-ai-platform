import React from 'react';
import { Cpu } from 'lucide-react';
import { Card } from '@/components/ui';
import { ConfigCardHeader, ListItem, EditModal, FormInput } from '../components';
import { useConfigurationState } from '../hooks';

export const CareDevicesTab: React.FC = () => {
  const state = useConfigurationState();

  return (
    <>
      <Card>
        <ConfigCardHeader
          title="关注器件管理"
          icon={<Cpu className="w-5 h-5" />}
          onAdd={() => state.openModal('careDevice')}
        />
        <div className="space-y-2">
          {state.careDevices.map(device => (
            <ListItem
              key={device.id}
              title={device.name}
              subtitle={`${device.code || '-'} | 分类: ${device.category || '-'}`}
              onEdit={() => state.openModal('careDevice', device)}
              onDelete={() => state.handleDelete('careDevice', device.id, device.name)}
            />
          ))}
        </div>
      </Card>

      <EditModal
        isOpen={state.modalOpen && state.modalType === 'careDevice'}
        onClose={state.closeModal}
        title={state.editingItem ? '编辑关注器件' : '新建关注器件'}
        onSave={state.handleSave}
        loading={state.loading}
      >
        <FormInput
          label="名称"
          value={state.formData.name || ''}
          onChange={v => state.updateFormData('name', v)}
          placeholder="请输入器件名称"
        />
        <FormInput
          label="编码"
          value={state.formData.code || ''}
          onChange={v => state.updateFormData('code', v)}
          placeholder="请输入器件编码"
        />
        <FormInput
          label="分类"
          value={state.formData.category || ''}
          onChange={v => state.updateFormData('category', v)}
          placeholder="请输入器件分类"
        />
        <FormInput
          label="排序"
          value={state.formData.sort ?? 100}
          onChange={v => state.updateFormData('sort', Number(v))}
          type="number"
        />
        <FormInput
          label="备注"
          value={state.formData.remark || ''}
          onChange={v => state.updateFormData('remark', v)}
          placeholder="请输入备注"
        />
      </EditModal>

      <state.ConfirmDialogComponent />
    </>
  );
};
