import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { VirtualTable } from '@/components/tables/VirtualTable';
import { configApi } from '@/api';
import { useFormState } from '@/hooks/useFormState';
import type { ColumnDef } from '@tanstack/react-table';
import type { ParamGroup, ParamInGroup } from '@/types/configGroups';
import type { ParamDef } from '@/api';

export const ParamGroupsManagement: React.FC = () => {
  const [groups, setGroups] = useState<ParamGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ParamGroup | null>(null);
  const [groupParams, setGroupParams] = useState<ParamInGroup[]>([]);
  const [allParamDefs, setAllParamDefs] = useState<ParamDef[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showParamModal, setShowParamModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Partial<ParamGroup> | null>(null);

  // 加载参数组合列表
  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await configApi.getParamGroups();
      // 确保response.data是数组
      const groupsData = Array.isArray(response?.data) ? response.data : [];
      setGroups(groupsData);
    } catch (error) {
      console.error('加载参数组合失败:', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  // 加载参数定义列表
  const loadParamDefs = async () => {
    try {
      const response = await configApi.getParamDefs();
      const paramDefsData = Array.isArray(response?.data) ? response.data : [];
      setAllParamDefs(paramDefsData);
    } catch (error) {
      console.error('加载参数定义失败:', error);
      setAllParamDefs([]);
    }
  };

  // 加载组合包含的参数
  const loadGroupParams = async (groupId: number) => {
    try {
      const response = await configApi.getParamGroupParams(groupId);
      const paramsData = Array.isArray(response?.data) ? response.data : [];
      setGroupParams(paramsData);
    } catch (error) {
      console.error('加载组合参数失败:', error);
      setGroupParams([]);
    }
  };

  useEffect(() => {
    loadGroups();
    loadParamDefs();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupParams(selectedGroup.id);
    }
  }, [selectedGroup]);

  // 创建/更新参数组合
  const handleSaveGroup = async (data: Partial<ParamGroup>) => {
    try {
      if (editingGroup?.id) {
        await configApi.updateParamGroup(editingGroup.id, data);
      } else {
        await configApi.createParamGroup(
          data as { name: string; description?: string; sort?: number }
        );
      }
      setShowGroupModal(false);
      setEditingGroup(null);
      loadGroups();
    } catch (error) {
      console.error('保存参数组合失败:', error);
    }
  };

  // 删除参数组合
  const handleDeleteGroup = async (id: number) => {
    if (!confirm('确定要删除这个参数组合吗？')) return;
    try {
      await configApi.deleteParamGroup(id);
      if (selectedGroup?.id === id) {
        setSelectedGroup(null);
      }
      loadGroups();
    } catch (error) {
      console.error('删除参数组合失败:', error);
    }
  };

  // 添加参数到组合
  const handleAddParam = async (paramDefId: number, defaultValue?: string) => {
    if (!selectedGroup) return;
    try {
      await configApi.addParamToGroup(selectedGroup.id, { paramDefId, defaultValue });
      loadGroupParams(selectedGroup.id);
      setShowParamModal(false);
    } catch (error) {
      console.error('添加参数失败:', error);
    }
  };

  // 从组合移除参数
  const handleRemoveParam = async (paramDefId: number) => {
    if (!selectedGroup) return;
    if (!confirm('确定要移除这个参数吗？')) return;
    try {
      await configApi.removeParamFromGroup(selectedGroup.id, paramDefId);
      loadGroupParams(selectedGroup.id);
    } catch (error) {
      console.error('移除参数失败:', error);
    }
  };

  const paramColumns: ColumnDef<ParamInGroup>[] = [
    {
      header: '参数名称',
      accessorKey: 'paramName',
      cell: ({ row }) => <span className="font-medium">{row.original.paramName}</span>,
    },
    {
      header: 'Key',
      accessorKey: 'paramKey',
      cell: ({ row }) => (
        <span className="text-slate-500 font-mono text-xs">{row.original.paramKey}</span>
      ),
      size: 140,
    },
    {
      header: '默认值',
      accessorKey: 'defaultValue',
      cell: ({ row }) => <span className="text-slate-500">{row.original.defaultValue || '-'}</span>,
      size: 120,
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
            onClick={() => handleRemoveParam(row.original.paramDefId)}
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
      {/* 左侧：参数组合列表 */}
      <div className="lg:col-span-1">
        <Card>
          <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold">参数组合</h3>
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
              <div className="text-center py-8 text-slate-500">暂无参数组合</div>
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

      {/* 右侧：组合包含的参数 */}
      <div className="lg:col-span-2">
        <Card>
          <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              {selectedGroup ? `${selectedGroup.name} - 包含的参数` : '请选择参数组合'}
            </h3>
            {selectedGroup && (
              <button
                onClick={() => setShowParamModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                添加参数
              </button>
            )}
          </div>
          <div className="p-4">
            {!selectedGroup ? (
              <div className="text-center py-12 text-slate-500">请从左侧选择一个参数组合</div>
            ) : groupParams.length === 0 ? (
              <div className="text-center py-12 text-slate-500">该组合暂无参数</div>
            ) : (
              <VirtualTable
                data={groupParams}
                columns={paramColumns}
                getRowId={record => String(record.id)}
                containerHeight={360}
                rowHeight={48}
                enableSorting={false}
                emptyText="该组合暂无参数"
              />
            )}
          </div>
        </Card>
      </div>

      {/* 创建/编辑组合模态框 */}
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

      {/* 添加参数模态框 */}
      {showParamModal && selectedGroup && (
        <AddParamModal
          paramDefs={allParamDefs}
          existingParams={groupParams}
          onAdd={handleAddParam}
          onClose={() => setShowParamModal(false)}
        />
      )}
    </div>
  );
};

// 组合编辑模态框组件
const GroupModal: React.FC<{
  group: Partial<ParamGroup> | null;
  onSave: (data: Partial<ParamGroup>) => void;
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
        <h3 className="text-lg font-semibold mb-4">{group?.id ? '编辑' : '创建'}参数组合</h3>
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

// 添加参数模态框组件
const AddParamModal: React.FC<{
  paramDefs: ParamDef[];
  existingParams: ParamInGroup[];
  onAdd: (paramDefId: number, defaultValue?: string) => void;
  onClose: () => void;
}> = ({ paramDefs, existingParams, onAdd, onClose }) => {
  const initialData = useMemo(
    () => ({
      selectedParamId: null as number | null,
      defaultValue: '',
    }),
    []
  );

  const { formData, updateField } = useFormState(initialData);

  const existingParamIds = new Set(existingParams.map(p => p.paramDefId));
  const availableParams = paramDefs.filter(p => !existingParamIds.has(p.id));
  const selectedParamId = formData.selectedParamId ?? null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">添加参数</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">选择参数</label>
            <select
              value={selectedParamId ?? ''}
              onChange={e =>
                updateField(
                  'selectedParamId',
                  e.target.value ? Number(e.target.value) : (null as number | null)
                )
              }
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            >
              <option value="">请选择</option>
              {availableParams.map(param => (
                <option key={param.id} value={param.id}>
                  {param.name} ({param.key})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">默认值（可选）</label>
            <input
              type="text"
              value={formData.defaultValue || ''}
              onChange={e => updateField('defaultValue', e.target.value)}
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
            onClick={() =>
              selectedParamId && onAdd(selectedParamId, formData.defaultValue || undefined)
            }
            disabled={!selectedParamId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            添加
          </button>
        </div>
      </div>
    </div>
  );
};
