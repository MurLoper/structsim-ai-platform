import React, { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, useConfirmDialog, useToast } from '@/components/ui';
import { PlusIcon, TrashIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { baseConfigApi } from '@/api/config/base';
import { queryKeys } from '@/lib/queryClient';
import { useI18n } from '@/hooks';
import type { FoldType, SimType, FoldTypeSimTypeRel } from '@/types/config';

interface SimTypeRelItem {
  relId: number;
  simTypeId: number;
  simTypeName: string;
  simTypeCode: string;
  isDefault: number;
  sort: number;
}

export const ConditionManagement: React.FC = () => {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { showConfirm, ConfirmDialogComponent } = useConfirmDialog();
  const queryClient = useQueryClient();
  const [foldTypes, setFoldTypes] = useState<FoldType[]>([]);
  const [allSimTypes, setAllSimTypes] = useState<SimType[]>([]);
  const [relationsMap, setRelationsMap] = useState<Map<number, SimTypeRelItem[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFoldTypeId, setEditingFoldTypeId] = useState<number | null>(null);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [foldTypesRes, simTypesRes] = await Promise.all([
        baseConfigApi.getFoldTypes(),
        baseConfigApi.getSimTypes(),
      ]);

      const foldTypesData = foldTypesRes.data || [];
      const simTypesData = simTypesRes.data || [];

      setFoldTypes(foldTypesData);
      setAllSimTypes(simTypesData);

      const relMap = new Map<number, SimTypeRelItem[]>();
      await Promise.all(
        foldTypesData.map(async (foldType: FoldType) => {
          try {
            const relRes = await baseConfigApi.getFoldTypeSimTypeRelsByFoldType(foldType.id);
            const rels = (relRes.data || []).map(
              (rel: FoldTypeSimTypeRel & { simTypeName?: string; simTypeCode?: string }) => ({
                relId: rel.id,
                simTypeId: rel.simTypeId,
                simTypeName:
                  rel.simTypeName ||
                  simTypesData.find((simType: SimType) => simType.id === rel.simTypeId)?.name ||
                  '',
                simTypeCode:
                  rel.simTypeCode ||
                  simTypesData.find((simType: SimType) => simType.id === rel.simTypeId)?.code ||
                  '',
                isDefault: rel.isDefault,
                sort: rel.sort,
              })
            );
            relMap.set(foldType.id, rels);
          } catch {
            relMap.set(foldType.id, []);
          }
        })
      );
      setRelationsMap(relMap);
    } catch (error) {
      console.error('Failed to load condition relation data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const tableData = useMemo(() => {
    const rows: Array<{
      foldType: FoldType;
      simType: SimTypeRelItem | null;
      rowSpan: number;
      isFirstRow: boolean;
    }> = [];

    foldTypes.forEach(foldType => {
      const simTypes = relationsMap.get(foldType.id) || [];
      if (simTypes.length === 0) {
        rows.push({
          foldType,
          simType: null,
          rowSpan: 1,
          isFirstRow: true,
        });
        return;
      }
      simTypes.forEach((simType, index) => {
        rows.push({
          foldType,
          simType,
          rowSpan: index === 0 ? simTypes.length : 0,
          isFirstRow: index === 0,
        });
      });
    });

    return rows;
  }, [foldTypes, relationsMap]);

  const handleAddSimType = async (foldTypeId: number, simTypeId: number, isDefault: number) => {
    try {
      await baseConfigApi.addSimTypeToFoldType(foldTypeId, { simTypeId, isDefault });
      await queryClient.invalidateQueries({ queryKey: queryKeys.foldTypeSimTypeRels.all });
      await loadAllData();
      setShowAddModal(false);
      setEditingFoldTypeId(null);
    } catch (error) {
      console.error('Failed to add simulation type relation:', error);
      showToast('error', t('cfg.relations.add_failed'));
    }
  };

  const handleSetDefault = async (foldTypeId: number, simTypeId: number) => {
    try {
      await baseConfigApi.setDefaultSimTypeForFoldType(foldTypeId, simTypeId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.foldTypeSimTypeRels.all });
      await loadAllData();
    } catch (error) {
      console.error('Failed to set default simulation type:', error);
      showToast('error', t('cfg.relations.set_default_failed'));
    }
  };

  const handleRemove = (foldTypeId: number, simTypeId: number) => {
    showConfirm(
      t('common.confirm'),
      t('cfg.relations.remove_confirm'),
      async () => {
        try {
          await baseConfigApi.removeSimTypeFromFoldType(foldTypeId, simTypeId);
          await queryClient.invalidateQueries({ queryKey: queryKeys.foldTypeSimTypeRels.all });
          await loadAllData();
        } catch (error) {
          console.error('Failed to remove simulation type relation:', error);
          showToast('error', t('cfg.relations.remove_failed'));
        }
      },
      'danger'
    );
  };

  const openAddModal = (foldTypeId: number) => {
    setEditingFoldTypeId(foldTypeId);
    setShowAddModal(true);
  };

  return (
    <Card>
      <div className="border-b p-4 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{t('cfg.condition_management.title')}</h3>
            <p className="mt-1 text-sm text-slate-500">{t('cfg.condition_management.desc')}</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-slate-500">{t('common.loading')}</div>
        ) : tableData.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            {t('cfg.condition_management.empty')}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50">
                <th className="w-48 px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 eyecare:text-foreground">
                  {t('cfg.condition_management.fold_type')}
                </th>
                <th className="w-48 px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 eyecare:text-foreground">
                  {t('cfg.condition_management.sim_type')}
                </th>
                <th className="w-32 px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 eyecare:text-foreground">
                  {t('cfg.condition_management.default')}
                </th>
                <th className="w-24 px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 eyecare:text-foreground">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {tableData.map((row, index) => (
                <tr
                  key={`${row.foldType.id}-${row.simType?.simTypeId || 'empty'}-${index}`}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700 eyecare:hover:bg-muted/30"
                >
                  {row.rowSpan > 0 && (
                    <td
                      rowSpan={row.rowSpan}
                      className="border-r px-4 py-3 align-top dark:border-slate-700"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white eyecare:text-foreground">
                            {row.foldType.name}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {row.foldType.code || t('cfg.condition_management.no_code')} |{' '}
                            {t('cfg.condition_management.angle_label', {
                              angle: row.foldType.angle,
                            })}
                          </div>
                        </div>
                        <button
                          onClick={() => openAddModal(row.foldType.id)}
                          className="rounded-lg p-1.5 text-blue-600 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          title={t('cfg.condition_management.add_sim_type')}
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    {row.simType ? (
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white eyecare:text-foreground">
                          {row.simType.simTypeName}
                        </div>
                        <div className="text-xs text-slate-500">{row.simType.simTypeCode}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">
                        {t('cfg.condition_management.no_sim_type')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.simType && (
                      <button
                        onClick={() => handleSetDefault(row.foldType.id, row.simType!.simTypeId)}
                        className={`rounded-lg p-1.5 transition-colors ${
                          row.simType.isDefault === 1
                            ? 'text-yellow-500'
                            : 'text-slate-400 hover:bg-slate-100 hover:text-yellow-500 dark:hover:bg-slate-600 eyecare:hover:bg-muted'
                        }`}
                        title={
                          row.simType.isDefault === 1
                            ? t('cfg.condition_management.already_default')
                            : t('cfg.condition_management.set_default')
                        }
                      >
                        {row.simType.isDefault === 1 ? (
                          <StarIconSolid className="h-5 w-5" />
                        ) : (
                          <StarIcon className="h-5 w-5" />
                        )}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.simType && (
                      <button
                        onClick={() => handleRemove(row.foldType.id, row.simType!.simTypeId)}
                        className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30"
                        title={t('cfg.condition_management.remove')}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && editingFoldTypeId !== null && (
        <AddSimTypeModal
          foldTypeId={editingFoldTypeId}
          foldTypeName={foldTypes.find(foldType => foldType.id === editingFoldTypeId)?.name || ''}
          simTypes={allSimTypes}
          existingIds={
            new Set((relationsMap.get(editingFoldTypeId) || []).map(rel => rel.simTypeId))
          }
          onAdd={handleAddSimType}
          onClose={() => {
            setShowAddModal(false);
            setEditingFoldTypeId(null);
          }}
        />
      )}
      <ConfirmDialogComponent />
    </Card>
  );
};

interface AddSimTypeModalProps {
  foldTypeId: number;
  foldTypeName: string;
  simTypes: SimType[];
  existingIds: Set<number>;
  onAdd: (foldTypeId: number, simTypeId: number, isDefault: number) => void;
  onClose: () => void;
}

const AddSimTypeModal: React.FC<AddSimTypeModalProps> = ({
  foldTypeId,
  foldTypeName,
  simTypes,
  existingIds,
  onAdd,
  onClose,
}) => {
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isDefault, setIsDefault] = useState(0);

  const availableSimTypes = simTypes.filter(simType => !existingIds.has(simType.id));

  const handleSubmit = () => {
    if (selectedId) {
      onAdd(foldTypeId, selectedId, isDefault);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-slate-800 eyecare:bg-card">
        <div className="border-b p-4 dark:border-slate-700">
          <h3 className="text-lg font-bold">{t('cfg.condition_management.add_config')}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {t('cfg.condition_management.add_for_fold_type', { name: foldTypeName })}
          </p>
        </div>
        <div className="space-y-4 p-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              {t('cfg.condition_management.select_sim_type')}
            </label>
            {availableSimTypes.length === 0 ? (
              <p className="text-sm text-slate-500">
                {t('cfg.condition_management.all_configured')}
              </p>
            ) : (
              <select
                value={selectedId ?? ''}
                onChange={event =>
                  setSelectedId(event.target.value ? Number(event.target.value) : null)
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
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault === 1}
              onChange={event => setIsDefault(event.target.checked ? 1 : 0)}
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
