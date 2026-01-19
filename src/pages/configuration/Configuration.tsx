import React from 'react';
import { useUIStore } from '@/stores';
import { RESOURCES } from '@/locales';
import { Card, CardHeader } from '@/components/ui';
import {
  FolderIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  BeakerIcon,
  ChartBarIcon,
  CubeIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

import { useConfigurationState } from './hooks';
import {
  EditModal,
  FormInput,
  FormSelect,
  ConfigCardHeader,
  ListItem,
  ActionButtons,
} from './components';
import { ParamGroupsManagement } from './components/ParamGroupsManagement';
import { CondOutGroupsManagement } from './components/CondOutGroupsManagement';
import { ConfigRelationsManagement } from './components/ConfigRelationsManagement';
import { ProjectSimTypeManagement } from './components/ProjectSimTypeManagement';
import { SystemConfigManagement } from './components/SystemConfigManagement';

const CATEGORY_OPTIONS = [
  { value: 'STRUCTURE', label: '结构' },
  { value: 'THERMAL', label: '热分析' },
  { value: 'DYNAMIC', label: '动力学' },
  { value: 'ACOUSTIC', label: '声学' },
];

const Configuration: React.FC = () => {
  const { language } = useUIStore();
  const t = (key: string) => RESOURCES[language][key] || key;
  const state = useConfigurationState();

  // 配置分类结构
  const configCategories = [
    {
      key: 'basic',
      label: '基础配置',
      icon: <CubeIcon className="w-4 h-4" />,
      items: [
        { key: 'simTypes', label: '仿真类型', icon: <CubeIcon className="w-5 h-5" /> },
        {
          key: 'params',
          label: '参数定义',
          icon: <AdjustmentsHorizontalIcon className="w-5 h-5" />,
        },
        {
          key: 'solvers',
          label: '求解器',
          icon: <AdjustmentsHorizontalIcon className="w-5 h-5" />,
        },
        { key: 'conditions', label: '工况定义', icon: <BeakerIcon className="w-5 h-5" /> },
        { key: 'outputs', label: '输出定义', icon: <ChartBarIcon className="w-5 h-5" /> },
        { key: 'foldTypes', label: '姿态类型', icon: <CubeIcon className="w-5 h-5" /> },
      ],
    },
    {
      key: 'groups',
      label: '组合配置',
      icon: <FolderIcon className="w-4 h-4" />,
      items: [
        {
          key: 'paramGroups',
          label: '参数组合',
          icon: <AdjustmentsHorizontalIcon className="w-5 h-5" />,
        },
        { key: 'condOutGroups', label: '工况输出组合', icon: <BeakerIcon className="w-5 h-5" /> },
      ],
    },
    {
      key: 'relations',
      label: '关联配置',
      icon: <LinkIcon className="w-4 h-4" />,
      items: [
        { key: 'configRelations', label: '配置关联管理', icon: <LinkIcon className="w-5 h-5" /> },
      ],
    },
    {
      key: 'system',
      label: '系统配置',
      icon: <FolderIcon className="w-4 h-4" />,
      items: [
        { key: 'projects', label: '项目管理', icon: <FolderIcon className="w-5 h-5" /> },
        {
          key: 'projectSimTypes',
          label: '项目仿真类型',
          icon: <LinkIcon className="w-5 h-5" />,
        },
        { key: 'systemConfig', label: '系统配置', icon: <CubeIcon className="w-5 h-5" /> },
        { key: 'workflow', label: '工作流', icon: <ArrowPathIcon className="w-5 h-5" /> },
      ],
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('cfg.title')}</h1>
      </div>

      {/* 分类导航 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧分类菜单 */}
        <div className="lg:col-span-1">
          <Card>
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
                配置分类
              </h2>
              <div className="space-y-2">
                {configCategories.map(category => (
                  <div key={category.key} className="space-y-1">
                    <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg">
                      {category.icon}
                      <span>{category.label}</span>
                    </div>
                    <div className="ml-4 space-y-1">
                      {category.items.map(item => (
                        <button
                          key={item.key}
                          onClick={() => state.setActiveTab(item.key)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                            state.activeTab === item.key
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                          }`}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* 右侧内容区域 */}
        <div className="lg:col-span-3">
          {/* 仿真类型 */}
          {state.activeTab === 'simTypes' && (
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
                    colorDot={`bg-${st.colorTag}-500`}
                    onEdit={() => state.openModal('simType', st)}
                    onDelete={() => state.handleDelete('simType', st.id, st.name)}
                  />
                ))}
              </div>
            </Card>
          )}

          {/* 参数定义 */}
          {state.activeTab === 'params' && (
            <Card>
              <ConfigCardHeader
                title="参数定义管理"
                icon={<AdjustmentsHorizontalIcon className="w-5 h-5" />}
                onAdd={() => state.openModal('paramDef')}
              />
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 dark:bg-slate-700">
                  <tr>
                    <th className="p-3">名称</th>
                    <th className="p-3">Key</th>
                    <th className="p-3">单位</th>
                    <th className="p-3">范围</th>
                    <th className="p-3 w-24">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {state.paramDefs.map(p => (
                    <tr key={p.id} className="border-b dark:border-slate-700">
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3 text-slate-500 font-mono text-xs">{p.key}</td>
                      <td className="p-3 text-slate-500">{p.unit || '-'}</td>
                      <td className="p-3 text-slate-500">
                        {p.minVal} - {p.maxVal}
                      </td>
                      <td className="p-3">
                        <ActionButtons
                          onEdit={() => state.openModal('paramDef', p)}
                          onDelete={() => state.handleDelete('paramDef', p.id, p.name)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {/* 求解器 */}
          {state.activeTab === 'solvers' && (
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
          )}

          {/* 工况定义 */}
          {state.activeTab === 'conditions' && (
            <Card>
              <ConfigCardHeader
                title="工况定义管理"
                icon={<BeakerIcon className="w-5 h-5" />}
                onAdd={() => state.openModal('conditionDef')}
              />
              <div className="space-y-2">
                {state.conditionDefs.map(c => (
                  <ListItem
                    key={c.id}
                    title={c.name}
                    subtitle={`${c.code} | ${c.category || '-'} | ${c.unit || '-'}`}
                    onEdit={() => state.openModal('conditionDef', c)}
                    onDelete={() => state.handleDelete('conditionDef', c.id, c.name)}
                  />
                ))}
              </div>
            </Card>
          )}

          {/* 输出定义 */}
          {state.activeTab === 'outputs' && (
            <Card>
              <ConfigCardHeader
                title="输出定义管理"
                icon={<ChartBarIcon className="w-5 h-5" />}
                onAdd={() => state.openModal('outputDef')}
              />
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 dark:bg-slate-700">
                  <tr>
                    <th className="p-3">名称</th>
                    <th className="p-3">编码</th>
                    <th className="p-3">单位</th>
                    <th className="p-3">数据类型</th>
                    <th className="p-3 w-24">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {state.outputDefs.map(o => (
                    <tr key={o.id} className="border-b dark:border-slate-700">
                      <td className="p-3 font-medium">{o.name}</td>
                      <td className="p-3 text-slate-500 font-mono text-xs">{o.code}</td>
                      <td className="p-3 text-slate-500">{o.unit || '-'}</td>
                      <td className="p-3 text-slate-500">{o.dataType || 'float'}</td>
                      <td className="p-3">
                        <ActionButtons
                          onEdit={() => state.openModal('outputDef', o)}
                          onDelete={() => state.handleDelete('outputDef', o.id, o.name)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {/* 姿态类型 */}
          {state.activeTab === 'foldTypes' && (
            <Card>
              <ConfigCardHeader
                title="姿态类型管理"
                icon={<CubeIcon className="w-5 h-5" />}
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
          )}

          {/* 参数组合管理 */}
          {state.activeTab === 'paramGroups' && <ParamGroupsManagement />}

          {/* 工况输出组合管理 */}
          {state.activeTab === 'condOutGroups' && <CondOutGroupsManagement />}

          {/* 配置关联管理 */}
          {state.activeTab === 'configRelations' && <ConfigRelationsManagement />}

          {/* 项目管理 */}
          {state.activeTab === 'projects' && (
            <Card>
              <ConfigCardHeader
                title="项目管理"
                icon={<FolderIcon className="w-5 h-5" />}
                onAdd={() => state.openModal('project')}
              />
              <div className="p-4">
                <div className="space-y-2">
                  {state.projects.map(project => (
                    <div
                      key={project.id}
                      className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex justify-between items-start"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-900 dark:text-white">
                            {project.name}
                          </h4>
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
                        {project.remark && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
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

          {/* 项目仿真类型关联 */}
          {state.activeTab === 'projectSimTypes' && <ProjectSimTypeManagement />}

          {/* 系统配置 */}
          {state.activeTab === 'systemConfig' && <SystemConfigManagement />}

          {/* 工作流（只读） */}
          {state.activeTab === 'workflow' && (
            <Card>
              <CardHeader title="工作流配置" icon={<ArrowPathIcon className="w-5 h-5" />} />
              <div className="space-y-3">
                {state.workflows.map(wf => (
                  <div key={wf.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="font-medium">{wf.name}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      类型: {wf.type} | 节点数: {wf.nodes?.length || 0}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 编辑弹窗 */}
          <EditModal
            isOpen={state.modalOpen}
            onClose={state.closeModal}
            title={state.editingItem ? '编辑' : '新建'}
            onSave={state.handleSave}
            loading={state.loading}
          >
            {state.modalType === 'simType' && (
              <>
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
              </>
            )}
            {state.modalType === 'paramDef' && (
              <>
                <FormInput
                  label="名称"
                  value={state.formData.name || ''}
                  onChange={v => state.updateFormData('name', v)}
                  placeholder="请输入参数名称"
                />
                <FormInput
                  label="Key"
                  value={state.formData.key || ''}
                  onChange={v => state.updateFormData('key', v)}
                  placeholder="请输入参数键名（英文）"
                />
                <FormSelect
                  label="数据类型"
                  value={String(state.formData.valType || 1)}
                  onChange={v => state.updateFormData('valType', Number(v))}
                  options={[
                    { value: '1', label: '浮点数' },
                    { value: '2', label: '整数' },
                    { value: '3', label: '字符串' },
                    { value: '4', label: '枚举' },
                    { value: '5', label: '布尔' },
                  ]}
                />
                <FormInput
                  label="单位"
                  value={state.formData.unit || ''}
                  onChange={v => state.updateFormData('unit', v)}
                  placeholder="如：mm, kg, MPa"
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="最小值"
                    value={state.formData.minVal ?? 0}
                    onChange={v => {
                      console.log('🔵 [最小值] 输入值:', v, '类型:', typeof v);
                      console.log('🔵 [最小值] 转换后:', Number(v));
                      console.log('🔵 [最小值] 当前 formData:', state.formData);
                      state.updateFormData('minVal', Number(v));
                    }}
                    type="number"
                  />
                  <FormInput
                    label="最大值"
                    value={state.formData.maxVal ?? 100}
                    onChange={v => {
                      console.log('🟡 [最大值] 输入值:', v, '类型:', typeof v);
                      console.log('🟡 [最大值] 转换后:', Number(v));
                      console.log('🟡 [最大值] 当前 formData:', state.formData);
                      state.updateFormData('maxVal', Number(v));
                    }}
                    type="number"
                  />
                </div>
                <FormInput
                  label="默认值"
                  value={state.formData.defaultVal || ''}
                  onChange={v => {
                    console.log('🟢 [默认值] 输入值:', v, '类型:', typeof v);
                    console.log('🟢 [默认值] 当前 formData:', state.formData);
                    state.updateFormData('defaultVal', v);
                  }}
                  placeholder="请输入默认值"
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="精度"
                    value={state.formData.precision ?? 3}
                    onChange={v => state.updateFormData('precision', Number(v))}
                    type="number"
                  />
                  <FormInput
                    label="排序"
                    value={state.formData.sort ?? 100}
                    onChange={v => state.updateFormData('sort', Number(v))}
                    type="number"
                  />
                </div>
              </>
            )}
            {state.modalType === 'solver' && (
              <>
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
                  <h4 className="text-sm font-medium mb-3 text-slate-700 dark:text-slate-300">
                    CPU 核数配置
                  </h4>
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
                <div className="border-t pt-4 mt-2">
                  <h4 className="text-sm font-medium mb-3 text-slate-700 dark:text-slate-300">
                    内存配置 (GB)
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <FormInput
                      label="最小内存"
                      value={state.formData.memoryMin ?? 1}
                      onChange={v => state.updateFormData('memoryMin', Number(v))}
                      type="number"
                    />
                    <FormInput
                      label="最大内存"
                      value={state.formData.memoryMax ?? 1024}
                      onChange={v => state.updateFormData('memoryMax', Number(v))}
                      type="number"
                    />
                    <FormInput
                      label="默认内存"
                      value={state.formData.memoryDefault ?? 64}
                      onChange={v => state.updateFormData('memoryDefault', Number(v))}
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
              </>
            )}
            {state.modalType === 'conditionDef' && (
              <>
                <FormInput
                  label="名称"
                  value={state.formData.name || ''}
                  onChange={v => state.updateFormData('name', v)}
                  placeholder="请输入工况名称"
                />
                <FormInput
                  label="编码"
                  value={state.formData.code || ''}
                  onChange={v => state.updateFormData('code', v)}
                  placeholder="请输入工况编码"
                />
                <FormInput
                  label="分类"
                  value={state.formData.category || ''}
                  onChange={v => state.updateFormData('category', v)}
                  placeholder="如：载荷、约束等"
                />
                <FormInput
                  label="单位"
                  value={state.formData.unit || ''}
                  onChange={v => state.updateFormData('unit', v)}
                  placeholder="如：N, MPa"
                />
                <FormInput
                  label="排序"
                  value={state.formData.sort ?? 100}
                  onChange={v => state.updateFormData('sort', Number(v))}
                  type="number"
                />
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    备注
                  </label>
                  <textarea
                    value={state.formData.remark || ''}
                    onChange={e => state.updateFormData('remark', e.target.value)}
                    placeholder="请输入备注信息（可选）"
                    rows={2}
                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                  />
                </div>
              </>
            )}
            {state.modalType === 'outputDef' && (
              <>
                <FormInput
                  label="名称"
                  value={state.formData.name || ''}
                  onChange={v => state.updateFormData('name', v)}
                  placeholder="请输入输出名称"
                />
                <FormInput
                  label="编码"
                  value={state.formData.code || ''}
                  onChange={v => state.updateFormData('code', v)}
                  placeholder="请输入输出编码"
                />
                <FormInput
                  label="单位"
                  value={state.formData.unit || ''}
                  onChange={v => state.updateFormData('unit', v)}
                  placeholder="如：mm, MPa, Hz"
                />
                <FormSelect
                  label="数据类型"
                  value={state.formData.dataType || 'float'}
                  onChange={v => state.updateFormData('dataType', v)}
                  options={[
                    { value: 'float', label: '浮点数' },
                    { value: 'int', label: '整数' },
                    { value: 'string', label: '字符串' },
                  ]}
                />
                <FormInput
                  label="排序"
                  value={state.formData.sort ?? 100}
                  onChange={v => state.updateFormData('sort', Number(v))}
                  type="number"
                />
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    备注
                  </label>
                  <textarea
                    value={state.formData.remark || ''}
                    onChange={e => state.updateFormData('remark', e.target.value)}
                    placeholder="请输入备注信息（可选）"
                    rows={2}
                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                  />
                </div>
              </>
            )}
            {state.modalType === 'foldType' && (
              <>
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
                  placeholder="请输入角度值"
                />
                <FormInput
                  label="排序"
                  value={state.formData.sort ?? 100}
                  onChange={v => state.updateFormData('sort', Number(v))}
                  type="number"
                />
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    备注
                  </label>
                  <textarea
                    value={state.formData.remark || ''}
                    onChange={e => state.updateFormData('remark', e.target.value)}
                    placeholder="请输入备注信息（可选）"
                    rows={2}
                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                  />
                </div>
              </>
            )}
            {state.modalType === 'project' && (
              <>
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
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    备注
                  </label>
                  <textarea
                    value={state.formData.remark || ''}
                    onChange={e => state.updateFormData('remark', e.target.value)}
                    placeholder="请输入备注信息（可选）"
                    rows={3}
                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                  />
                </div>
              </>
            )}
          </EditModal>
        </div>
      </div>

      {/* 确认对话框 */}
      <state.ConfirmDialogComponent />
    </div>
  );
};

export default Configuration;
