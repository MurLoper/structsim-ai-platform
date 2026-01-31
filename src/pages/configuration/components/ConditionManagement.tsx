import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui';
import { PlusIcon, TrashIcon, StarIcon, PencilIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { baseConfigApi } from '@/api/config/base';
import type { FoldType, SimType, FoldTypeSimTypeRel } from '@/types/config';

interface FoldTypeWithSimTypes extends FoldType {
  simTypes: SimTypeRelItem[];
}

interface SimTypeRelItem {
  relId: number;
  simTypeId: number;
  simTypeName: string;
  simTypeCode: string;
  isDefault: number;
  sort: number;
}

export const ConditionManagement: React.FC = () => {
  const [foldTypes, setFoldTypes] = useState<FoldType[]>([]);
  const [allSimTypes, setAllSimTypes] = useState<SimType[]>([]);
  const [relationsMap, setRelationsMap] = useState<Map<number, SimTypeRelItem[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFoldTypeId, setEditingFoldTypeId] = useState<number | null>(null);

  // 加载所有数据
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

      // 加载所有姿态的仿真类型关联
      const relMap = new Map<number, SimTypeRelItem[]>();
      await Promise.all(
        foldTypesData.map(async (ft: FoldType) => {
          try {
            const relRes = await baseConfigApi.getFoldTypeSimTypeRelsByFoldType(ft.id);
            const rels = (relRes.data || []).map(
              (rel: FoldTypeSimTypeRel & { simTypeName?: string; simTypeCode?: string }) => ({
                relId: rel.id,
                simTypeId: rel.simTypeId,
                simTypeName:
                  rel.simTypeName ||
                  simTypesData.find((st: SimType) => st.id === rel.simTypeId)?.name ||
                  '',
                simTypeCode:
                  rel.simTypeCode ||
                  simTypesData.find((st: SimType) => st.id === rel.simTypeId)?.code ||
                  '',
                isDefault: rel.isDefault,
                sort: rel.sort,
              })
            );
            relMap.set(ft.id, rels);
          } catch {
            relMap.set(ft.id, []);
          }
        })
      );
      setRelationsMap(relMap);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // 计算表格数据：按姿态类型分组，支持行合并
  const tableData = useMemo(() => {
    const rows: Array<{
      foldType: FoldType;
      simType: SimTypeRelItem | null;
      rowSpan: number;
      isFirstRow: boolean;
    }> = [];

    foldTypes.forEach(ft => {
      const simTypes = relationsMap.get(ft.id) || [];
      if (simTypes.length === 0) {
        rows.push({
          foldType: ft,
          simType: null,
          rowSpan: 1,
          isFirstRow: true,
        });
      } else {
        simTypes.forEach((st, idx) => {
          rows.push({
            foldType: ft,
            simType: st,
            rowSpan: idx === 0 ? simTypes.length : 0,
            isFirstRow: idx === 0,
          });
        });
      }
    });

    return rows;
  }, [foldTypes, relationsMap]);

  // 添加仿真类型关联
  const handleAddSimType = async (foldTypeId: number, simTypeId: number, isDefault: number) => {
    try {
      await baseConfigApi.addSimTypeToFoldType(foldTypeId, { simTypeId, isDefault });
      await loadAllData();
      setShowAddModal(false);
      setEditingFoldTypeId(null);
    } catch (error) {
      console.error('添加仿真类型关联失败:', error);
      alert('添加失败');
    }
  };

  // 设置默认仿真类型
  const handleSetDefault = async (foldTypeId: number, simTypeId: number) => {
    try {
      await baseConfigApi.setDefaultSimTypeForFoldType(foldTypeId, simTypeId);
      await loadAllData();
    } catch (error) {
      console.error('设置默认仿真类型失败:', error);
      alert('设置失败');
    }
  };

  // 移除仿真类型关联
  const handleRemove = async (foldTypeId: number, simTypeId: number) => {
    if (!confirm('确定要移除此工况配置吗？')) return;
    try {
      await baseConfigApi.removeSimTypeFromFoldType(foldTypeId, simTypeId);
      await loadAllData();
    } catch (error) {
      console.error('移除仿真类型关联失败:', error);
      alert('移除失败');
    }
  };

  // 打开添加模态框
  const openAddModal = (foldTypeId: number) => {
    setEditingFoldTypeId(foldTypeId);
    setShowAddModal(true);
  };

  return (
    <Card>
      <div className="p-4 border-b dark:border-slate-700">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">工况管理</h3>
            <p className="text-sm text-slate-500 mt-1">
              管理目标姿态与仿真类型的配置关系，每个组合形成一个工况
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-slate-500">加载中...</div>
        ) : tableData.length === 0 ? (
          <div className="p-12 text-center text-slate-500">暂无工况配置</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 w-48">
                  目标姿态
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 w-48">
                  仿真类型
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 w-32">
                  默认
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 w-24">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {tableData.map((row, idx) => (
                <tr
                  key={`${row.foldType.id}-${row.simType?.simTypeId || 'empty'}-${idx}`}
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
                            {row.foldType.name}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {row.foldType.code || '无编码'} | 角度: {row.foldType.angle}°
                          </div>
                        </div>
                        <button
                          onClick={() => openAddModal(row.foldType.id)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="添加仿真类型"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    {row.simType ? (
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {row.simType.simTypeName}
                        </div>
                        <div className="text-xs text-slate-500">{row.simType.simTypeCode}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">未配置仿真类型</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.simType && (
                      <button
                        onClick={() => handleSetDefault(row.foldType.id, row.simType!.simTypeId)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          row.simType.isDefault === 1
                            ? 'text-yellow-500'
                            : 'text-slate-400 hover:text-yellow-500 hover:bg-slate-100 dark:hover:bg-slate-600'
                        }`}
                        title={row.simType.isDefault === 1 ? '已是默认' : '设为默认'}
                      >
                        {row.simType.isDefault === 1 ? (
                          <StarIconSolid className="w-5 h-5" />
                        ) : (
                          <StarIcon className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.simType && (
                      <button
                        onClick={() => handleRemove(row.foldType.id, row.simType!.simTypeId)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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

      {/* 添加仿真类型模态框 */}
      {showAddModal && editingFoldTypeId !== null && (
        <AddSimTypeModal
          foldTypeId={editingFoldTypeId}
          foldTypeName={foldTypes.find(ft => ft.id === editingFoldTypeId)?.name || ''}
          simTypes={allSimTypes}
          existingIds={new Set((relationsMap.get(editingFoldTypeId) || []).map(r => r.simTypeId))}
          onAdd={handleAddSimType}
          onClose={() => {
            setShowAddModal(false);
            setEditingFoldTypeId(null);
          }}
        />
      )}
    </Card>
  );
};

// 添加仿真类型模态框组件
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
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isDefault, setIsDefault] = useState(0);

  const availableSimTypes = simTypes.filter(st => !existingIds.has(st.id));

  const handleSubmit = () => {
    if (selectedId) {
      onAdd(foldTypeId, selectedId, isDefault);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="p-4 border-b dark:border-slate-700">
          <h3 className="text-lg font-bold">添加工况配置</h3>
          <p className="text-sm text-slate-500 mt-1">
            为{' '}
            <span className="font-medium text-slate-700 dark:text-slate-300">{foldTypeName}</span>{' '}
            添加仿真类型
          </p>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">选择仿真类型</label>
            {availableSimTypes.length === 0 ? (
              <p className="text-sm text-slate-500">所有仿真类型已配置</p>
            ) : (
              <select
                value={selectedId ?? ''}
                onChange={e => setSelectedId(e.target.value ? Number(e.target.value) : null)}
                className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
              >
                <option value="">请选择...</option>
                {availableSimTypes.map(st => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.code})
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
              onChange={e => setIsDefault(e.target.checked ? 1 : 0)}
              className="rounded"
            />
            <label htmlFor="isDefault" className="text-sm">
              设为默认仿真类型
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-4 border-t dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            添加
          </button>
        </div>
      </div>
    </div>
  );
};
