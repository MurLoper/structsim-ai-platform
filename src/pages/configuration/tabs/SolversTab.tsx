import React, { useMemo } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Card } from '@/components/ui';
import { ConfigCardHeader, ListItem, EditModal, FormInput, FormSelect } from '../components';
import { useConfigurationState } from '../hooks';

const MOCK_SOLVER_SOURCES = [
  { solverId: '0', name: 'GPU求解器', version: 'vnull' },
  { solverId: '39', name: 'Abaqus', version: '2019' },
  { solverId: '40', name: 'Abaqus', version: '2020' },
  { solverId: '41', name: 'LS-DYNA', version: 'R13' },
  { solverId: '42', name: 'ANSYS', version: '2024R1' },
];

export const SolversTab: React.FC = () => {
  const state = useConfigurationState();

  const selectedSolverSourceValue = String(state.formData.code || '');
  const sourceOptions = useMemo(() => {
    const options = MOCK_SOLVER_SOURCES.map(item => ({
      value: item.solverId,
      label: `${item.name} ${item.version} (solver_id=${item.solverId})`,
    }));
    if (
      selectedSolverSourceValue &&
      !options.some(opt => opt.value === selectedSolverSourceValue)
    ) {
      options.unshift({
        value: selectedSolverSourceValue,
        label: `当前值 (solver_id=${selectedSolverSourceValue})`,
      });
    }
    return options;
  }, [selectedSolverSourceValue]);

  return (
    <>
      <Card>
        <ConfigCardHeader
          title="求解器管理"
          icon={<SlidersHorizontal className="w-5 h-5" />}
          onAdd={() => state.openModal('solver')}
        />
        <div className="space-y-2">
          {state.solvers.map(s => (
            <ListItem
              key={s.id}
              title={s.name}
              subtitle={`solver_id: ${s.code || '-'} | 版本: ${s.version || '-'}`}
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
        <FormSelect
          label="来源求解器（外部）"
          value={selectedSolverSourceValue || MOCK_SOLVER_SOURCES[0].solverId}
          onChange={v => {
            const selected = MOCK_SOLVER_SOURCES.find(item => item.solverId === v);
            state.updateFormData('code', v);
            if (selected) {
              state.updateFormData('name', selected.name);
              state.updateFormData('version', selected.version);
            }
          }}
          options={sourceOptions}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="名称"
            value={state.formData.name || ''}
            onChange={v => state.updateFormData('name', v)}
            placeholder="请输入求解器名称"
          />
          <FormInput
            label="版本"
            value={state.formData.version || ''}
            onChange={v => state.updateFormData('version', v)}
            placeholder="请输入版本"
          />
        </div>
        <FormInput
          label="solver_id"
          value={state.formData.code || ''}
          onChange={v => state.updateFormData('code', v)}
          placeholder="例如：0（GPU）"
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
