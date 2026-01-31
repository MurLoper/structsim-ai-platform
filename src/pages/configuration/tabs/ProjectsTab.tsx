import React from 'react';
import { FolderIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui';
import { ConfigCardHeader, ActionButtons, EditModal, FormInput } from '../components';
import { useConfigurationState } from '../hooks';

export const ProjectsTab: React.FC = () => {
  const state = useConfigurationState();

  return (
    <>
      <Card>
        <ConfigCardHeader
          title="项目管理"
          icon={<FolderIcon className="w-5 h-5" />}
          onAdd={() => state.openModal('project')}
        />
        <div className="p-4 space-y-2">
          {state.projects.map(project => (
            <div
              key={project.id}
              className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex justify-between items-start"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-slate-900 dark:text-white">{project.name}</h4>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      project.valid
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}
                  >
                    {project.valid ? '启用' : '禁用'}
                  </span>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  编码: {project.code || '无'} | 排序: {project.sort}
                </div>
              </div>
              <ActionButtons
                onEdit={() => state.openModal('project', project)}
                onDelete={() => state.handleDelete('project', project.id, project.name)}
              />
            </div>
          ))}
        </div>
      </Card>

      <EditModal
        isOpen={state.modalOpen && state.modalType === 'project'}
        onClose={state.closeModal}
        title={state.editingItem ? '编辑项目' : '新建项目'}
        onSave={state.handleSave}
        loading={state.loading}
      >
        <FormInput
          label="项目名称"
          value={state.formData.name || ''}
          onChange={v => state.updateFormData('name', v)}
          placeholder="请输入项目名称"
        />
        <FormInput
          label="项目编码"
          value={state.formData.code || ''}
          onChange={v => state.updateFormData('code', v)}
          placeholder="请输入项目编码（可选）"
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
