import React from 'react';
import { useUIStore } from '@/stores';
import { RESOURCES } from '@/locales';
import { Card, CardHeader } from '@/components/ui';
import { Folder, SlidersHorizontal, RefreshCw, FlaskConical, BarChart3, Box } from 'lucide-react';
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
import { ProjectSimTypeManagement } from './components/ProjectSimTypeManagement';
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
  const { language } = useUIStore();
  const t = (key: string) => RESOURCES[language][key] || key;
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
                title="仿真类型管理"
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
                title="参数定义管理"
                icon={<SlidersHorizontal className="h-5 w-5" />}
                onAdd={() => state.openModal('paramDef')}
              />
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 dark:bg-slate-700">
                  <tr>
                    <th className="p-3">名称</th>
                    <th className="p-3">Key</th>
                    <th className="p-3">单位</th>
                    <th className="p-3">范围</th>
                    <th className="w-24 p-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {state.paramDefs.map(paramDef => (
                    <tr key={paramDef.id} className="border-b dark:border-slate-700">
                      <td className="p-3 font-medium">{paramDef.name}</td>
                      <td className="p-3 text-xs font-mono text-slate-500">{paramDef.key}</td>
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
                title="求解器管理"
                icon={<SlidersHorizontal className="h-5 w-5" />}
                onAdd={() => state.openModal('solver')}
              />
              <div className="space-y-2">
                {state.solvers.map(solver => (
                  <ListItem
                    key={solver.id}
                    title={solver.name}
                    subtitle={`v${solver.version} | CPU: ${solver.cpuCoreMin}-${solver.cpuCoreMax} | 默认: ${solver.cpuCoreDefault}核`}
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
                title="工况定义管理"
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
                title="输出定义管理"
                icon={<BarChart3 className="h-5 w-5" />}
                onAdd={() => state.openModal('outputDef')}
              />
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 dark:bg-slate-700">
                  <tr>
                    <th className="p-3">名称</th>
                    <th className="p-3">编码</th>
                    <th className="p-3">单位</th>
                    <th className="p-3">数据类型</th>
                    <th className="w-24 p-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {state.outputDefs.map(outputDef => (
                    <tr key={outputDef.id} className="border-b dark:border-slate-700">
                      <td className="p-3 font-medium">{outputDef.name}</td>
                      <td className="p-3 text-xs font-mono text-slate-500">{outputDef.code}</td>
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
                title="姿态类型管理"
                icon={<Box className="h-5 w-5" />}
                onAdd={() => state.openModal('foldType')}
              />
              <div className="space-y-2">
                {state.foldTypes.map(foldType => (
                  <ListItem
                    key={foldType.id}
                    title={foldType.name}
                    subtitle={`${foldType.code || '-'} | 角度: ${foldType.angle}°`}
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
                title="项目管理"
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
                            {project.valid ? '启用' : '禁用'}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400 eyecare:text-muted-foreground">
                          编码: {project.code || '无'} | 排序: {project.sort}
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

          {state.activeTab === 'projectSimTypes' && <ProjectSimTypeManagement />}
          {state.activeTab === 'systemConfig' && <SystemConfigManagement />}
          {state.activeTab === 'statusConfig' && <StatusConfigManagement />}

          {state.activeTab === 'workflow' && (
            <Card>
              <CardHeader title="工作流配置" icon={<RefreshCw className="h-5 w-5" />} />
              <div className="space-y-3">
                {state.workflows.map(workflow => (
                  <div
                    key={workflow.id}
                    className="rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50 eyecare:bg-muted/50"
                  >
                    <div className="font-medium">{workflow.name}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      类型: {workflow.type} | 节点数: {workflow.nodes?.length || 0}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <EditModal
            isOpen={state.modalOpen}
            onClose={state.closeModal}
            title={state.editingItem ? '编辑' : '新建'}
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
