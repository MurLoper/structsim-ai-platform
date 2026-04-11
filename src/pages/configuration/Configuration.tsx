import React from 'react';
import { Card, CardHeader } from '@/components/ui';
import { Folder, SlidersHorizontal, RefreshCw, FlaskConical, BarChart3, Box } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import { useConfigurationState } from './hooks';
import {
  EditModal,
  ConfigCardHeader,
  ListItem,
  ActionButtons,
  ConfigurationSidebar,
  ConfigurationModalForm,
} from './components';
import { ParamGroupsManagement } from './components/ParamGroupsManagement';
import { OutputGroupsManagement } from './components/OutputGroupsManagement';
import { ConfigRelationsManagement } from './components/ConfigRelationsManagement';
import { SystemConfigManagement } from './components/SystemConfigManagement';
import { StatusConfigManagement } from './components/StatusConfigManagement';
import { FoldTypeSimTypeManagement } from './components/FoldTypeSimTypeManagement';

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

const Configuration: React.FC = () => {
  const { t } = useI18n();
  const state = useConfigurationState();

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white eyecare:text-foreground">
          {t('cfg.title')}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <ConfigurationSidebar activeTab={state.activeTab} onTabChange={state.setActiveTab} />

        <div className="lg:col-span-3">
          {state.activeTab === 'simTypes' && (
            <Card>
              <ConfigCardHeader
                title={t('cfg.sim_types.title')}
                icon={<Box className="h-5 w-5" />}
                onAdd={() => state.openModal('simType')}
              />
              <div className="space-y-2">
                {state.simTypes.map(simType => (
                  <ListItem
                    key={simType.id}
                    title={simType.name}
                    subtitle={`${simType.code} | ${simType.category}`}
                    colorDot={getColorTagClass(simType.colorTag)}
                    onEdit={() => state.openModal('simType', simType)}
                    onDelete={() => state.handleDelete('simType', simType.id, simType.name)}
                  />
                ))}
              </div>
            </Card>
          )}

          {state.activeTab === 'params' && (
            <Card>
              <ConfigCardHeader
                title={t('cfg.params.title')}
                icon={<SlidersHorizontal className="h-5 w-5" />}
                onAdd={() => state.openModal('paramDef')}
              />
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 dark:bg-slate-700">
                  <tr>
                    <th className="p-3">{t('common.name')}</th>
                    <th className="p-3">{t('common.key')}</th>
                    <th className="p-3">{t('common.unit')}</th>
                    <th className="p-3">{t('common.range')}</th>
                    <th className="w-24 p-3">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {state.paramDefs.map(paramDef => (
                    <tr key={paramDef.id} className="border-b dark:border-slate-700">
                      <td className="p-3 font-medium">{paramDef.name}</td>
                      <td className="p-3 font-mono text-xs text-slate-500">{paramDef.key}</td>
                      <td className="p-3 text-slate-500">{paramDef.unit || '-'}</td>
                      <td className="p-3 text-slate-500">
                        {paramDef.minVal} - {paramDef.maxVal}
                      </td>
                      <td className="p-3">
                        <ActionButtons
                          onEdit={() => state.openModal('paramDef', paramDef)}
                          onDelete={() =>
                            state.handleDelete('paramDef', paramDef.id, paramDef.name)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {state.activeTab === 'solvers' && (
            <Card>
              <ConfigCardHeader
                title={t('cfg.solvers.title')}
                icon={<SlidersHorizontal className="h-5 w-5" />}
                onAdd={() => state.openModal('solver')}
              />
              <div className="space-y-2">
                {state.solvers.map(solver => (
                  <ListItem
                    key={solver.id}
                    title={solver.name}
                    subtitle={t('cfg.solver.subtitle', {
                      version: solver.version,
                      min: solver.cpuCoreMin,
                      max: solver.cpuCoreMax,
                      defaultValue: solver.cpuCoreDefault,
                    })}
                    onEdit={() => state.openModal('solver', solver)}
                    onDelete={() => state.handleDelete('solver', solver.id, solver.name)}
                  />
                ))}
              </div>
            </Card>
          )}

          {state.activeTab === 'conditions' && (
            <Card>
              <ConfigCardHeader
                title={t('cfg.conditions.title')}
                icon={<FlaskConical className="h-5 w-5" />}
                onAdd={() => state.openModal('conditionDef')}
              />
              <div className="space-y-2">
                {state.conditionDefs.map(conditionDef => (
                  <ListItem
                    key={conditionDef.id}
                    title={conditionDef.name}
                    subtitle={`${conditionDef.code} | ${conditionDef.category || '-'} | ${conditionDef.unit || '-'}`}
                    onEdit={() => state.openModal('conditionDef', conditionDef)}
                    onDelete={() =>
                      state.handleDelete('conditionDef', conditionDef.id, conditionDef.name)
                    }
                  />
                ))}
              </div>
            </Card>
          )}

          {state.activeTab === 'outputs' && (
            <Card>
              <ConfigCardHeader
                title={t('cfg.outputs.title')}
                icon={<BarChart3 className="h-5 w-5" />}
                onAdd={() => state.openModal('outputDef')}
              />
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 dark:bg-slate-700">
                  <tr>
                    <th className="p-3">{t('common.name')}</th>
                    <th className="p-3">{t('common.code')}</th>
                    <th className="p-3">{t('common.unit')}</th>
                    <th className="p-3">{t('cfg.outputs.data_type')}</th>
                    <th className="w-24 p-3">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {state.outputDefs.map(outputDef => (
                    <tr key={outputDef.id} className="border-b dark:border-slate-700">
                      <td className="p-3 font-medium">{outputDef.name}</td>
                      <td className="p-3 font-mono text-xs text-slate-500">{outputDef.code}</td>
                      <td className="p-3 text-slate-500">{outputDef.unit || '-'}</td>
                      <td className="p-3 text-slate-500">{outputDef.dataType || 'float'}</td>
                      <td className="p-3">
                        <ActionButtons
                          onEdit={() => state.openModal('outputDef', outputDef)}
                          onDelete={() =>
                            state.handleDelete('outputDef', outputDef.id, outputDef.name)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {state.activeTab === 'foldTypes' && (
            <Card>
              <ConfigCardHeader
                title={t('cfg.fold_types.title')}
                icon={<Box className="h-5 w-5" />}
                onAdd={() => state.openModal('foldType')}
              />
              <div className="space-y-2">
                {state.foldTypes.map(foldType => (
                  <ListItem
                    key={foldType.id}
                    title={foldType.name}
                    subtitle={t('cfg.fold.subtitle', {
                      code: foldType.code || '-',
                      angle: foldType.angle,
                    })}
                    onEdit={() => state.openModal('foldType', foldType)}
                    onDelete={() => state.handleDelete('foldType', foldType.id, foldType.name)}
                  />
                ))}
              </div>
            </Card>
          )}

          {state.activeTab === 'paramGroups' && <ParamGroupsManagement />}
          {state.activeTab === 'outputGroups' && <OutputGroupsManagement />}
          {state.activeTab === 'configRelations' && <ConfigRelationsManagement />}
          {state.activeTab === 'foldTypeSimTypes' && <FoldTypeSimTypeManagement />}

          {state.activeTab === 'projects' && (
            <Card>
              <ConfigCardHeader
                title={t('cfg.projects.title')}
                icon={<Folder className="h-5 w-5" />}
                onAdd={() => state.openModal('project')}
              />
              <div className="p-4">
                <div className="space-y-2">
                  {state.projects.map(project => (
                    <div
                      key={project.id}
                      className="flex items-start justify-between rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50 eyecare:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-900 dark:text-white eyecare:text-foreground">
                            {project.name}
                          </h4>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              project.valid
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                            }`}
                          >
                            {project.valid ? t('cfg.project.enabled') : t('cfg.project.disabled')}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400 eyecare:text-muted-foreground">
                          {t('cfg.project.code_label', { code: project.code || '-' })} |{' '}
                          {t('cfg.project.sort_label', { sort: project.sort })}
                        </div>
                        {project.remark && (
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 eyecare:text-muted-foreground">
                            {project.remark}
                          </p>
                        )}
                      </div>
                      <ActionButtons
                        onEdit={() => state.openModal('project', project)}
                        onDelete={() => state.handleDelete('project', project.id, project.name)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {state.activeTab === 'systemConfig' && <SystemConfigManagement />}
          {state.activeTab === 'statusConfig' && <StatusConfigManagement />}

          {state.activeTab === 'workflow' && (
            <Card>
              <CardHeader
                title={t('cfg.workflow.title')}
                icon={<RefreshCw className="h-5 w-5" />}
              />
              <div className="space-y-3">
                {state.workflows.map(workflow => (
                  <div
                    key={workflow.id}
                    className="rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50 eyecare:bg-muted/50"
                  >
                    <div className="font-medium">{workflow.name}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {t('cfg.workflow.summary', {
                        type: workflow.type,
                        count: workflow.nodes?.length || 0,
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <EditModal
            isOpen={state.modalOpen}
            onClose={state.closeModal}
            title={state.editingItem ? t('common.edit') : t('common.create')}
            onSave={state.handleSave}
            loading={state.loading}
          >
            <ConfigurationModalForm
              modalType={state.modalType}
              formData={state.formData}
              updateFormData={state.updateFormData}
            />
          </EditModal>
        </div>
      </div>

      <state.ConfirmDialogComponent />
    </div>
  );
};

export default Configuration;
