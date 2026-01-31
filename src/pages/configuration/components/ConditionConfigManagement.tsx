import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinkIcon, PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, Button } from '@/components/ui';
import { configApi } from '@/api';
import { useToast, useConfirmDialog } from '@/hooks';
import type { ConditionConfig, Solver } from '@/types';
import type { ParamGroup } from '@/types/configGroups';

interface ConditionFormData {
  name: string;
  code: string;
  foldTypeId: number | null;
  simTypeId: number | null;
  paramGroupIds: number[];
  outputGroupIds: number[];
  defaultParamGroupId: number | null;
  defaultOutputGroupId: number | null;
  defaultSolverId: number | null;
  sort: number;
  remark: string;
}

export const ConditionConfigManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { showConfirm } = useConfirmDialog();

  // 弹窗状态
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ConditionConfig | null>(null);
  const [formData, setFormData] = useState<ConditionFormData>({
    name: '',
    code: '',
    foldTypeId: null,
    simTypeId: null,
    paramGroupIds: [],
    outputGroupIds: [],
    defaultParamGroupId: null,
    defaultOutputGroupId: null,
    defaultSolverId: null,
    sort: 100,
    remark: '',
  });

  // 获取基础数据
  const { data: foldTypes = [] } = useQuery({
    queryKey: ['foldTypes'],
    queryFn: () => configApi.getFoldTypes().then(r => r.data),
  });

  const { data: simTypes = [] } = useQuery({
    queryKey: ['simTypes'],
    queryFn: () => configApi.getSimTypes().then(r => r.data),
  });

  const { data: conditionConfigs = [] } = useQuery({
    queryKey: ['conditionConfigs'],
    queryFn: () => configApi.getConditionConfigs().then(r => r.data),
  });

  const { data: paramGroups = [] } = useQuery({
    queryKey: ['paramGroups'],
    queryFn: () => configApi.getParamGroups().then(r => r.data),
  });

  const { data: outputGroups = [] } = useQuery({
    queryKey: ['outputGroups'],
    queryFn: () => configApi.getOutputGroups().then(r => r.data),
  });

  const { data: solvers = [] } = useQuery({
    queryKey: ['solvers'],
    queryFn: () => configApi.getSolvers().then(r => r.data),
  });

  // 按姿态分组的工况配置
  const groupedByFoldType = useMemo(() => {
    const grouped: Record<number, ConditionConfig[]> = {};
    foldTypes.forEach(ft => {
      grouped[ft.id] = conditionConfigs.filter(c => c.foldTypeId === ft.id);
    });
    return grouped;
  }, [foldTypes, conditionConfigs]);

  // 获取名称的辅助函数
  const getSimTypeName = (id: number) => simTypes.find(s => s.id === id)?.name || '-';
  const getParamGroupName = (id: number) => paramGroups.find(p => p.id === id)?.name || '-';
  const getOutputGroupName = (id: number) => outputGroups.find(o => o.id === id)?.name || '-';
  const getSolverName = (id: number) => solvers.find(s => s.id === id)?.name || '-';

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Partial<ConditionConfig>) => configApi.createConditionConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conditionConfigs'] });
      showToast('success', '创建成功');
      handleCloseModal();
    },
    onError: (err: unknown) => {
      const msg = (err as { message?: string })?.message || '创建失败';
      showToast('error', msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ConditionConfig> }) =>
      configApi.updateConditionConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conditionConfigs'] });
      showToast('success', '更新成功');
      handleCloseModal();
    },
    onError: (err: unknown) => {
      const msg = (err as { message?: string })?.message || '更新失败';
      showToast('error', msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => configApi.deleteConditionConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conditionConfigs'] });
      showToast('success', '删除成功');
    },
    onError: (err: unknown) => {
      const msg = (err as { message?: string })?.message || '删除失败';
      showToast('error', msg);
    },
  });

  // 打开新增弹窗
  const handleAdd = () => {
    setEditingConfig(null);
    setFormData({
      name: '',
      code: '',
      foldTypeId: null,
      simTypeId: null,
      paramGroupIds: [],
      outputGroupIds: [],
      defaultParamGroupId: null,
      defaultOutputGroupId: null,
      defaultSolverId: null,
      sort: 100,
      remark: '',
    });
    setShowModal(true);
  };

  // 打开编辑弹窗
  const handleEdit = (config: ConditionConfig) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      code: config.code || '',
      foldTypeId: config.foldTypeId,
      simTypeId: config.simTypeId,
      paramGroupIds: config.paramGroupIds || [],
      outputGroupIds: config.outputGroupIds || [],
      defaultParamGroupId: config.defaultParamGroupId || null,
      defaultOutputGroupId: config.defaultOutputGroupId || null,
      defaultSolverId: config.defaultSolverId || null,
      sort: config.sort,
      remark: config.remark || '',
    });
    setShowModal(true);
  };

  // 关闭弹窗
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingConfig(null);
  };

  // 删除工况
  const handleDelete = (id: number, name: string) => {
    showConfirm(
      '确认删除',
      `确定要删除工况「${name}」吗？`,
      () => {
        deleteMutation.mutate(id);
      },
      'danger'
    );
  };

  // 保存
  const handleSave = () => {
    if (!formData.name.trim()) {
      showToast('error', '请输入工况名称');
      return;
    }
    if (formData.foldTypeId === null) {
      showToast('error', '请选择姿态');
      return;
    }
    if (formData.simTypeId === null) {
      showToast('error', '请选择仿真类型');
      return;
    }

    const data = {
      name: formData.name.trim(),
      code: formData.code.trim() || undefined,
      foldTypeId: formData.foldTypeId,
      simTypeId: formData.simTypeId,
      paramGroupIds: formData.paramGroupIds,
      outputGroupIds: formData.outputGroupIds,
      defaultParamGroupId: formData.defaultParamGroupId || undefined,
      defaultOutputGroupId: formData.defaultOutputGroupId || undefined,
      defaultSolverId: formData.defaultSolverId || undefined,
      sort: formData.sort,
      remark: formData.remark.trim() || undefined,
    };

    if (editingConfig) {
      updateMutation.mutate({ id: editingConfig.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Card>
      <CardHeader
        title="工况组合配置"
        icon={<LinkIcon className="w-5 h-5" />}
        description="配置姿态+仿真类型+参数组+输出组的关联关系"
        action={
          <Button size="sm" onClick={handleAdd}>
            <PlusIcon className="w-4 h-4 mr-1" />
            新增工况
          </Button>
        }
      />
      <div className="p-4 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-700">
              <th className="p-3 text-left border dark:border-slate-600" rowSpan={2}>
                目标姿态
              </th>
              <th className="p-3 text-left border dark:border-slate-600" colSpan={4}>
                工况配置
              </th>
            </tr>
            <tr className="bg-slate-50 dark:bg-slate-700/50">
              <th className="p-2 text-left border dark:border-slate-600 text-xs">仿真类型</th>
              <th className="p-2 text-left border dark:border-slate-600 text-xs">参数组</th>
              <th className="p-2 text-left border dark:border-slate-600 text-xs">输出组</th>
              <th className="p-2 text-center border dark:border-slate-600 text-xs w-20">操作</th>
            </tr>
          </thead>
          <tbody>
            {foldTypes.map(foldType => {
              const configs = groupedByFoldType[foldType.id] || [];
              const rowSpan = Math.max(configs.length, 1);

              return configs.length > 0 ? (
                configs.map((config, idx) => (
                  <tr
                    key={config.id}
                    className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    {idx === 0 && (
                      <td
                        className="p-3 font-medium border dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                        rowSpan={rowSpan}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-brand-500" />
                          {foldType.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {foldType.code} | {foldType.angle}°
                        </div>
                      </td>
                    )}
                    <td className="p-2 border dark:border-slate-600">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs">
                        {getSimTypeName(config.simTypeId)}
                      </span>
                    </td>
                    <td className="p-2 border dark:border-slate-600">
                      {config.paramGroupIds?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {config.paramGroupIds.map((id: number) => (
                            <span
                              key={id}
                              className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs"
                            >
                              {getParamGroupName(id)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-2 border dark:border-slate-600">
                      {config.outputGroupIds?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {config.outputGroupIds.map((id: number) => (
                            <span
                              key={id}
                              className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded text-xs"
                            >
                              {getOutputGroupName(id)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-2 border dark:border-slate-600 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(config)}
                          className="p-1 text-slate-500 hover:text-brand-600"
                          title="编辑"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(config.id, config.name)}
                          className="p-1 text-slate-500 hover:text-red-600"
                          title="删除"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr key={foldType.id} className="border-b dark:border-slate-700">
                  <td className="p-3 font-medium border dark:border-slate-600 bg-slate-50 dark:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-300" />
                      {foldType.name}
                    </div>
                  </td>
                  <td
                    colSpan={4}
                    className="p-3 text-center text-slate-400 border dark:border-slate-600"
                  >
                    暂无工况配置
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 新增/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {editingConfig ? '编辑工况配置' : '新增工况配置'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    工况名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                    placeholder="如：展开态-静力分析"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    工况编码
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                    placeholder="如：DEPLOY_STATIC"
                  />
                </div>
              </div>

              {/* 姿态和仿真类型 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    目标姿态 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.foldTypeId?.toString() || ''}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        foldTypeId: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                    disabled={!!editingConfig}
                  >
                    <option value="">请选择姿态</option>
                    {foldTypes.map(ft => (
                      <option key={ft.id} value={ft.id.toString()}>
                        {ft.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    仿真类型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.simTypeId?.toString() || ''}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        simTypeId: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                    disabled={!!editingConfig}
                  >
                    <option value="">请选择仿真类型</option>
                    {simTypes.map(st => (
                      <option key={st.id} value={st.id.toString()}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 参数组选择 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  可用参数组
                </label>
                <div className="border rounded-lg p-3 dark:border-slate-600 max-h-32 overflow-y-auto">
                  {paramGroups.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {paramGroups.map(pg => (
                        <label key={pg.id} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.paramGroupIds.includes(pg.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  paramGroupIds: [...prev.paramGroupIds, pg.id],
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  paramGroupIds: prev.paramGroupIds.filter(id => id !== pg.id),
                                  defaultParamGroupId:
                                    prev.defaultParamGroupId === pg.id
                                      ? null
                                      : prev.defaultParamGroupId,
                                }));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{pg.name}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-sm">暂无参数组</span>
                  )}
                </div>
              </div>

              {/* 输出组选择 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  可用输出组
                </label>
                <div className="border rounded-lg p-3 dark:border-slate-600 max-h-32 overflow-y-auto">
                  {outputGroups.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {outputGroups.map(og => (
                        <label key={og.id} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.outputGroupIds.includes(og.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  outputGroupIds: [...prev.outputGroupIds, og.id],
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  outputGroupIds: prev.outputGroupIds.filter(id => id !== og.id),
                                  defaultOutputGroupId:
                                    prev.defaultOutputGroupId === og.id
                                      ? null
                                      : prev.defaultOutputGroupId,
                                }));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{og.name}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-sm">暂无输出组</span>
                  )}
                </div>
              </div>

              {/* 默认配置 */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    默认参数组
                  </label>
                  <select
                    value={formData.defaultParamGroupId || ''}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        defaultParamGroupId: Number(e.target.value) || null,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-sm"
                  >
                    <option value="">不设置</option>
                    {formData.paramGroupIds.map(id => {
                      const pg = paramGroups.find(p => p.id === id);
                      return pg ? (
                        <option key={id} value={id}>
                          {pg.name}
                        </option>
                      ) : null;
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    默认输出组
                  </label>
                  <select
                    value={formData.defaultOutputGroupId || ''}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        defaultOutputGroupId: Number(e.target.value) || null,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-sm"
                  >
                    <option value="">不设置</option>
                    {formData.outputGroupIds.map(id => {
                      const og = outputGroups.find(o => o.id === id);
                      return og ? (
                        <option key={id} value={id}>
                          {og.name}
                        </option>
                      ) : null;
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    默认求解器
                  </label>
                  <select
                    value={formData.defaultSolverId || ''}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        defaultSolverId: Number(e.target.value) || null,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-sm"
                  >
                    <option value="">不设置</option>
                    {solvers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t dark:border-slate-700">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
