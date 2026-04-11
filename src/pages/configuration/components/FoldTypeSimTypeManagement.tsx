import React, { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, useConfirmDialog, useToast } from '@/components/ui';
import { Plus, Trash2, Star } from 'lucide-react';
import { baseConfigApi } from '@/api/config/base';
import { queryKeys } from '@/lib/queryClient';
import { useFormState } from '@/hooks/useFormState';
import { useI18n } from '@/hooks';
import type { FoldType, SimType, FoldTypeSimTypeRel } from '@/types/config';

interface FoldTypeSimTypeRelWithDetail extends FoldTypeSimTypeRel {
  simTypeName?: string;
  simTypeCode?: string;
}

export const FoldTypeSimTypeManagement: React.FC = () => {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { showConfirm, ConfirmDialogComponent } = useConfirmDialog();
  const queryClient = useQueryClient();
  const [foldTypes, setFoldTypes] = useState<FoldType[]>([]);
  const [selectedFoldType, setSelectedFoldType] = useState<FoldType | null>(null);
  const [simTypeRels, setSimTypeRels] = useState<FoldTypeSimTypeRelWithDetail[]>([]);
  const [allSimTypes, setAllSimTypes] = useState<SimType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadFoldTypes = async () => {
    try {
      setLoading(true);
      const response = await baseConfigApi.getFoldTypes();
      setFoldTypes(response.data || []);
    } catch (error) {
      console.error('Failed to load fold types:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllSimTypes = async () => {
    try {
      const response = await baseConfigApi.getSimTypes();
      setAllSimTypes(response.data || []);
    } catch (error) {
      console.error('Failed to load simulation types:', error);
    }
  };

  const loadFoldTypeSimTypes = async (foldTypeId: number) => {
    try {
      const response = await baseConfigApi.getFoldTypeSimTypeRelsByFoldType(foldTypeId);
      setSimTypeRels((response.data || []) as FoldTypeSimTypeRelWithDetail[]);
    } catch (error) {
      console.error('Failed to load fold type simulation relations:', error);
    }
  };

  useEffect(() => {
    loadFoldTypes();
    loadAllSimTypes();
  }, []);

  useEffect(() => {
    if (selectedFoldType) {
      loadFoldTypeSimTypes(selectedFoldType.id);
    }
  }, [selectedFoldType]);

  const handleAddSimType = async (simTypeId: number, isDefault: number) => {
    if (!selectedFoldType) return;
    try {
      await baseConfigApi.addSimTypeToFoldType(selectedFoldType.id, { simTypeId, isDefault });
      await queryClient.invalidateQueries({ queryKey: queryKeys.foldTypeSimTypeRels.all });
      loadFoldTypeSimTypes(selectedFoldType.id);
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to add simulation type relation:', error);
      showToast('error', t('cfg.relations.add_failed'));
    }
  };

  const handleSetDefault = async (simTypeId: number) => {
    if (!selectedFoldType) return;
    try {
      await baseConfigApi.setDefaultSimTypeForFoldType(selectedFoldType.id, simTypeId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.foldTypeSimTypeRels.all });
      loadFoldTypeSimTypes(selectedFoldType.id);
    } catch (error) {
      console.error('Failed to set default simulation type:', error);
      showToast('error', t('cfg.relations.set_default_failed'));
    }
  };

  const handleRemove = (simTypeId: number) => {
    if (!selectedFoldType) return;
    showConfirm(
      t('common.confirm'),
      t('cfg.relations.remove_confirm'),
      async () => {
        try {
          await baseConfigApi.removeSimTypeFromFoldType(selectedFoldType.id, simTypeId);
          await queryClient.invalidateQueries({ queryKey: queryKeys.foldTypeSimTypeRels.all });
          loadFoldTypeSimTypes(selectedFoldType.id);
        } catch (error) {
          console.error('Failed to remove simulation type relation:', error);
          showToast('error', t('cfg.relations.remove_failed'));
        }
      },
      'danger'
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card>
        <div className="border-b p-4 dark:border-slate-700">
          <h3 className="text-lg font-semibold">{t('cfg.fold_relation.fold_types')}</h3>
        </div>
        <div className="max-h-[600px] space-y-2 overflow-y-auto p-4">
          {loading ? (
            <div className="py-8 text-center text-slate-500">{t('common.loading')}</div>
          ) : foldTypes.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              {t('cfg.fold_relation.empty_fold_types')}
            </div>
          ) : (
            foldTypes.map(foldType => (
              <button
                key={foldType.id}
                onClick={() => setSelectedFoldType(foldType)}
                className={`w-full rounded-lg p-3 text-left transition-colors ${
                  selectedFoldType?.id === foldType.id
                    ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700'
                }`}
              >
                <div className="font-medium">{foldType.name}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {foldType.code || t('cfg.condition_management.no_code')} |{' '}
                  {t('cfg.condition_management.angle_label', { angle: foldType.angle })}
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      <div className="lg:col-span-2">
        <FoldTypeSimTypeRelList
          selectedFoldType={selectedFoldType}
          simTypeRels={simTypeRels}
          onAddClick={() => setShowAddModal(true)}
          onSetDefault={handleSetDefault}
          onRemove={handleRemove}
        />
      </div>

      {showAddModal && selectedFoldType && (
        <AddSimTypeModal
          simTypes={allSimTypes}
          existingIds={new Set(simTypeRels.map(rel => rel.simTypeId))}
          onAdd={handleAddSimType}
          onClose={() => setShowAddModal(false)}
        />
      )}
      <ConfirmDialogComponent />
    </div>
  );
};

interface FoldTypeSimTypeRelListProps {
  selectedFoldType: FoldType | null;
  simTypeRels: FoldTypeSimTypeRelWithDetail[];
  onAddClick: () => void;
  onSetDefault: (simTypeId: number) => void;
  onRemove: (simTypeId: number) => void;
}

const FoldTypeSimTypeRelList: React.FC<FoldTypeSimTypeRelListProps> = ({
  selectedFoldType,
  simTypeRels,
  onAddClick,
  onSetDefault,
  onRemove,
}) => {
  const { t } = useI18n();

  if (!selectedFoldType) {
    return (
      <Card>
        <div className="p-12 text-center text-slate-500">
          <p>{t('cfg.fold_relation.select_fold_type')}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between border-b p-4 dark:border-slate-700">
        <h3 className="text-lg font-semibold">
          {t('cfg.fold_relation.title_for', { name: selectedFoldType.name })}
        </h3>
        <button
          onClick={onAddClick}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          {t('cfg.fold_relation.add_relation')}
        </button>
      </div>
      <div className="p-4">
        {simTypeRels.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            {t('cfg.fold_relation.empty_relations')}
          </div>
        ) : (
          <div className="space-y-2">
            {simTypeRels.map(rel => (
              <div
                key={rel.id}
                className="flex items-center justify-between rounded-lg bg-slate-50 p-4 dark:bg-slate-700"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{rel.simTypeName}</span>
                    {rel.isDefault === 1 && (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                        {t('cfg.fold_relation.default_badge')}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {t('cfg.fold_relation.code_sort', {
                      code: rel.simTypeCode || '-',
                      sort: rel.sort,
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSetDefault(rel.simTypeId)}
                    className={`rounded-lg p-2 transition-colors ${
                      rel.isDefault === 1
                        ? 'text-yellow-500'
                        : 'text-slate-400 hover:bg-slate-100 hover:text-yellow-500 dark:hover:bg-slate-600 eyecare:hover:bg-muted'
                    }`}
                    title={
                      rel.isDefault === 1
                        ? t('cfg.condition_management.already_default')
                        : t('cfg.condition_management.set_default')
                    }
                  >
                    <Star className={`h-5 w-5 ${rel.isDefault === 1 ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => onRemove(rel.simTypeId)}
                    className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30"
                    title={t('cfg.fold_relation.remove_relation')}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

interface AddSimTypeModalProps {
  simTypes: SimType[];
  existingIds: Set<number>;
  onAdd: (simTypeId: number, isDefault: number) => void;
  onClose: () => void;
}

const AddSimTypeModal: React.FC<AddSimTypeModalProps> = ({
  simTypes,
  existingIds,
  onAdd,
  onClose,
}) => {
  const { t } = useI18n();
  const initialData = useMemo(
    () => ({
      selectedId: null as number | null,
      isDefault: 0,
    }),
    []
  );

  const { formData, updateField } = useFormState(initialData);
  const availableSimTypes = simTypes.filter(simType => !existingIds.has(simType.id));
  const selectedId = formData.selectedId ?? null;

  const handleSubmit = () => {
    if (selectedId) {
      onAdd(selectedId, formData.isDefault ?? 0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-slate-800 eyecare:bg-card">
        <div className="border-b p-4 dark:border-slate-700">
          <h3 className="text-lg font-bold">{t('cfg.fold_relation.add_relation')}</h3>
        </div>
        <div className="space-y-4 p-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              {t('cfg.condition_management.select_sim_type')}
            </label>
            <select
              value={selectedId ?? ''}
              onChange={event =>
                updateField(
                  'selectedId',
                  event.target.value ? Number(event.target.value) : (null as number | null)
                )
              }
              className="w-full rounded-lg border p-2 dark:border-slate-600 dark:bg-slate-700 eyecare:border-border eyecare:bg-card"
            >
              <option value="">{t('cfg.condition_management.select_sim_type')}</option>
              {availableSimTypes.map(simType => (
                <option key={simType.id} value={simType.id}>
                  {simType.name} ({simType.code})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={(formData.isDefault ?? 0) === 1}
              onChange={event => updateField('isDefault', event.target.checked ? 1 : 0)}
              className="rounded"
            />
            <label htmlFor="isDefault" className="text-sm">
              {t('cfg.condition_management.default_sim_type')}
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t p-4 dark:border-slate-700">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 eyecare:text-foreground"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedId}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('common.add')}
          </button>
        </div>
      </div>
    </div>
  );
};
