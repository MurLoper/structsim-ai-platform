import React, { useState, useEffect, useMemo } from 'react';
import { Card, useToast, useConfirmDialog } from '@/components/ui';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { configApi, outputGroupsApi } from '@/api';
import { useFormState } from '@/hooks/useFormState';
import type { OutputGroup, OutputInGroup } from '@/types/configGroups';
import type { OutputDef } from '@/api';

interface TableRow {
  group: OutputGroup;
  output: OutputInGroup | null;
  rowSpan: number;
  isFirstRow: boolean;
}

export const OutputGroupsManagement: React.FC = () => {
  const [groups, setGroups] = useState<OutputGroup[]>([]);
  const [allOutputDefs, setAllOutputDefs] = useState<OutputDef[]>([]);
  const [groupOutputsMap, setGroupOutputsMap] = useState<Map<number, OutputInGroup[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Partial<OutputGroup> | null>(null);

  const { showToast } = useToast();
  const { showConfirm, ConfirmDialogComponent } = useConfirmDialog();

  // 加载所有数据
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [groupsRes, outputDefsRes] = await Promise.all([
        outputGroupsApi.getOutputGroups(),
        configApi.getOutputDefs(),
      ]);

      const groupsData = Array.isArray(groupsRes?.data) ? groupsRes.data : [];
      const outputDefsData = Array.isArray(outputDefsRes?.data) ? outputDefsRes.data : [];

      setGroups(groupsData);
      setAllOutputDefs(outputDefsData);

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
    loadAllData();
  }, []);

  // 计算表格数据：按组合分组，支持行合并
  const tableData = useMemo(() => {
    const rows: TableRow[] = [];
    const filteredGroups = groups.filter(
      g =>
        !searchTerm ||
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (groupOutputsMap.get(g.id) || []).some(
          o =>
            o.outputName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.outputCode?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

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
  }, [groups, groupOutputsMap, searchTerm]);

  // 创建/更新工况输出组合
  const handleSaveGroup = async (data: Partial<OutputGroup>, selectedOutputIds: number[]) => {
    try {
      let groupId: number;
      if (editingGroup?.id) {
        await outputGroupsApi.updateOutputGroup(editingGroup.id, data);
        groupId = editingGroup.id;
      } else {
        const res = await outputGroupsApi.createOutputGroup(
          data as { name: string; description?: string; sort?: number }
        );
        groupId = (res?.data as any)?.id || 0;
      }

      // 如果有选中的输出，批量添加
      if (selectedOutputIds.length > 0 && groupId) {
        for (const outputDefId of selectedOutputIds) {
          try {
            await outputGroupsApi.addOutputToGroup(groupId, { outputDefId });
          } catch (error) {
            console.error(`添加输出 ${outputDefId} 失败:`, error);
          }
        }
      }

      setShowGroupModal(false);
      setEditingGroup(null);
      loadAllData();
      if (groupId) {
        const newGroup =
          groups.find(g => g.id === groupId) ||
          ({ id: groupId, name: data.name || '' } as OutputGroup);
        // setSelectedGroup(newGroup);
      }
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
            <PlusIcon className="w-4 h-4" />
            新建组合
          </button>
        </div>
        {/* 搜索框 */}
        <div className="mt-4 relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
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
                        <span className="font-medium">{row.group.name}</span>
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
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteGroup(row.group.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                            title="删除"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {row.output && (
                        <button
                          onClick={() => handleRemoveOutput(row.group.id, row.output!.outputDefId)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                          title="移除"
                        >
                          <TrashIcon className="w-4 h-4" />
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
          existingOutputIds={
            editingGroup?.id
              ? new Set((groupOutputsMap.get(editingGroup.id) || []).map(o => o.outputDefId))
              : new Set()
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

// 组合编辑模态框（整合输出选择）
const GroupModal: React.FC<{
  group: Partial<OutputGroup> | null;
  outputDefs: OutputDef[];
  existingOutputIds?: Set<number>;
  onSave: (data: Partial<OutputGroup>, selectedOutputIds: number[]) => void;
  onClose: () => void;
}> = ({ group, outputDefs, existingOutputIds = new Set(), onSave, onClose }) => {
  const initialData = useMemo(
    () => ({
      name: group?.name || '',
      description: group?.description || '',
      sort: group?.sort ?? 100,
    }),
    [group]
  );

  const { formData, updateField } = useFormState(initialData);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(existingOutputIds);
  const [searchTerm, setSearchTerm] = useState('');

  // 过滤输出：已选中的排在前面
  const filteredOutputs = useMemo(() => {
    const filtered = outputDefs.filter(
      o =>
        !searchTerm ||
        o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return filtered.sort((a, b) => {
      const aSelected = selectedIds.has(a.id);
      const bSelected = selectedIds.has(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  }, [outputDefs, searchTerm, selectedIds]);

  const toggleOutput = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 eyecare:bg-card rounded-lg p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <h3 className="text-lg font-semibold mb-4">{group?.id ? '编辑' : '创建'}工况输出组合</h3>
        <div className="space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium mb-1">名称</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={e => updateField('name', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 eyecare:bg-card dark:border-slate-600 eyecare:border-border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">描述</label>
            <textarea
              value={formData.description || ''}
              onChange={e => updateField('description', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 eyecare:bg-card dark:border-slate-600 eyecare:border-border"
              rows={2}
            />
          </div>

          {/* 输出选择区域 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">选择输出</label>
              <span className="text-xs text-slate-500">已选 {selectedIds.size} 个</span>
            </div>
            <input
              type="text"
              placeholder="搜索输出..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 eyecare:bg-card dark:border-slate-600 eyecare:border-border mb-2"
            />
            <div className="border rounded-lg dark:border-slate-600 max-h-[300px] overflow-y-auto">
              {filteredOutputs.map(output => (
                <label
                  key={output.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 eyecare:hover:bg-muted cursor-pointer border-b last:border-b-0 dark:border-slate-600"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(output.id)}
                    onChange={() => toggleOutput(output.id)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{output.name}</div>
                    <div className="text-xs text-slate-500">{output.code}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            取消
          </button>
          <button
            onClick={() => onSave(formData, Array.from(selectedIds))}
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
