import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { Button, Card, CardHeader } from '@/components/ui';
import { configApi } from '@/api';
import { useConfirmDialog, useToast } from '@/hooks';
import { queryKeys } from '@/lib/queryClient';
import type { ConditionConfig } from '@/types';
import type { OutputGroup, ParamGroup } from '@/types/configGroups';
import { ConditionFormData, ConditionFormModal } from './conditions/ConditionFormModal';

export const ConditionConfigManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { showConfirm, ConfirmDialogComponent } = useConfirmDialog();

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

  const { data: foldTypes = [] } = useQuery({
    queryKey: ['foldTypes'],
    queryFn: () => configApi.getFoldTypes().then(response => response.data),
  });

  const { data: simTypes = [] } = useQuery({
    queryKey: ['simTypes'],
    queryFn: () => configApi.getSimTypes().then(response => response.data),
  });

  const { data: conditionConfigs = [] } = useQuery({
    queryKey: queryKeys.conditionConfigs.list(),
    queryFn: () => configApi.getConditionConfigs().then(response => response.data),
  });

  const { data: paramGroups = [] } = useQuery<ParamGroup[]>({
    queryKey: ['paramGroups'],
    queryFn: async (): Promise<ParamGroup[]> => {
      const response = await configApi.getParamGroups();
      return (response.data || []) as ParamGroup[];
    },
  });

  const { data: outputGroups = [] } = useQuery<OutputGroup[]>({
    queryKey: ['outputGroups'],
    queryFn: async (): Promise<OutputGroup[]> => {
      const response = await configApi.getOutputGroups();
      return (response.data || []) as OutputGroup[];
    },
  });

  const { data: solvers = [] } = useQuery({
    queryKey: ['solvers'],
    queryFn: () => configApi.getSolvers().then(response => response.data),
  });

  const groupedByFoldType = useMemo(() => {
    const grouped: Record<number, ConditionConfig[]> = {};
    foldTypes.forEach(foldType => {
      grouped[foldType.id] = conditionConfigs.filter(config => config.foldTypeId === foldType.id);
    });
    return grouped;
  }, [conditionConfigs, foldTypes]);

  const getFoldTypeName = (id: number) => foldTypes.find(item => item.id === id)?.name || '-';
  const getSimTypeName = (id: number) => simTypes.find(item => item.id === id)?.name || '-';
  const getSolverName = (id: number) => solvers.find(item => item.id === id)?.name || '-';
  const getParamGroupName = (id: number) =>
    paramGroups.find((item: ParamGroup) => item.id === id)?.name || '-';
  const getOutputGroupName = (id: number) =>
    outputGroups.find((item: OutputGroup) => item.id === id)?.name || '-';

  const isDuplicateCombo = (foldTypeId: number | null, simTypeId: number | null) => {
    if (!foldTypeId || !simTypeId) return false;
    return conditionConfigs.some(
      config =>
        config.foldTypeId === foldTypeId &&
        config.simTypeId === simTypeId &&
        config.id !== editingConfig?.id
    );
  };

  const autoGenerateName = (foldId: number | null, simId: number | null) => {
    if (!foldId || !simId) return '';
    const foldName = foldTypes.find(item => item.id === foldId)?.name || '';
    const simName = simTypes.find(item => item.id === simId)?.name || '';
    return foldName && simName ? `${foldName}-${simName}` : '';
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingConfig(null);
  };

  const createMutation = useMutation({
    mutationFn: (data: Partial<ConditionConfig>) => configApi.createConditionConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conditionConfigs.all });
      showToast('success', '创建成功');
      handleCloseModal();
    },
    onError: (error: unknown) => {
      const message = (error as { message?: string })?.message || '创建失败';
      showToast('error', message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ConditionConfig> }) =>
      configApi.updateConditionConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conditionConfigs.all });
      showToast('success', '更新成功');
      handleCloseModal();
    },
    onError: (error: unknown) => {
      const message = (error as { message?: string })?.message || '更新失败';
      showToast('error', message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => configApi.deleteConditionConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conditionConfigs.all });
      showToast('success', '删除成功');
    },
    onError: (error: unknown) => {
      const message = (error as { message?: string })?.message || '删除失败';
      showToast('error', message);
    },
  });

  const handleAdd = (presetFoldTypeId?: number) => {
    setEditingConfig(null);
    setFormData({
      name: presetFoldTypeId ? autoGenerateName(presetFoldTypeId, null) : '',
      code: '',
      foldTypeId: presetFoldTypeId ?? null,
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

  const handleDelete = (id: number, name: string) => {
    showConfirm(
      '确认删除',
      `确定要删除工况“${name}”吗？`,
      () => {
        deleteMutation.mutate(id);
      },
      'danger'
    );
  };

  const handleSetDefault = async (config: ConditionConfig) => {
    try {
      const sameGroup = conditionConfigs.filter(
        item =>
          item.foldTypeId === config.foldTypeId && item.id !== config.id && item.isDefault === 1
      );

      for (const item of sameGroup) {
        await configApi.updateConditionConfig(item.id, { isDefault: 0 });
      }

      const newDefault = config.isDefault === 1 ? 0 : 1;
      await configApi.updateConditionConfig(config.id, { isDefault: newDefault });
      queryClient.invalidateQueries({ queryKey: queryKeys.conditionConfigs.all });
      showToast('success', newDefault === 1 ? '已设为默认' : '已取消默认');
    } catch {
      showToast('error', '设置默认失败');
    }
  };

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
    if (isDuplicateCombo(formData.foldTypeId, formData.simTypeId)) {
      showToast(
        'error',
        `“${getFoldTypeName(formData.foldTypeId)} / ${getSimTypeName(formData.simTypeId)}” 的组合已存在`
      );
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
      return;
    }

    createMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader
        title="工况组合配置"
        icon={<Link className="w-5 h-5" />}
        subtitle="配置姿态、仿真类型、参数组、输出组与默认求解器之间的关联关系"
        action={
          <Button size="sm" onClick={() => handleAdd()}>
            <Plus className="w-4 h-4 mr-1" />
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
              <th className="p-3 text-left border dark:border-slate-600" colSpan={5}>
                工况配置
              </th>
            </tr>
            <tr className="bg-slate-50 dark:bg-slate-700/50">
              <th className="p-2 text-left border dark:border-slate-600 text-xs">仿真类型</th>
              <th className="p-2 text-left border dark:border-slate-600 text-xs">参数组</th>
              <th className="p-2 text-left border dark:border-slate-600 text-xs">输出组</th>
              <th className="p-2 text-left border dark:border-slate-600 text-xs">默认求解器</th>
              <th className="p-2 text-center border dark:border-slate-600 text-xs w-20">操作</th>
            </tr>
          </thead>
          <tbody>
            {foldTypes.map(foldType => {
              const configs = groupedByFoldType[foldType.id] || [];
              const rowSpan = Math.max(configs.length, 1);

              return configs.length > 0 ? (
                configs.map((config, index) => (
                  <tr
                    key={config.id}
                    className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    {index === 0 && (
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
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs">
                          {getSimTypeName(config.simTypeId)}
                        </span>
                        {config.isDefault === 1 && (
                          <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded text-xs">
                            默认
                          </span>
                        )}
                      </div>
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
                    <td className="p-2 border dark:border-slate-600">
                      {config.defaultSolverId ? (
                        <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-xs">
                          {getSolverName(config.defaultSolverId)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-2 border dark:border-slate-600 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleSetDefault(config)}
                          className={`p-1 ${
                            config.isDefault === 1
                              ? 'text-amber-500'
                              : 'text-slate-400 hover:text-amber-500'
                          }`}
                          title={config.isDefault === 1 ? '取消默认' : '设为默认'}
                        >
                          <Star
                            className="w-4 h-4"
                            fill={config.isDefault === 1 ? 'currentColor' : 'none'}
                          />
                        </button>
                        <button
                          onClick={() => handleEdit(config)}
                          className="p-1 text-slate-500 hover:text-brand-600"
                          title="编辑"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(config.id, config.name)}
                          className="p-1 text-slate-500 hover:text-red-600"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
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
                  <td colSpan={5} className="p-3 border dark:border-slate-600">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-slate-400">暂无工况配置</span>
                      <button
                        onClick={() => handleAdd(foldType.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        添加
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConditionFormModal
        showModal={showModal}
        editingConfig={editingConfig}
        formData={formData}
        foldTypes={foldTypes}
        simTypes={simTypes}
        paramGroups={paramGroups}
        outputGroups={outputGroups}
        solvers={solvers}
        isDuplicateCombo={isDuplicateCombo(formData.foldTypeId, formData.simTypeId)}
        pending={createMutation.isPending || updateMutation.isPending}
        autoGenerateName={autoGenerateName}
        setFormData={setFormData}
        onClose={handleCloseModal}
        onSave={handleSave}
      />
      <ConfirmDialogComponent />
    </Card>
  );
};
