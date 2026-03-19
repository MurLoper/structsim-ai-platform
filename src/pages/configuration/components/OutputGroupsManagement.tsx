import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, useToast, useConfirmDialog } from '@/components/ui';
import { Plus, Pencil, Trash2, Search, X, Filter } from 'lucide-react';
import { configApi, outputGroupsApi } from '@/api';
import { useFormState } from '@/hooks/useFormState';
import { VirtualTable } from '@/components/tables/VirtualTable';
import type { ColumnDef } from '@tanstack/react-table';
import type { OutputGroup, OutputInGroup } from '@/types/configGroups';
import type { OutputDef } from '@/api';

/** 每个输出的 resp_details 预配置 */
interface OutputRespConfig {
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

const DEFAULT_RESP: Omit<OutputRespConfig, 'outputDefId'> = {
  setName: 'push',
  component: '35',
  weight: 1.0,
  multiple: 1.0,
  lowerLimit: 0.0,
  targetType: 3,
  sort: 100,
};

interface TableRow {
  group: OutputGroup;
  output: OutputInGroup | null;
  rowSpan: number;
  isFirstRow: boolean;
}

export const OutputGroupsManagement: React.FC = () => {
  const [groups, setGroups] = useState<OutputGroup[]>([]);
  const [allOutputDefs, setAllOutputDefs] = useState<OutputDef[]>([]);
  const [projects, setProjects] = useState<Array<{ id: number; name: string }>>([]);
  const [groupOutputsMap, setGroupOutputsMap] = useState<Map<number, OutputInGroup[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProjectId, setFilterProjectId] = useState<number | ''>('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Partial<OutputGroup> | null>(null);

  const { showToast } = useToast();
  const { showConfirm, ConfirmDialogComponent } = useConfirmDialog();
  const loadedRef = useRef(false);

  // 加载所有数据
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [groupsRes, outputDefsRes, projectsRes] = await Promise.all([
        outputGroupsApi.getOutputGroups(),
        configApi.getOutputDefs(),
        configApi.getProjects(),
      ]);

      const groupsData = Array.isArray(groupsRes?.data) ? groupsRes.data : [];
      const outputDefsData = Array.isArray(outputDefsRes?.data) ? outputDefsRes.data : [];
      const projectsData = Array.isArray(projectsRes?.data) ? projectsRes.data : [];

      setGroups(groupsData);
      setAllOutputDefs(outputDefsData);
      setProjects(projectsData.map(p => ({ id: p.id, name: p.name })));

      // 加载所有组合的输出
      const outputsMap = new Map<number, OutputInGroup[]>();
      await Promise.all(
        groupsData.map(async (group: OutputGroup) => {
          try {
            const res = await outputGroupsApi.getOutputGroupOutputs(group.id);
            outputsMap.set(group.id, Array.isArray(res?.data) ? res.data : []);
          } catch {
            outputsMap.set(group.id, []);
          }
        })
      );
      setGroupOutputsMap(outputsMap);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    loadAllData();
  }, []);

  // 计算表格数据：按组合分组，支持行合并 + 按项目过滤
  const tableData = useMemo(() => {
    const rows: TableRow[] = [];
    const filteredGroups = groups.filter(g => {
      // 项目过滤
      if (filterProjectId !== '') {
        const ids = g.projectIds || [];
        if (filterProjectId === -1) {
          if (ids.length > 0) return false;
        } else {
          if (ids.length > 0 && !ids.includes(filterProjectId as number)) return false;
        }
      }
      // 关键词搜索
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const nameMatch = g.name.toLowerCase().includes(term);
        const outputMatch = (groupOutputsMap.get(g.id) || []).some(
          o =>
            o.outputName?.toLowerCase().includes(term) || o.outputCode?.toLowerCase().includes(term)
        );
        if (!nameMatch && !outputMatch) return false;
      }
      return true;
    });

    filteredGroups.forEach(group => {
      const outputs = groupOutputsMap.get(group.id) || [];
      if (outputs.length === 0) {
        rows.push({ group, output: null, rowSpan: 1, isFirstRow: true });
      } else {
        const filteredOutputs = searchTerm
          ? outputs.filter(
              o =>
                o.outputName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.outputCode?.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : outputs;

        const displayOutputs = filteredOutputs.length > 0 ? filteredOutputs : outputs;
        displayOutputs.forEach((output, idx) => {
          rows.push({
            group,
            output,
            rowSpan: idx === 0 ? displayOutputs.length : 0,
            isFirstRow: idx === 0,
          });
        });
      }
    });

    return rows;
  }, [groups, groupOutputsMap, searchTerm, filterProjectId]);

  // 创建/更新工况输出组合
  const handleSaveGroup = async (data: Partial<OutputGroup>, outputConfigs: OutputRespConfig[]) => {
    try {
      let groupId: number;
      if (editingGroup?.id) {
        await outputGroupsApi.updateOutputGroup(editingGroup.id, data);
        groupId = editingGroup.id;
        // 编辑模式：先清空再重新添加
        await outputGroupsApi.clearGroupOutputs(groupId);
      } else {
        const res = await outputGroupsApi.createOutputGroup(
          data as { name: string; description?: string; sort?: number }
        );
        groupId = (res?.data as { id: number })?.id || 0;
      }

      // 逐个添加输出（含 resp_details）
      if (groupId && outputConfigs.length > 0) {
        for (const cfg of outputConfigs) {
          try {
            await outputGroupsApi.addOutputToGroup(groupId, {
              outputDefId: cfg.outputDefId,
              setName: cfg.setName,
              component: cfg.component,
              stepName: cfg.stepName || undefined,
              sectionPoint: cfg.sectionPoint || undefined,
              specialOutputSet: cfg.specialOutputSet || undefined,
              description: cfg.description || undefined,
              weight: cfg.weight,
              multiple: cfg.multiple,
              lowerLimit: cfg.lowerLimit,
              upperLimit: cfg.upperLimit,
              targetType: cfg.targetType,
              targetValue: cfg.targetValue,
              sort: cfg.sort,
            });
          } catch (error) {
            console.error(`添加输出 ${cfg.outputDefId} 失败:`, error);
          }
        }
      }

      setShowGroupModal(false);
      setEditingGroup(null);
      loadAllData();
    } catch (error) {
      console.error('保存工况输出组合失败:', error);
    }
  };

  // 删除工况输出组合
  const handleDeleteGroup = (id: number) => {
    const group = groups.find(g => g.id === id);
    showConfirm(
      '删除工况输出组合',
      `确定要删除「${group?.name}」吗？`,
      async () => {
        try {
          await outputGroupsApi.deleteOutputGroup(id);
          await loadAllData();
          showToast('success', '删除成功');
        } catch (error) {
          console.error('删除工况输出组合失败:', error);
          showToast('error', '删除失败');
        }
      },
      'danger'
    );
  };

  // 从组合移除输出
  const handleRemoveOutput = (groupId: number, outputDefId: number) => {
    const outputs = groupOutputsMap.get(groupId) || [];
    const output = outputs.find(o => o.outputDefId === outputDefId);
    showConfirm(
      '移除输出',
      `确定要移除「${output?.outputName || outputDefId}」吗？`,
      async () => {
        try {
          await outputGroupsApi.removeOutputFromGroup(groupId, outputDefId);
          await loadAllData();
          showToast('success', '移除成功');
        } catch (error) {
          console.error('移除输出失败:', error);
          showToast('error', '移除失败');
        }
      },
      'danger'
    );
  };

  return (
    <Card>
      {/* 头部 */}
      <div className="p-4 border-b dark:border-slate-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold">工况输出组合管理</h3>
            <p className="text-sm text-slate-500 mt-1">管理工况输出组合，支持批量添加输出</p>
          </div>
          <button
            onClick={() => {
              setEditingGroup({});
              setShowGroupModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新建组合
          </button>
        </div>
        {/* 搜索框 + 过滤器 */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索组合名称或输出..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-700 eyecare:bg-card dark:border-slate-600 eyecare:border-border"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <select
              value={filterProjectId}
              onChange={e =>
                setFilterProjectId(e.target.value === '' ? '' : Number(e.target.value))
              }
              className="px-3 py-2 border rounded-lg dark:bg-slate-700 eyecare:bg-card dark:border-slate-600 eyecare:border-border text-sm"
            >
              <option value="">全部项目</option>
              <option value={-1}>全局（无项目）</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {filterProjectId !== '' && (
              <button
                onClick={() => {
                  setFilterProjectId('');
                }}
                className="px-2 py-2 text-slate-400 hover:text-slate-600 rounded-lg"
                title="清除过滤"
              >
                <Filter className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-slate-500">加载中...</div>
        ) : tableData.length === 0 ? (
          <div className="p-8 text-center text-slate-500">暂无数据</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">组合名称</th>
                <th className="px-4 py-3 text-left text-sm font-medium">描述</th>
                <th className="px-4 py-3 text-left text-sm font-medium">输出数量</th>
                <th className="px-4 py-3 text-left text-sm font-medium">输出名称</th>
                <th className="px-4 py-3 text-left text-sm font-medium">代码</th>
                <th className="px-4 py-3 text-left text-sm font-medium">单位</th>
                <th className="px-4 py-3 text-center text-sm font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, idx) => (
                <tr key={`${row.group.id}-${idx}`} className="border-t dark:border-slate-700">
                  {row.rowSpan > 0 && (
                    <>
                      <td className="px-4 py-3" rowSpan={row.rowSpan}>
                        <div className="font-medium">{row.group.name}</div>
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {(row.group.projectIds || []).length > 0 ? (
                            (row.group.projectIds || []).map(pid => (
                              <span
                                key={pid}
                                className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded"
                              >
                                {projects.find(p => p.id === pid)?.name || `项目#${pid}`}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs px-1.5 py-0.5 bg-slate-50 text-slate-500 dark:bg-slate-600/30 dark:text-slate-400 rounded">
                              全局
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500" rowSpan={row.rowSpan}>
                        {row.group.description || '-'}
                      </td>
                      <td className="px-4 py-3" rowSpan={row.rowSpan}>
                        <span className="text-slate-500">
                          {groupOutputsMap.get(row.group.id)?.length || 0}
                        </span>
                      </td>
                    </>
                  )}
                  <td className="px-4 py-3">
                    {row.output && (
                      <span className="text-slate-900 dark:text-white eyecare:text-foreground">
                        {row.output.outputName}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.output && (
                      <span className="text-slate-500 font-mono text-xs">
                        {row.output.outputCode}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.output && <span className="text-slate-500">{row.output.unit || '-'}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {row.isFirstRow && (
                        <>
                          <button
                            onClick={() => {
                              setEditingGroup(row.group);
                              setShowGroupModal(true);
                            }}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                            title="编辑"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteGroup(row.group.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {row.output && (
                        <button
                          onClick={() => handleRemoveOutput(row.group.id, row.output!.outputDefId)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                          title="移除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 模态框 */}
      {showGroupModal && (
        <GroupModal
          group={editingGroup}
          outputDefs={allOutputDefs}
          projects={projects}
          existingOutputConfigs={
            editingGroup?.id
              ? (groupOutputsMap.get(editingGroup.id) || []).map(o => ({
                  outputDefId: o.outputDefId,
                  setName: o.setName || 'push',
                  component: o.component || '35',
                  stepName: o.stepName,
                  sectionPoint: o.sectionPoint,
                  specialOutputSet: o.specialOutputSet,
                  description: o.description,
                  weight: o.weight ?? 1.0,
                  multiple: o.multiple ?? 1.0,
                  lowerLimit: o.lowerLimit ?? 0.0,
                  upperLimit: o.upperLimit,
                  targetType: o.targetType ?? 3,
                  targetValue: o.targetValue,
                  sort: o.sort ?? 100,
                }))
              : []
          }
          onSave={handleSaveGroup}
          onClose={() => {
            setShowGroupModal(false);
            setEditingGroup(null);
          }}
        />
      )}
      <ConfirmDialogComponent />
    </Card>
  );
};

// 组合编辑模态框（表格式输出预配置，支持同一输出多行不同 set）
const GroupModal: React.FC<{
  group: Partial<OutputGroup> | null;
  outputDefs: OutputDef[];
  projects: Array<{ id: number; name: string }>;
  existingOutputConfigs?: OutputRespConfig[];
  onSave: (data: Partial<OutputGroup>, outputConfigs: OutputRespConfig[]) => void;
  onClose: () => void;
}> = ({ group, outputDefs, projects, existingOutputConfigs = [], onSave, onClose }) => {
  const initialData = useMemo(
    () => ({
      name: group?.name || '',
      description: group?.description || '',
      projectIds: group?.projectIds ?? ([] as number[]),
      sort: group?.sort ?? 100,
    }),
    [group]
  );

  const { formData, updateField } = useFormState(initialData);
  const [rows, setRows] = useState<OutputRespConfig[]>(() => [...existingOutputConfigs]);
  const [showPicker, setShowPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const addRow = useCallback((defId: number) => {
    setRows(prev => [...prev, { outputDefId: defId, ...DEFAULT_RESP }]);
    setShowPicker(false);
    setSearchTerm('');
  }, []);
  const removeRow = useCallback(
    (idx: number) => setRows(prev => prev.filter((_, i) => i !== idx)),
    []
  );
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
        header: '输出类型',
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
        header: 'Set集',
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
        header: 'Component',
        accessorKey: 'component',
        size: 110,
        enableSorting: false,
        cell: ({ row }) => (
          <input
            className={inputCls}
            value={row.original.component || ''}
            onChange={e => updateRow(row.index, 'component', e.target.value)}
          />
        ),
      },
      {
        header: '目标',
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
            <option value={3}>靠近目标</option>
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
        header: '数量级',
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
    [getDef, updateRow, removeRow, inputCls]
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 eyecare:bg-card rounded-lg p-6 w-full max-w-[90vw] max-h-[90vh] flex flex-col">
        <h3 className="text-lg font-semibold mb-4">{group?.id ? '编辑' : '创建'}工况输出组合</h3>
        <div className="space-y-4 overflow-y-auto flex-1">
          {/* 基本信息 */}
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1">名称</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={e => updateField('name', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background border-border"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1">
                关联项目（可多选，不选=全局）
              </label>
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

          {/* 输出响应预配置表格 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">输出响应预配置 ({rows.length})</label>
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
                        className="w-full px-2.5 py-1.5 text-sm border rounded-md bg-background border-border mb-2"
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
                点击「添加输出」开始配置输出响应
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg"
          >
            取消
          </button>
          <button
            onClick={() => onSave(formData, rows)}
            disabled={!formData.name?.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
