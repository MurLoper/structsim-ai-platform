import React, { useCallback, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { VirtualTable } from '@/components/tables/VirtualTable';
import type { ColumnDef } from '@tanstack/react-table';
import type { OutputGroup } from '@/types/configGroups';
import type { OutputDef } from '@/api';
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
    setRows(prev => prev.map((r, i) => (i === idx ? { ...r, [key]: val } : r)));
  }, []);

  const getDef = useCallback((id: number) => outputDefs.find(o => o.id === id), [outputDefs]);

  const filteredDefs = useMemo(() => {
    if (!searchTerm) return outputDefs;
    const t = searchTerm.toLowerCase();
    return outputDefs.filter(
      o => o.name.toLowerCase().includes(t) || o.code?.toLowerCase().includes(t)
    );
  }, [outputDefs, searchTerm]);

  const inputCls =
    'w-full px-2.5 py-1.5 text-sm border rounded-md bg-background border-border focus:outline-none focus:ring-1 focus:ring-ring';

  const respColumns: ColumnDef<OutputRespConfig, unknown>[] = useMemo(
    () => [
      {
        header: '输出',
        accessorKey: 'outputDefId',
        size: 160,
        enableSorting: false,
        cell: ({ row }) => {
          const d = getDef(row.original.outputDefId);
          return (
            <div className="py-0.5">
              <div className="font-medium text-sm text-foreground">{d?.name || '?'}</div>
              <div className="text-xs text-muted-foreground">{d?.code}</div>
            </div>
          );
        },
      },
      {
        header: 'Set名',
        accessorKey: 'setName',
        size: 100,
        enableSorting: false,
        cell: ({ row }) => (
          <input
            className={inputCls}
            value={row.original.setName || ''}
            onChange={e => updateRow(row.index, 'setName', e.target.value)}
          />
        ),
      },
      {
        header: '后处理方式',
        accessorKey: 'component',
        size: 110,
        enableSorting: false,
        cell: ({ row }) => (
          <select
            className={inputCls}
            value={row.original.component || DEFAULT_POST_PROCESS_MODE}
            onChange={e => updateRow(row.index, 'component', e.target.value)}
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
        header: '目标类型',
        accessorKey: 'targetType',
        size: 115,
        enableSorting: false,
        cell: ({ row }) => (
          <select
            className={inputCls}
            value={row.original.targetType ?? 3}
            onChange={e => updateRow(row.index, 'targetType', Number(e.target.value))}
          >
            <option value={1}>最大化</option>
            <option value={2}>最小化</option>
            <option value={3}>目标值</option>
          </select>
        ),
      },
      {
        header: '权重',
        accessorKey: 'weight',
        size: 80,
        enableSorting: false,
        cell: ({ row }) => (
          <input
            className={inputCls}
            type="number"
            step="0.1"
            value={row.original.weight ?? 1}
            onChange={e => updateRow(row.index, 'weight', parseFloat(e.target.value) || 1)}
          />
        ),
      },
      {
        header: '量级',
        accessorKey: 'multiple',
        size: 80,
        enableSorting: false,
        cell: ({ row }) => (
          <input
            className={inputCls}
            type="number"
            step="0.1"
            value={row.original.multiple ?? 1}
            onChange={e => updateRow(row.index, 'multiple', parseFloat(e.target.value) || 1)}
          />
        ),
      },
      {
        header: '下限',
        accessorKey: 'lowerLimit',
        size: 80,
        enableSorting: false,
        cell: ({ row }) => (
          <input
            className={inputCls}
            type="number"
            value={row.original.lowerLimit ?? 0}
            onChange={e => updateRow(row.index, 'lowerLimit', parseFloat(e.target.value) || 0)}
          />
        ),
      },
      {
        header: '上限',
        accessorKey: 'upperLimit',
        size: 80,
        enableSorting: false,
        cell: ({ row }) => (
          <input
            className={inputCls}
            type="number"
            value={row.original.upperLimit ?? ''}
            onChange={e =>
              updateRow(
                row.index,
                'upperLimit',
                e.target.value ? parseFloat(e.target.value) : undefined
              )
            }
          />
        ),
      },
      {
        header: '目标值',
        accessorKey: 'targetValue',
        size: 80,
        enableSorting: false,
        cell: ({ row }) => (
          <input
            className={inputCls}
            type="number"
            value={row.original.targetValue ?? ''}
            onChange={e =>
              updateRow(
                row.index,
                'targetValue',
                e.target.value ? parseFloat(e.target.value) : undefined
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
            className="p-1.5 text-red-400 hover:text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ),
      },
    ],
    [getDef, inputCls, postProcessModeOptions, removeRow, updateRow]
  );

  return (
    <div className={managementModalOverlayClass}>
      <div
        className={`${managementModalPanelClass} p-6 w-full max-w-[90vw] max-h-[90vh] flex flex-col`}
      >
        <h3 className="text-lg font-semibold mb-4">{group?.id ? '编辑' : '新建'}工况输出组合</h3>
        <div className="space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1">组合名称</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={e => updateField('name', e.target.value)}
                className={managementFieldClass}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1">关联项目（为空表示全局）</label>
              <div className="border rounded-lg border-border max-h-[120px] overflow-y-auto p-2 space-y-1">
                {projects.length === 0 ? (
                  <span className="text-xs text-muted-foreground">暂无项目</span>
                ) : (
                  projects.map(p => (
                    <label
                      key={p.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={(formData.projectIds || []).includes(p.id)}
                        onChange={e => {
                          const ids = formData.projectIds || [];
                          updateField(
                            'projectIds',
                            e.target.checked
                              ? [...ids, p.id]
                              : ids.filter((id: number) => id !== p.id)
                          );
                        }}
                        className="rounded"
                      />
                      {p.name}
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">输出响应配置 ({rows.length})</label>
              <div className="relative">
                <button
                  onClick={() => setShowPicker(!showPicker)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-3.5 h-3.5" /> 添加输出
                </button>
                {showPicker && (
                  <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setShowPicker(false)} />
                    <div className="fixed right-[10vw] top-1/3 w-72 border rounded-lg p-3 bg-card border-border shadow-xl z-[61]">
                      <input
                        placeholder="搜索输出..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className={`${managementFieldClass} mb-2 text-sm`}
                        autoFocus
                      />
                      <div className="max-h-52 overflow-y-auto">
                        {filteredDefs.map(o => (
                          <button
                            key={o.id}
                            onClick={() => addRow(o.id)}
                            className="w-full text-left px-2.5 py-2 text-sm hover:bg-muted rounded"
                          >
                            {o.name} <span className="text-muted-foreground">({o.code})</span>
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
                emptyText="暂无输出配置"
                getRowId={(row: OutputRespConfig) => `${row.outputDefId}-${rows.indexOf(row)}`}
              />
            ) : (
              <div className="border rounded-lg border-border p-8 text-center text-muted-foreground text-sm">
                请先添加输出并配置响应参数
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
          <button onClick={onClose} className={managementSecondaryButtonClass}>
            取消
          </button>
          <button
            onClick={() => onSave(formData, rows)}
            disabled={!formData.name?.trim()}
            className={managementPrimaryButtonDisabledClass}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
