import React from 'react';
import { ServerIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui';
import { ConfigCardHeader, ListItem, EditModal, FormInput } from '../components';
import { useConfigurationState } from '../hooks';

export const SolverResourcesTab: React.FC = () => {
  const state = useConfigurationState();

  return (
    <>
      <Card>
        <ConfigCardHeader
          title="资源池管理"
          icon={<ServerIcon className="w-5 h-5" />}
          onAdd={() => state.openModal('solverResource')}
        />
        <div className="space-y-2">
          {state.solverResources.map(resource => (
            <ListItem
              key={resource.id}
              title={resource.name}
              subtitle={`${resource.code || '-'} | CPU: ${resource.cpuCores || '-'}核 | 内存: ${resource.memoryGb || '-'}GB`}
              onEdit={() => state.openModal('solverResource', resource)}
              onDelete={() => state.handleDelete('solverResource', resource.id, resource.name)}
            />
          ))}
        </div>
      </Card>

      <EditModal
        isOpen={state.modalOpen && state.modalType === 'solverResource'}
        onClose={state.closeModal}
        title={state.editingItem ? '编辑资源池' : '新建资源池'}
        onSave={state.handleSave}
        loading={state.loading}
      >
        <FormInput
          label="名称"
          value={state.formData.name || ''}
          onChange={v => state.updateFormData('name', v)}
          placeholder="请输入资源池名称"
        />
        <FormInput
          label="编码"
          value={state.formData.code || ''}
          onChange={v => state.updateFormData('code', v)}
          placeholder="请输入资源池编码"
        />
        <FormInput
          label="描述"
          value={state.formData.description || ''}
          onChange={v => state.updateFormData('description', v)}
          placeholder="请输入资源池描述"
        />
        <FormInput
          label="CPU核数"
          value={state.formData.cpuCores ?? ''}
          onChange={v => state.updateFormData('cpuCores', v ? Number(v) : null)}
          type="number"
          placeholder="请输入CPU核数"
        />
        <FormInput
          label="内存(GB)"
          value={state.formData.memoryGb ?? ''}
          onChange={v => state.updateFormData('memoryGb', v ? Number(v) : null)}
          type="number"
          placeholder="请输入内存大小"
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
