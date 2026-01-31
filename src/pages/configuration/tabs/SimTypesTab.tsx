import React from 'react';
import { CubeIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui';
import { ConfigCardHeader, ListItem, EditModal, FormInput, FormSelect } from '../components';
import { useConfigurationState } from '../hooks';

const CATEGORY_OPTIONS = [
  { value: 'STRUCTURE', label: '结构' },
  { value: 'THERMAL', label: '热分析' },
  { value: 'DYNAMIC', label: '动力学' },
  { value: 'ACOUSTIC', label: '声学' },
];

const COLOR_TAG_CLASSES: Record<string, string> = {
  gray: 'bg-gray-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  teal: 'bg-teal-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
};

const getColorTagClass = (colorTag?: string) =>
  COLOR_TAG_CLASSES[colorTag ?? 'gray'] || COLOR_TAG_CLASSES.gray;

export const SimTypesTab: React.FC = () => {
  const state = useConfigurationState();

  return (
    <>
      <Card>
        <ConfigCardHeader
          title="仿真类型管理"
          icon={<CubeIcon className="w-5 h-5" />}
          onAdd={() => state.openModal('simType')}
        />
        <div className="space-y-2">
          {state.simTypes.map(st => (
            <ListItem
              key={st.id}
              title={st.name}
              subtitle={`${st.code} | ${st.category}`}
              colorDot={getColorTagClass(st.colorTag)}
              onEdit={() => state.openModal('simType', st)}
              onDelete={() => state.handleDelete('simType', st.id, st.name)}
            />
          ))}
        </div>
      </Card>

      <EditModal
        isOpen={state.modalOpen && state.modalType === 'simType'}
        onClose={state.closeModal}
        title={state.editingItem ? '编辑仿真类型' : '新建仿真类型'}
        onSave={state.handleSave}
        loading={state.loading}
      >
        <FormInput
          label="名称"
          value={state.formData.name || ''}
          onChange={v => state.updateFormData('name', v)}
        />
        <FormInput
          label="编码"
          value={state.formData.code || ''}
          onChange={v => state.updateFormData('code', v)}
        />
        <FormSelect
          label="分类"
          value={state.formData.category || 'STRUCTURE'}
          onChange={v => state.updateFormData('category', v)}
          options={CATEGORY_OPTIONS}
        />
        <FormInput
          label="排序"
          value={state.formData.sort || 100}
          onChange={v => state.updateFormData('sort', Number(v))}
          type="number"
        />
      </EditModal>

      <state.ConfirmDialogComponent />
    </>
  );
};
