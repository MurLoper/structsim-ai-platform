import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { Button, Card, CardHeader } from '@/components/ui';
import { configApi } from '@/api';
import { useConfirmDialog, useI18n, useToast } from '@/hooks';
import { queryKeys } from '@/lib/queryClient';
import type { ConditionConfig } from '@/types';
import type { OutputGroup, ParamGroup } from '@/types/configGroups';
import { ConditionFormData, ConditionFormModal } from './conditions/ConditionFormModal';

export const ConditionConfigManagement: React.FC = () => {
  const { t } = useI18n();
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
      showToast('success', t('common.create_success'));
      handleCloseModal();
    },
    onError: (error: unknown) => {
      const message = (error as { message?: string })?.message || t('common.save_failed');
      showToast('error', message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ConditionConfig> }) =>
      configApi.updateConditionConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conditionConfigs.all });
      showToast('success', t('common.update_success'));
      handleCloseModal();
    },
    onError: (error: unknown) => {
      const message = (error as { message?: string })?.message || t('common.save_failed');
      showToast('error', message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => configApi.deleteConditionConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conditionConfigs.all });
      showToast('success', t('common.delete_success'));
    },
    onError: (error: unknown) => {
      const message = (error as { message?: string })?.message || t('common.delete_failed');
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
      t('cfg.condition_config.confirm_delete_title'),
      t('cfg.condition_config.confirm_delete', { name }),
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
      showToast(
        'success',
        newDefault === 1
          ? t('cfg.condition_config.set_default_success')
          : t('cfg.condition_config.cancel_default_success')
      );
    } catch {
      showToast('error', t('cfg.condition_config.set_default_failed'));
    }
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      showToast('error', t('cfg.condition_config.name_required'));
      return;
    }
    if (formData.foldTypeId === null) {
      showToast('error', t('cfg.condition_config.fold_type_required'));
      return;
    }
    if (formData.simTypeId === null) {
      showToast('error', t('cfg.condition_config.sim_type_required'));
      return;
    }
    if (isDuplicateCombo(formData.foldTypeId, formData.simTypeId)) {
      showToast(
        'error',
        t('cfg.condition_config.combo_exists', {
          foldType: getFoldTypeName(formData.foldTypeId),
          simType: getSimTypeName(formData.simTypeId),
        })
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
        title={t('cfg.condition_config.list_title')}
        icon={<Link className="h-5 w-5" />}
        subtitle={t('cfg.condition_config.list_subtitle')}
        action={
          <Button size="sm" onClick={() => handleAdd()}>
            <Plus className="mr-1 h-4 w-4" />
            {t('cfg.condition_config.add_condition')}
          </Button>
        }
      />
      <div className="overflow-x-auto p-4">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-700">
              <th className="border p-3 text-left dark:border-slate-600" rowSpan={2}>
                {t('cfg.condition_config.fold_type')}
              </th>
              <th className="border p-3 text-left dark:border-slate-600" colSpan={5}>
                {t('cfg.condition_config.configs')}
              </th>
            </tr>
            <tr className="bg-slate-50 dark:bg-slate-700/50">
              <th className="border p-2 text-left text-xs dark:border-slate-600">
                {t('cfg.condition_config.sim_type')}
              </th>
              <th className="border p-2 text-left text-xs dark:border-slate-600">
                {t('cfg.condition_config.available_param_groups')}
              </th>
              <th className="border p-2 text-left text-xs dark:border-slate-600">
                {t('cfg.condition_config.available_output_groups')}
              </th>
              <th className="border p-2 text-left text-xs dark:border-slate-600">
                {t('cfg.condition_config.default_solver')}
              </th>
              <th className="w-20 border p-2 text-center text-xs dark:border-slate-600">
                {t('common.actions')}
              </th>
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
                    className="border-b hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50"
                  >
                    {index === 0 && (
                      <td
                        className="border bg-slate-50 p-3 font-medium dark:border-slate-600 dark:bg-slate-800"
                        rowSpan={rowSpan}
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-brand-500" />
                          {foldType.name}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {foldType.code} |{' '}
                          {t('cfg.condition_management.angle_label', { angle: foldType.angle })}
                        </div>
                      </td>
                    )}
                    <td className="border p-2 dark:border-slate-600">
                      <div className="flex items-center gap-1">
                        <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {getSimTypeName(config.simTypeId)}
                        </span>
                        {config.isDefault === 1 && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                            {t('cfg.condition_config.default_badge')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="border p-2 dark:border-slate-600">
                      {config.paramGroupIds?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {config.paramGroupIds.map((id: number) => (
                            <span
                              key={id}
                              className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            >
                              {getParamGroupName(id)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="border p-2 dark:border-slate-600">
                      {config.outputGroupIds?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {config.outputGroupIds.map((id: number) => (
                            <span
                              key={id}
                              className="rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                            >
                              {getOutputGroupName(id)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="border p-2 dark:border-slate-600">
                      {config.defaultSolverId ? (
                        <span className="rounded bg-orange-100 px-2 py-1 text-xs text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                          {getSolverName(config.defaultSolverId)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="border p-2 text-center dark:border-slate-600">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleSetDefault(config)}
                          className={`p-1 ${
                            config.isDefault === 1
                              ? 'text-amber-500'
                              : 'text-slate-400 hover:text-amber-500'
                          }`}
                          title={
                            config.isDefault === 1
                              ? t('cfg.condition_config.cancel_default_success')
                              : t('cfg.condition_management.set_default')
                          }
                        >
                          <Star
                            className="h-4 w-4"
                            fill={config.isDefault === 1 ? 'currentColor' : 'none'}
                          />
                        </button>
                        <button
                          onClick={() => handleEdit(config)}
                          className="p-1 text-slate-500 hover:text-brand-600"
                          title={t('common.edit')}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(config.id, config.name)}
                          className="p-1 text-slate-500 hover:text-red-600"
                          title={t('common.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr key={foldType.id} className="border-b dark:border-slate-700">
                  <td className="border bg-slate-50 p-3 font-medium dark:border-slate-600 dark:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                      {foldType.name}
                    </div>
                  </td>
                  <td colSpan={5} className="border p-3 dark:border-slate-600">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-slate-400">{t('cfg.condition_management.empty')}</span>
                      <button
                        onClick={() => handleAdd(foldType.id)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-brand-600 transition-colors hover:bg-brand-50 dark:hover:bg-brand-900/20"
                      >
                        <Plus className="h-3 w-3" />
                        {t('cfg.condition_config.add_for_fold')}
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
