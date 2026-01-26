import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { VirtualTable } from '@/components/tables/VirtualTable';
import { configApi } from '@/api';
import { useFormState } from '@/hooks/useFormState';
import type { ColumnDef } from '@tanstack/react-table';
import type { CondOutGroup, ConditionInGroup, OutputInGroup } from '@/types/configGroups';
import type { ConditionDef, OutputDef } from '@/api';

export const CondOutGroupsManagement: React.FC = () => {
  const [groups, setGroups] = useState<CondOutGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<CondOutGroup | null>(null);
  const [groupConditions, setGroupConditions] = useState<ConditionInGroup[]>([]);
  const [groupOutputs, setGroupOutputs] = useState<OutputInGroup[]>([]);
  const [allConditionDefs, setAllConditionDefs] = useState<ConditionDef[]>([]);
  const [allOutputDefs, setAllOutputDefs] = useState<OutputDef[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [showOutputModal, setShowOutputModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Partial<CondOutGroup> | null>(null);

  // 加载工况输出组合列表
  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await configApi.getCondOutGroups();
      const groupsData = Array.isArray(response?.data) ? response.data : [];
      setGroups(groupsData);
    } catch (error) {
      console.error('加载工况输出组合失败:', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  // 加载工况和输出定义
  const loadDefs = async () => {
    try {
      const [condRes, outRes] = await Promise.all([
        configApi.getConditionDefs(),
        configApi.getOutputDefs(),
      ]);
      const condDefsData = Array.isArray(condRes?.data) ? condRes.data : [];
      const outDefsData = Array.isArray(outRes?.data) ? outRes.data : [];
      setAllConditionDefs(condDefsData);
      setAllOutputDefs(outDefsData);
    } catch (error) {
      console.error('加载定义失败:', error);
      setAllConditionDefs([]);
      setAllOutputDefs([]);
    }
  };

  // 加载组合包含的工况和输出
  const loadGroupDetails = async (groupId: number) => {
    try {
      const [condRes, outRes] = await Promise.all([
        configApi.getCondOutGroupConditions(groupId),
        configApi.getCondOutGroupOutputs(groupId),
      ]);
      const conditionsData = Array.isArray(condRes?.data) ? condRes.data : [];
      const outputsData = Array.isArray(outRes?.data) ? outRes.data : [];
      setGroupConditions(conditionsData);
      setGroupOutputs(outputsData);
    } catch (error) {
      console.error('加载组合详情失败:', error);
      setGroupConditions([]);
      setGroupOutputs([]);
    }
  };

  useEffect(() => {
    loadGroups();
    loadDefs();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupDetails(selectedGroup.id);
    }
  }, [selectedGroup]);

  // 创建/更新工况输出组合
  const handleSaveGroup = async (data: Partial<CondOutGroup>) => {
    try {
      if (editingGroup?.id) {
        await configApi.updateCondOutGroup(editingGroup.id, data);
      } else {
        await configApi.createCondOutGroup(
          data as { name: string; description?: string; sort?: number }
        );
      }
      setShowGroupModal(false);
      setEditingGroup(null);
      loadGroups();
    } catch (error) {
      console.error('保存工况输出组合失败:', error);
    }
  };

  // 删除工况输出组合
  const handleDeleteGroup = async (id: number) => {
    if (!confirm('确定要删除这个工况输出组合吗？')) return;
    try {
      await configApi.deleteCondOutGroup(id);
      if (selectedGroup?.id === id) {
        setSelectedGroup(null);
      }
      loadGroups();
    } catch (error) {
      console.error('删除工况输出组合失败:', error);
    }
  };

  // 添加工况到组合
  const handleAddCondition = async (
    conditionDefId: number,
    configData?: Record<string, unknown>
  ) => {
    if (!selectedGroup) return;
    try {
      await configApi.addConditionToGroup(selectedGroup.id, { conditionDefId, configData });
      loadGroupDetails(selectedGroup.id);
      setShowConditionModal(false);
    } catch (error) {
      console.error('添加工况失败:', error);
    }
  };

  // 从组合移除工况
  const handleRemoveCondition = async (conditionDefId: number) => {
    if (!selectedGroup) return;
    if (!confirm('确定要移除这个工况吗？')) return;
    try {
      await configApi.removeConditionFromGroup(selectedGroup.id, conditionDefId);
      loadGroupDetails(selectedGroup.id);
    } catch (error) {
      console.error('移除工况失败:', error);
    }
  };

  // 添加输出到组合
  const handleAddOutput = async (outputDefId: number) => {
    if (!selectedGroup) return;
    try {
      await configApi.addOutputToGroup(selectedGroup.id, { outputDefId });
      loadGroupDetails(selectedGroup.id);
      setShowOutputModal(false);
    } catch (error) {
      console.error('添加输出失败:', error);
    }
  };

  // 从组合移除输出
  const handleRemoveOutput = async (outputDefId: number) => {
    if (!selectedGroup) return;
    if (!confirm('确定要移除这个输出吗？')) return;
    try {
      await configApi.removeOutputFromGroup(selectedGroup.id, outputDefId);
      loadGroupDetails(selectedGroup.id);
    } catch (error) {
      console.error('移除输出失败:', error);
    }
  };

  const outputColumns: ColumnDef<OutputInGroup>[] = [
    {
      header: '输出名称',
      accessorKey: 'outputName',
      cell: ({ row }) => <span className="font-medium">{row.original.outputName}</span>,
    },
    {
      header: '代码',
      accessorKey: 'outputCode',
      cell: ({ row }) => (
        <span className="text-slate-500 font-mono text-xs">{row.original.outputCode}</span>
      ),
      size: 140,
    },
    {
      header: '单位',
      accessorKey: 'unit',
      cell: ({ row }) => <span className="text-slate-500">{row.original.unit || '-'}</span>,
      size: 100,
    },
    {
      header: '操作',
      id: 'actions',
      size: 80,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <button
            onClick={() => handleRemoveOutput(row.original.outputDefId)}
            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 左侧：工况输出组合列表 */}
      <div className="lg:col-span-1">
        <Card>
          <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold">工况输出组合</h3>
            <button
              onClick={() => {
                setEditingGroup({});
                setShowGroupModal(true);
              }}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 space-y-2">
            {loading ? (
              <div className="text-center py-8 text-slate-500">加载中...</div>
            ) : groups.length === 0 ? (
              <div className="text-center py-8 text-slate-500">暂无工况输出组合</div>
            ) : (
              groups.map(group => (
                <div
                  key={group.id}
                  onClick={() => setSelectedGroup(group)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedGroup?.id === group.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                      : 'bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 dark:text-white">{group.name}</div>
                      {group.description && (
                        <div className="text-sm text-slate-500 mt-1">{group.description}</div>
                      )}
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setEditingGroup(group);
                          setShowGroupModal(true);
                        }}
                        className="p-1 text-slate-600 hover:text-blue-600 transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteGroup(group.id);
                        }}
                        className="p-1 text-slate-600 hover:text-red-600 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* 右侧：组合包含的工况和输出 */}
      <div className="lg:col-span-2 space-y-6">
        {/* 工况列表 */}
        <Card>
          <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              {selectedGroup ? `${selectedGroup.name} - 工况` : '请选择工况输出组合'}
            </h3>
            {selectedGroup && (
              <button
                onClick={() => setShowConditionModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                添加工况
              </button>
            )}
          </div>
          <div className="p-4">
            {!selectedGroup ? (
              <div className="text-center py-12 text-slate-500">请从左侧选择一个工况输出组合</div>
            ) : groupConditions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">该组合暂无工况</div>
            ) : (
              <div className="space-y-2">
                {groupConditions.map(cond => (
                  <div
                    key={cond.id}
                    className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg flex justify-between items-start"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{cond.conditionName}</div>
                      <div className="text-sm text-slate-500 mt-1">代码: {cond.conditionCode}</div>
                      {cond.configData && (
                        <div className="text-xs text-slate-500 mt-1 font-mono">
                          {JSON.stringify(cond.configData)}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveCondition(cond.conditionDefId)}
                      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* 输出列表 */}
        <Card>
          <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              {selectedGroup ? `${selectedGroup.name} - 输出` : '输出'}
            </h3>
            {selectedGroup && (
              <button
                onClick={() => setShowOutputModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                添加输出
              </button>
            )}
          </div>
          <div className="p-4">
            {!selectedGroup ? (
              <div className="text-center py-12 text-slate-500">请从左侧选择一个工况输出组合</div>
            ) : groupOutputs.length === 0 ? (
              <div className="text-center py-12 text-slate-500">该组合暂无输出</div>
            ) : (
              <VirtualTable
                data={groupOutputs}
                columns={outputColumns}
                getRowId={record => String(record.id)}
                containerHeight={320}
                rowHeight={48}
                enableSorting={false}
                emptyText="该组合暂无输出"
              />
            )}
          </div>
        </Card>
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

      {showConditionModal && selectedGroup && (
        <AddConditionModal
          conditionDefs={allConditionDefs}
          existingConditions={groupConditions}
          onAdd={handleAddCondition}
          onClose={() => setShowConditionModal(false)}
        />
      )}

      {showOutputModal && selectedGroup && (
        <AddOutputModal
          outputDefs={allOutputDefs}
          existingOutputs={groupOutputs}
          onAdd={handleAddOutput}
          onClose={() => setShowOutputModal(false)}
        />
      )}
    </div>
  );
};

// 组合编辑模态框
const GroupModal: React.FC<{
  group: Partial<CondOutGroup> | null;
  onSave: (data: Partial<CondOutGroup>) => void;
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
        <h3 className="text-lg font-semibold mb-4">{group?.id ? '编辑' : '创建'}工况输出组合</h3>
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
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            取消
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

// 添加工况模态框
const AddConditionModal: React.FC<{
  conditionDefs: ConditionDef[];
  existingConditions: ConditionInGroup[];
  onAdd: (conditionDefId: number, configData?: Record<string, unknown>) => void;
  onClose: () => void;
}> = ({ conditionDefs, existingConditions, onAdd, onClose }) => {
  const initialData = useMemo(
    () => ({
      selectedCondId: null as number | null,
      configData: '{}',
    }),
    []
  );

  const { formData, updateField } = useFormState(initialData);

  const existingCondIds = new Set(existingConditions.map(c => c.conditionDefId));
  const availableConds = conditionDefs.filter(c => !existingCondIds.has(c.id));
  const selectedCondId = formData.selectedCondId ?? null;

  const handleAdd = () => {
    if (!selectedCondId) return;
    try {
      const parsed = JSON.parse(formData.configData || '{}');
      onAdd(selectedCondId, parsed);
    } catch {
      alert('配置数据格式错误，请输入有效的JSON');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">添加工况</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">选择工况</label>
            <select
              value={selectedCondId ?? ''}
              onChange={e =>
                updateField(
                  'selectedCondId',
                  e.target.value ? Number(e.target.value) : (null as number | null)
                )
              }
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            >
              <option value="">请选择</option>
              {availableConds.map(cond => (
                <option key={cond.id} value={cond.id}>
                  {cond.name} ({cond.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">配置数据（JSON格式）</label>
            <textarea
              value={formData.configData || '{}'}
              onChange={e => updateField('configData', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 font-mono text-xs"
              rows={4}
              placeholder='{"key": "value"}'
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            取消
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedCondId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            添加
          </button>
        </div>
      </div>
    </div>
  );
};

// 添加输出模态框
const AddOutputModal: React.FC<{
  outputDefs: OutputDef[];
  existingOutputs: OutputInGroup[];
  onAdd: (outputDefId: number) => void;
  onClose: () => void;
}> = ({ outputDefs, existingOutputs, onAdd, onClose }) => {
  const initialData = useMemo(
    () => ({
      selectedOutputId: null as number | null,
    }),
    []
  );

  const { formData, updateField } = useFormState(initialData);

  const existingOutputIds = new Set(existingOutputs.map(o => o.outputDefId));
  const availableOutputs = outputDefs.filter(o => !existingOutputIds.has(o.id));
  const selectedOutputId = formData.selectedOutputId ?? null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">添加输出</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">选择输出</label>
            <select
              value={selectedOutputId ?? ''}
              onChange={e =>
                updateField(
                  'selectedOutputId',
                  e.target.value ? Number(e.target.value) : (null as number | null)
                )
              }
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            >
              <option value="">请选择</option>
              {availableOutputs.map(output => (
                <option key={output.id} value={output.id}>
                  {output.name} ({output.code})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            取消
          </button>
          <button
            onClick={() => selectedOutputId && onAdd(selectedOutputId)}
            disabled={!selectedOutputId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            添加
          </button>
        </div>
      </div>
    </div>
  );
};
