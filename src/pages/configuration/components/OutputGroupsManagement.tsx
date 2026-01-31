import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Card, useToast, useConfirmDialog } from '@/components/ui';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { configApi } from '@/api';
import { useFormState } from '@/hooks/useFormState';
import type { OutputGroup, OutputInGroup } from '@/types/configGroups';
import type { OutputDef } from '@/api';

// 搜索结果类型
interface SearchOutputResult {
  outputDefId: number;
  outputCode: string;
  outputName: string;
  unit?: string;
  valType?: number;
  inGroup: boolean;
}

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
  const [showOutputModal, setShowOutputModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Partial<OutputGroup> | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);

  const { showToast } = useToast();
  const { showConfirm, ConfirmDialogComponent } = useConfirmDialog();

  // 加载所有数据
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [groupsRes, outputDefsRes] = await Promise.all([
        configApi.getOutputGroups(),
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
            const res = await configApi.getOutputGroupOutputs(group.id);
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

  // 创建/更新输出组合
  const handleSaveGroup = async (data: Partial<OutputGroup>) => {
    try {
      if (editingGroup?.id) {
        await configApi.updateOutputGroup(editingGroup.id, data);
        showToast('success', '更新成功');
      } else {
        await configApi.createOutputGroup(
          data as { name: string; description?: string; sort?: number }
        );
        showToast('success', '创建成功');
      }
      setShowGroupModal(false);
      setEditingGroup(null);
      await loadAllData();
    } catch (error: unknown) {
      console.error('保存输出组合失败:', error);
      const errMsg = (error as { message?: string })?.message || '保存失败';
      showToast('error', errMsg);
    }
  };

  // 删除输出组合
  const handleDeleteGroup = (id: number) => {
    showConfirm(
      '确认删除',
      '确定要删除这个输出组合吗？',
      async () => {
        try {
          await configApi.deleteOutputGroup(id);
          showToast('success', '删除成功');
          await loadAllData();
        } catch (error) {
          console.error('删除输出组合失败:', error);
          showToast('error', '删除失败');
        }
      },
      'danger'
    );
  };

  // 批量添加输出到组合
  const handleAddOutputs = async (groupId: number, outputDefIds: number[]) => {
    try {
      for (const outputDefId of outputDefIds) {
        await configApi.addOutputToGroup(groupId, { outputDefId });
      }
      showToast('success', `成功添加 ${outputDefIds.length} 个输出`);
      await loadAllData();
      setShowOutputModal(false);
      setEditingGroupId(null);
    } catch (error) {
      console.error('添加输出失败:', error);
      showToast('error', '添加失败');
    }
  };

  // 从组合移除输出
  const handleRemoveOutput = (groupId: number, outputDefId: number) => {
    showConfirm(
      '确认移除',
      '确定要移除这个输出吗？',
      async () => {
        try {
          await configApi.removeOutputFromGroup(groupId, outputDefId);
          showToast('success', '移除成功');
          await loadAllData();
        } catch (error) {
          console.error('移除输出失败:', error);
          showToast('error', '移除失败');
        }
      },
      'warning'
    );
  };

  // 清空组合的所有输出
  const handleClearOutputs = (groupId: number) => {
    const outputs = groupOutputsMap.get(groupId) || [];
    if (outputs.length === 0) {
      showToast('info', '该组合没有输出可清空');
      return;
    }
    showConfirm(
      '确认清空',
      `确定要清空该组合的所有 ${outputs.length} 个输出吗？`,
      async () => {
        try {
          await configApi.clearGroupOutputs(groupId);
          showToast('success', '清空成功');
          await loadAllData();
        } catch (error) {
          console.error('清空输出失败:', error);
          showToast('error', '清空失败');
        }
      },
      'warning'
    );
  };

  // 下载 Excel 模板
  const handleDownloadTemplate = () => {
    const headers = ['输出Code(必填)', '输出名称', '单位', '数据类型'];
    const exampleRow = ['output_code_1', '输出名称示例', 'MPa', 'float'];
    const csvContent = [headers.join(','), exampleRow.join(',')].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '输出组合模板.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      {/* 头部 */}
      <div className="p-4 border-b dark:border-slate-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold">输出组合管理</h3>
            <p className="text-sm text-slate-500 mt-1">管理输出组合，支持批量添加输出和导入</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1 text-sm"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              模板
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-3 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1 text-sm"
            >
              <ArrowUpTrayIcon className="w-4 h-4" />
              导入
            </button>
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
        </div>
        {/* 搜索框 */}
        <div className="mt-4 relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索组合名称或输出..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
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
          <div className="p-12 text-center text-slate-500">加载中...</div>
        ) : tableData.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            {searchTerm ? '未找到匹配的结果' : '暂无输出组合'}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 w-56">
                  组合名称
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 w-40">
                  输出 Code
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 w-40">
                  输出名称
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 w-20">
                  单位
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 w-24">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {tableData.map((row, idx) => (
                <tr
                  key={`${row.group.id}-${row.output?.outputDefId || 'empty'}-${idx}`}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/30"
                >
                  {row.rowSpan > 0 && (
                    <td
                      rowSpan={row.rowSpan}
                      className="px-4 py-3 align-top border-r dark:border-slate-700"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {row.group.name}
                          </div>
                          {row.group.description && (
                            <div className="text-xs text-slate-500 mt-1">
                              {row.group.description}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => {
                              setEditingGroupId(row.group.id);
                              setShowOutputModal(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                            title="添加输出"
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleClearOutputs(row.group.id)}
                            className="p-1.5 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg"
                            title="清空输出"
                          >
                            <ArrowPathIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingGroup(row.group);
                              setShowGroupModal(true);
                            }}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg"
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
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    {row.output ? (
                      <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                        {row.output.outputCode}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-sm">未配置输出</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.output && (
                      <span className="text-slate-900 dark:text-white">
                        {row.output.outputName}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.output && <span className="text-slate-500">{row.output.unit || '-'}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {row.output && (
                      <button
                        onClick={() => handleRemoveOutput(row.group.id, row.output!.outputDefId)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                        title="移除"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
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
          onSave={handleSaveGroup}
          onClose={() => {
            setShowGroupModal(false);
            setEditingGroup(null);
          }}
        />
      )}
      {showOutputModal && editingGroupId !== null && (
        <AddOutputsModal
          groupId={editingGroupId}
          groupName={groups.find(g => g.id === editingGroupId)?.name || ''}
          outputDefs={allOutputDefs}
          existingOutputIds={
            new Set((groupOutputsMap.get(editingGroupId) || []).map(o => o.outputDefId))
          }
          onAdd={handleAddOutputs}
          onClose={() => {
            setShowOutputModal(false);
            setEditingGroupId(null);
          }}
          showToast={showToast}
          onRefresh={loadAllData}
        />
      )}
      {showUploadModal && (
        <UploadExcelModal
          groups={groups}
          allOutputDefs={allOutputDefs}
          onSuccess={loadAllData}
          onClose={() => setShowUploadModal(false)}
          showToast={showToast}
        />
      )}
      <ConfirmDialogComponent />
    </Card>
  );
};

// 组合编辑模态框组件
const GroupModal: React.FC<{
  group: Partial<OutputGroup> | null;
  onSave: (data: Partial<OutputGroup>) => void;
  onClose: () => void;
}> = ({ group, onSave, onClose }) => {
  const initialData = useMemo(
    () => ({
      name: group?.name || '',
      description: group?.description || '',
      sort: group?.sort ?? 100,
    }),
    [group]
  );

  const { formData, updateField } = useFormState(initialData);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">{group?.id ? '编辑' : '创建'}输出组合</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">名称</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={e => updateField('name', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">描述</label>
            <textarea
              value={formData.description || ''}
              onChange={e => updateField('description', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">排序</label>
            <input
              type="number"
              value={formData.sort ?? 100}
              onChange={e => updateField('sort', Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

// 添加输出模态框组件（支持多选和快速创建）
const AddOutputsModal: React.FC<{
  groupId: number;
  groupName: string;
  outputDefs: OutputDef[];
  existingOutputIds: Set<number>;
  onAdd: (groupId: number, outputDefIds: number[]) => void;
  onClose: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
  onRefresh: () => Promise<void>;
}> = ({
  groupId,
  groupName,
  outputDefs,
  existingOutputIds,
  onAdd,
  onClose,
  showToast,
  onRefresh,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreateData, setQuickCreateData] = useState({
    code: '',
    name: '',
    unit: '',
    dataType: 'float',
  });
  const [creating, setCreating] = useState(false);

  const availableOutputs = outputDefs.filter(o => !existingOutputIds.has(o.id));
  const filteredOutputs = availableOutputs.filter(
    o =>
      !searchTerm ||
      o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOutput = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAll = () => setSelectedIds(new Set(filteredOutputs.map(o => o.id)));
  const clearAll = () => setSelectedIds(new Set());

  // 快速创建并添加输出
  const handleQuickCreate = async () => {
    if (!quickCreateData.code.trim()) {
      showToast('error', '输出Code不能为空');
      return;
    }
    setCreating(true);
    try {
      await configApi.createAndAddOutput(groupId, {
        code: quickCreateData.code.trim(),
        name: quickCreateData.name.trim() || quickCreateData.code.trim(),
        unit: quickCreateData.unit.trim() || undefined,
        dataType: quickCreateData.dataType,
      });
      showToast('success', '创建并添加成功');
      setQuickCreateData({ code: '', name: '', unit: '', dataType: 'float' });
      setShowQuickCreate(false);
      await onRefresh();
    } catch (error) {
      console.error('创建并添加失败:', error);
      showToast('error', '创建并添加失败');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        <div className="p-4 border-b dark:border-slate-700">
          <h3 className="text-lg font-bold">添加输出到 {groupName}</h3>
          <p className="text-sm text-slate-500 mt-1">选择要添加的输出（支持多选）</p>
        </div>

        <div className="p-4 border-b dark:border-slate-700 space-y-3">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索输出名称或 Code..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">已选择 {selectedIds.size} 个输出</span>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-blue-600 hover:underline">
                全选
              </button>
              <button onClick={clearAll} className="text-slate-500 hover:underline">
                清空
              </button>
              <button
                onClick={() => setShowQuickCreate(!showQuickCreate)}
                className="text-green-600 hover:underline"
              >
                {showQuickCreate ? '取消创建' : '创建并添加'}
              </button>
            </div>
          </div>
          {/* 快速创建表单 */}
          {showQuickCreate && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="输出Code (必填)"
                  value={quickCreateData.code}
                  onChange={e => setQuickCreateData({ ...quickCreateData, code: e.target.value })}
                  className="px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-sm"
                />
                <input
                  type="text"
                  placeholder="输出名称"
                  value={quickCreateData.name}
                  onChange={e => setQuickCreateData({ ...quickCreateData, name: e.target.value })}
                  className="px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-sm"
                />
                <input
                  type="text"
                  placeholder="单位"
                  value={quickCreateData.unit}
                  onChange={e => setQuickCreateData({ ...quickCreateData, unit: e.target.value })}
                  className="px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-sm"
                />
                <select
                  value={quickCreateData.dataType}
                  onChange={e =>
                    setQuickCreateData({ ...quickCreateData, dataType: e.target.value })
                  }
                  className="px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-sm"
                >
                  <option value="float">float</option>
                  <option value="int">int</option>
                  <option value="string">string</option>
                </select>
              </div>
              <button
                onClick={handleQuickCreate}
                disabled={creating || !quickCreateData.code.trim()}
                className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                {creating ? '创建中...' : '创建并添加到组合'}
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredOutputs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {searchTerm ? '未找到匹配的输出' : '没有可添加的输出'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredOutputs.map(output => (
                <label
                  key={output.id}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedIds.has(output.id)
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                      : 'bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border-2 border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(output.id)}
                    onChange={() => toggleOutput(output.id)}
                    className="rounded mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{output.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{output.code}</div>
                  </div>
                  {output.unit && (
                    <span className="text-xs text-slate-500">单位: {output.unit}</span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            取消
          </button>
          <button
            onClick={() => onAdd(groupId, Array.from(selectedIds))}
            disabled={selectedIds.size === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            添加 ({selectedIds.size})
          </button>
        </div>
      </div>
    </div>
  );
};

// Excel 上传模态框组件
const UploadExcelModal: React.FC<{
  groups: OutputGroup[];
  allOutputDefs: OutputDef[];
  onSuccess: () => void;
  onClose: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}> = ({ groups, allOutputDefs, onSuccess, onClose, showToast }) => {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedOutput[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  interface ParsedOutput {
    code: string;
    name: string;
    unit: string;
    dataType: string;
    exists: boolean;
    outputDefId?: number;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = async (file: File) => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      showToast('error', '文件格式错误，至少需要标题行和一行数据');
      return;
    }

    const dataLines = lines.slice(1);
    const parsed: ParsedOutput[] = dataLines
      .map(line => {
        const cols = line.split(',').map(c => c.trim());
        const code = cols[0] || '';
        const existingOutput = allOutputDefs.find(o => o.code === code);
        return {
          code,
          name: cols[1] || '',
          unit: cols[2] || '',
          dataType: cols[3] || 'float',
          exists: !!existingOutput,
          outputDefId: existingOutput?.id,
        };
      })
      .filter(o => o.code);

    setParsedData(parsed);
  };

  const handleUpload = async () => {
    if (!selectedGroupId || parsedData.length === 0) return;
    setUploading(true);
    try {
      for (const output of parsedData) {
        if (!output.exists) {
          const res = await configApi.createOutputDef({
            code: output.code,
            name: output.name || output.code,
            unit: output.unit || undefined,
            dataType: output.dataType || 'float',
          });
          output.outputDefId = res.data?.id;
        }
      }

      for (const output of parsedData) {
        if (output.outputDefId) {
          await configApi.addOutputToGroup(selectedGroupId, { outputDefId: output.outputDefId });
        }
      }

      showToast('success', '导入成功');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('导入失败:', error);
      showToast('error', '导入失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        <div className="p-4 border-b dark:border-slate-700">
          <h3 className="text-lg font-bold">导入输出组合</h3>
          <p className="text-sm text-slate-500 mt-1">上传 CSV 文件，自动识别并创建输出</p>
        </div>

        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-2">选择目标组合</label>
            <select
              value={selectedGroupId ?? ''}
              onChange={e => setSelectedGroupId(e.target.value ? Number(e.target.value) : null)}
              className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            >
              <option value="">请选择...</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">上传文件</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-4 border-2 border-dashed rounded-lg text-center hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              {file ? file.name : '点击选择文件 (CSV)'}
            </button>
          </div>

          {parsedData.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">
                预览 ({parsedData.length} 个输出)
              </label>
              <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-3 py-2 text-left">Code</th>
                      <th className="px-3 py-2 text-left">名称</th>
                      <th className="px-3 py-2 text-left">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-700">
                    {parsedData.map((o, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-mono text-xs">{o.code}</td>
                        <td className="px-3 py-2">{o.name || '-'}</td>
                        <td className="px-3 py-2">
                          {o.exists ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckIcon className="w-4 h-4" /> 已存在
                            </span>
                          ) : (
                            <span className="text-orange-500">将创建</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            取消
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedGroupId || parsedData.length === 0 || uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? '导入中...' : '确认导入'}
          </button>
        </div>
      </div>
    </div>
  );
};
