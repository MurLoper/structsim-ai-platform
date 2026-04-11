import React, { useCallback, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { VirtualTable } from '@/components/tables/VirtualTable';
import type { ColumnDef } from '@tanstack/react-table';
import type { OutputGroup } from '@/types/configGroups';
import type { OutputDef } from '@/api';
import { useI18n } from '@/hooks/useI18n';
import {
  managementFieldClass,
  managementModalOverlayClass,
  managementModalPanelClass,
  managementPrimaryButtonDisabledClass,
  managementSecondaryButtonClass,
} from '../managementSurfaceTokens';

export interface OutputRespConfig {
  outputDefId: number;
  setName: string;
  component: string;
  stepName?: string;
  sectionPoint?: string;
  specialOutputSet?: string;
  description?: string;
  weight: number;
  multiple: number;
  lowerLimit: number;
  upperLimit?: number;
  targetType: number;
  targetValue?: number;
  sort: number;
}

const DEFAULT_POST_PROCESS_MODE = '18';

const DEFAULT_RESP: Omit<OutputRespConfig, 'outputDefId'> = {
  setName: 'push',
  component: DEFAULT_POST_PROCESS_MODE,
  weight: 1.0,
  multiple: 1.0,
  lowerLimit: 0.0,
  targetType: 3,
  sort: 100,
};

type OutputGroupFormModalProps = {
  group: Partial<OutputGroup> | null;
  outputDefs: OutputDef[];
  projects: Array<{ id: number; name: string }>;
  postProcessModeOptions: Array<{ value: string; label: string }>;
  existingOutputConfigs?: OutputRespConfig[];
  onSave: (data: Partial<OutputGroup>, outputConfigs: OutputRespConfig[]) => void;
  onClose: () => void;
};

export const OutputGroupFormModal: React.FC<OutputGroupFormModalProps> = ({
  group,
  outputDefs,
  projects,
  postProcessModeOptions,
  existingOutputConfigs = [],
  onSave,
  onClose,
}) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState(() => ({
    name: group?.name || '',
    description: group?.description || '',
    projectIds: group?.projectIds ?? ([] as number[]),
    sort: group?.sort ?? 100,
  }));
  const [rows, setRows] = useState<OutputRespConfig[]>(() => [...existingOutputConfigs]);
  const [showPicker, setShowPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const updateField = useCallback((field: keyof typeof formData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const addRow = useCallback((defId: number) => {
    setRows(prev => [...prev, { outputDefId: defId, ...DEFAULT_RESP }]);
    setShowPicker(false);
    setSearchTerm('');
  }, []);

  const removeRow = useCallback((idx: number) => {
    setRows(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const updateRow = useCallback((idx: number, key: string, val: unknown) => {
    setRows(prev => prev.map((row, i) => (i === idx ? { ...row, [key]: val } : row)));
  }, []);

  const getDef = useCallback(
    (id: number) => outputDefs.find(output => output.id === id),
    [outputDefs]
  );

  const filteredDefs = useMemo(() => {
    if (!searchTerm) return outputDefs;
    const normalizedTerm = searchTerm.toLowerCase();
    return outputDefs.filter(
      output =>
        output.name.toLowerCase().includes(normalizedTerm) ||
        output.code?.toLowerCase().includes(normalizedTerm)
    );
  }, [outputDefs, searchTerm]);

  const inputCls =
    'w-full px-2.5 py-1.5 text-sm border rounded-md bg-background border-border focus:outline-none focus:ring-1 focus:ring-ring';

  const respColumns: ColumnDef<OutputRespConfig, unknown>[] = useMemo(
    () => [
      {
        header: t('cfg.output_group.col.output'),
        accessorKey: 'outputDefId',
        size: 160,
        enableSorting: false,
        cell: ({ row }) => {
          const outputDef = getDef(row.original.outputDefId);
          return (
            <div className="py-0.5">
              <div className="text-sm font-medium text-foreground">{outputDef?.name || '?'}</div>
              <div className="text-xs text-muted-foreground">{outputDef?.code}</div>
            </div>
          );
        },
      },
      {
        header: t('cfg.output_group.col.set_name'),
        accessorKey: 'setName',
        size: 100,
        enableSorting: false,
        cell: ({ row }) => (
          <input
            className={inputCls}
            value={row.original.setName || ''}
            onChange={event => updateRow(row.index, 'setName', event.target.value)}
          />
        ),
      },
      {
        header: t('cfg.output_group.col.component'),
        accessorKey: 'component',
        size: 110,
        enableSorting: false,
        cell: ({ row }) => (
          <select
            className={inputCls}
            value={row.original.component || DEFAULT_POST_PROCESS_MODE}
            onChange={event => updateRow(row.index, 'component', event.target.value)}
          >
            {postProcessModeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ),
      },
      {
        header: t('cfg.output_group.col.target_type'),
        accessorKey: 'targetType',
        size: 115,
        enableSorting: false,
        cell: ({ row }) => (
          <select
            className={inputCls}
            value={row.original.targetType ?? 3}
            onChange={event => updateRow(row.index, 'targetType', Number(event.target.value))}
          >
            <option value={1}>{t('cfg.output_group.target.maximize')}</option>
            <option value={2}>{t('cfg.output_group.target.minimize')}</option>
            <option value={3}>{t('cfg.output_group.target.value')}</option>
          </select>
        ),
      },
      {
        header: t('cfg.output_group.col.weight'),
        accessorKey: 'weight',
        size: 80,
        enableSorting: false,
        cell: ({ row }) => (
          <input
            className={inputCls}
            type="number"
            step="0.1"
            value={row.original.weight ?? 1}
            onChange={event => updateRow(row.index, 'weight', parseFloat(event.target.value) || 1)}
          />
        ),
      },
      {
        header: t('cfg.output_group.col.multiple'),
        accessorKey: 'multiple',
        size: 80,
        enableSorting: false,
        cell: ({ row }) => (
          <input
            className={inputCls}
            type="number"
            step="0.1"
            value={row.original.multiple ?? 1}
            onChange={event =>
              updateRow(row.index, 'multiple', parseFloat(event.target.value) || 1)
            }
          />
        ),
      },
      {
        header: t('cfg.output_group.col.lower_limit'),
        accessorKey: 'lowerLimit',
        size: 80,
        enableSorting: false,
        cell: ({ row }) => (
          <input
            className={inputCls}
            type="number"
            value={row.original.lowerLimit ?? 0}
            onChange={event =>
              updateRow(row.index, 'lowerLimit', parseFloat(event.target.value) || 0)
            }
          />
        ),
      },
      {
        header: t('cfg.output_group.col.upper_limit'),
        accessorKey: 'upperLimit',
        size: 80,
        enableSorting: false,
        cell: ({ row }) => (
          <input
            className={inputCls}
            type="number"
            value={row.original.upperLimit ?? ''}
            onChange={event =>
              updateRow(
                row.index,
                'upperLimit',
                event.target.value ? parseFloat(event.target.value) : undefined
              )
            }
          />
        ),
      },
      {
        header: t('cfg.output_group.col.target_value'),
        accessorKey: 'targetValue',
        size: 80,
        enableSorting: false,
        cell: ({ row }) => (
          <input
            className={inputCls}
            type="number"
            value={row.original.targetValue ?? ''}
            onChange={event =>
              updateRow(
                row.index,
                'targetValue',
                event.target.value ? parseFloat(event.target.value) : undefined
              )
            }
          />
        ),
      },
      {
        header: '',
        id: 'actions',
        size: 40,
        enableSorting: false,
        cell: ({ row }) => (
          <button
            onClick={() => removeRow(row.index)}
            className="rounded p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ),
      },
    ],
    [getDef, inputCls, postProcessModeOptions, removeRow, t, updateRow]
  );

  return (
    <div className={managementModalOverlayClass}>
      <div
        className={`${managementModalPanelClass} flex max-h-[90vh] w-full max-w-[90vw] flex-col p-6`}
      >
        <h3 className="mb-4 text-lg font-semibold">
          {group?.id ? t('common.edit') : t('common.create')}
          {t('cfg.output_group.title')}
        </h3>
        <div className="flex-1 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium">{t('cfg.output_group.name')}</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={event => updateField('name', event.target.value)}
                className={managementFieldClass}
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium">
                {t('cfg.output_group.projects')}
              </label>
              <div className="max-h-[120px] space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                {projects.length === 0 ? (
                  <span className="text-xs text-muted-foreground">
                    {t('cfg.output_group.no_projects')}
                  </span>
                ) : (
                  projects.map(project => (
                    <label
                      key={project.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-muted/50"
                    >
                      <input
                        type="checkbox"
                        checked={(formData.projectIds || []).includes(project.id)}
                        onChange={event => {
                          const ids = formData.projectIds || [];
                          updateField(
                            'projectIds',
                            event.target.checked
                              ? [...ids, project.id]
                              : ids.filter((id: number) => id !== project.id)
                          );
                        }}
                        className="rounded"
                      />
                      {project.name}
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium">
                {t('cfg.output_group.response_config', { count: rows.length })}
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowPicker(!showPicker)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-3.5 w-3.5" /> {t('cfg.output_group.add_output')}
                </button>
                {showPicker && (
                  <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setShowPicker(false)} />
                    <div className="fixed right-[10vw] top-1/3 z-[61] w-72 rounded-lg border border-border bg-card p-3 shadow-xl">
                      <input
                        placeholder={t('cfg.output_group.search_output')}
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                        className={`${managementFieldClass} mb-2 text-sm`}
                        autoFocus
                      />
                      <div className="max-h-52 overflow-y-auto">
                        {filteredDefs.map(output => (
                          <button
                            key={output.id}
                            onClick={() => addRow(output.id)}
                            className="w-full rounded px-2.5 py-2 text-left text-sm hover:bg-muted"
                          >
                            {output.name}{' '}
                            <span className="text-muted-foreground">({output.code})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            {rows.length > 0 ? (
              <VirtualTable
                data={rows}
                columns={respColumns}
                rowHeight={56}
                containerHeight={Math.min(rows.length * 56 + 48, 400)}
                enableSorting={false}
                emptyText={t('cfg.output_group.empty_config')}
                getRowId={(row: OutputRespConfig) => `${row.outputDefId}-${rows.indexOf(row)}`}
              />
            ) : (
              <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
                {t('cfg.output_group.empty_hint')}
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
          <button onClick={onClose} className={managementSecondaryButtonClass}>
            {t('common.cancel')}
          </button>
          <button
            onClick={() => onSave(formData, rows)}
            disabled={!formData.name?.trim()}
            className={managementPrimaryButtonDisabledClass}
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};
