import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui';
import { PlusIcon, TrashIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { configApi } from '@/api';
import { useFormState } from '@/hooks/useFormState';
import type {
  SimTypeParamGroupRel,
  SimTypeOutputGroupRel,
  SimTypeSolverRel,
} from '@/types/configGroups';
import type { SimType, ParamGroup, OutputGroup, Solver } from '@/types/configGroups';

export const ConfigRelationsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'paramGroups' | 'outputGroups' | 'solvers'>(
    'paramGroups'
  );
  const [simTypes, setSimTypes] = useState<SimType[]>([]);
  const [selectedSimType, setSelectedSimType] = useState<SimType | null>(null);
  const [loading, setLoading] = useState(false);

  // 参数组合相关
  const [paramGroupRels, setParamGroupRels] = useState<SimTypeParamGroupRel[]>([]);
  const [allParamGroups, setAllParamGroups] = useState<ParamGroup[]>([]);
  const [showAddParamGroupModal, setShowAddParamGroupModal] = useState(false);

  // 输出组合相关
  const [outputGroupRels, setOutputGroupRels] = useState<SimTypeOutputGroupRel[]>([]);
  const [allOutputGroups, setAllOutputGroups] = useState<OutputGroup[]>([]);
  const [showAddOutputGroupModal, setShowAddOutputGroupModal] = useState(false);

  // 求解器相关
  const [solverRels, setSolverRels] = useState<SimTypeSolverRel[]>([]);
  const [allSolvers, setAllSolvers] = useState<Solver[]>([]);
  const [showAddSolverModal, setShowAddSolverModal] = useState(false);

  // 加载仿真类型列表
  const loadSimTypes = async () => {
    try {
      setLoading(true);
      const response = await configApi.getSimTypes();
      setSimTypes(response.data || []);
    } catch (error) {
      console.error('加载仿真类型失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载所有可用的配置
  const loadAllConfigs = async () => {
    try {
      const [paramGroupsRes, outputGroupsRes, solversRes] = await Promise.all([
        configApi.getParamGroups(),
        configApi.getOutputGroups(),
        configApi.getSolvers(),
      ]);
      setAllParamGroups((paramGroupsRes.data || []) as ParamGroup[]);
      setAllOutputGroups((outputGroupsRes.data || []) as OutputGroup[]);
      setAllSolvers((solversRes.data || []) as Solver[]);
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };

  // 加载仿真类型的关联配置
  const loadSimTypeRelations = async (simTypeId: number) => {
    try {
      if (activeTab === 'paramGroups') {
        const response = await configApi.getSimTypeParamGroups(simTypeId);
        setParamGroupRels((response.data || []) as SimTypeParamGroupRel[]);
      } else if (activeTab === 'outputGroups') {
        const response = await configApi.getSimTypeOutputGroups(simTypeId);
        setOutputGroupRels((response.data || []) as SimTypeOutputGroupRel[]);
      } else if (activeTab === 'solvers') {
        const response = await configApi.getSimTypeSolvers(simTypeId);
        setSolverRels((response.data || []) as SimTypeSolverRel[]);
      }
    } catch (error) {
      console.error('加载关联配置失败:', error);
    }
  };

  useEffect(() => {
    loadSimTypes();
    loadAllConfigs();
  }, []);

  useEffect(() => {
    if (selectedSimType) {
      loadSimTypeRelations(selectedSimType.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSimType, activeTab]);

  // 添加参数组合关联
  const handleAddParamGroup = async (paramGroupId: number, isDefault: number) => {
    if (!selectedSimType) return;
    try {
      await configApi.addParamGroupToSimType(selectedSimType.id, { paramGroupId, isDefault });
      loadSimTypeRelations(selectedSimType.id);
      setShowAddParamGroupModal(false);
    } catch (error) {
      console.error('添加参数组合关联失败:', error);
    }
  };

  // 设置默认参数组合
  const handleSetDefaultParamGroup = async (paramGroupId: number) => {
    if (!selectedSimType) return;
    try {
      await configApi.setDefaultParamGroup(selectedSimType.id, paramGroupId);
      loadSimTypeRelations(selectedSimType.id);
    } catch (error) {
      console.error('设置默认参数组合失败:', error);
    }
  };

  // 移除参数组合关联
  const handleRemoveParamGroup = async (paramGroupId: number) => {
    if (!selectedSimType) return;
    if (!confirm('确定要移除这个参数组合关联吗？')) return;
    try {
      await configApi.removeParamGroupFromSimType(selectedSimType.id, paramGroupId);
      loadSimTypeRelations(selectedSimType.id);
    } catch (error) {
      console.error('移除参数组合关联失败:', error);
    }
  };

  // 添加输出组合关联
  const handleAddOutputGroup = async (outputGroupId: number, isDefault: number) => {
    if (!selectedSimType) return;
    try {
      await configApi.addOutputGroupToSimType(selectedSimType.id, { outputGroupId, isDefault });
      loadSimTypeRelations(selectedSimType.id);
      setShowAddOutputGroupModal(false);
    } catch (error) {
      console.error('添加输出组合关联失败:', error);
    }
  };

  // 设置默认输出组合
  const handleSetDefaultOutputGroup = async (outputGroupId: number) => {
    if (!selectedSimType) return;
    try {
      await configApi.setDefaultOutputGroup(selectedSimType.id, outputGroupId);
      loadSimTypeRelations(selectedSimType.id);
    } catch (error) {
      console.error('设置默认输出组合失败:', error);
    }
  };

  // 移除输出组合关联
  const handleRemoveOutputGroup = async (outputGroupId: number) => {
    if (!selectedSimType) return;
    if (!confirm('确定要移除这个输出组合关联吗？')) return;
    try {
      await configApi.removeOutputGroupFromSimType(selectedSimType.id, outputGroupId);
      loadSimTypeRelations(selectedSimType.id);
    } catch (error) {
      console.error('移除输出组合关联失败:', error);
    }
  };

  // 添加求解器关联
  const handleAddSolver = async (solverId: number, isDefault: number) => {
    if (!selectedSimType) return;
    try {
      await configApi.addSolverToSimType(selectedSimType.id, { solverId, isDefault });
      loadSimTypeRelations(selectedSimType.id);
      setShowAddSolverModal(false);
    } catch (error) {
      console.error('添加求解器关联失败:', error);
    }
  };

  // 设置默认求解器
  const handleSetDefaultSolver = async (solverId: number) => {
    if (!selectedSimType) return;
    try {
      await configApi.setDefaultSolver(selectedSimType.id, solverId);
      loadSimTypeRelations(selectedSimType.id);
    } catch (error) {
      console.error('设置默认求解器失败:', error);
    }
  };

  // 移除求解器关联
  const handleRemoveSolver = async (solverId: number) => {
    if (!selectedSimType) return;
    if (!confirm('确定要移除这个求解器关联吗？')) return;
    try {
      await configApi.removeSolverFromSimType(selectedSimType.id, solverId);
      loadSimTypeRelations(selectedSimType.id);
    } catch (error) {
      console.error('移除求解器关联失败:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* 左侧：仿真类型列表 */}
      <div className="lg:col-span-1">
        <Card>
          <div className="p-4 border-b dark:border-slate-700">
            <h3 className="text-lg font-semibold">仿真类型</h3>
          </div>
          <div className="p-4 space-y-2">
            {loading ? (
              <div className="text-center py-8 text-slate-500">加载中...</div>
            ) : simTypes.length === 0 ? (
              <div className="text-center py-8 text-slate-500">暂无仿真类型</div>
            ) : (
              simTypes.map(simType => (
                <div
                  key={simType.id}
                  onClick={() => setSelectedSimType(simType)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedSimType?.id === simType.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                      : 'bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600'
                  }`}
                >
                  <div className="font-medium text-slate-900 dark:text-white">{simType.name}</div>
                  <div className="text-sm text-slate-500 mt-1">
                    {simType.code} | {simType.category}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* 右侧：关联配置 */}
      <div className="lg:col-span-3">
        {!selectedSimType ? (
          <Card>
            <div className="p-12 text-center text-slate-500">请从左侧选择一个仿真类型</div>
          </Card>
        ) : (
          <>
            {/* 标签页 */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('paramGroups')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'paramGroups'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                参数组合
              </button>
              <button
                onClick={() => setActiveTab('outputGroups')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'outputGroups'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                输出组合
              </button>
              <button
                onClick={() => setActiveTab('solvers')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'solvers'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                求解器
              </button>
            </div>

            {/* 参数组合关联 */}
            {activeTab === 'paramGroups' && (
              <Card>
                <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{selectedSimType.name} - 参数组合关联</h3>
                  <button
                    onClick={() => setShowAddParamGroupModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    添加关联
                  </button>
                </div>
                <div className="p-4">
                  {paramGroupRels.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">暂无关联的参数组合</div>
                  ) : (
                    <div className="space-y-2">
                      {paramGroupRels.map(rel => (
                        <div
                          key={rel.id}
                          className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg flex justify-between items-center"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{rel.paramGroupName}</span>
                              {rel.isDefault === 1 && (
                                <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded">
                                  默认
                                </span>
                              )}
                            </div>
                            {rel.paramGroupDescription && (
                              <div className="text-sm text-slate-500 mt-1">
                                {rel.paramGroupDescription}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSetDefaultParamGroup(rel.paramGroupId)}
                              disabled={rel.isDefault === 1}
                              className={`p-2 rounded transition-colors ${
                                rel.isDefault === 1
                                  ? 'text-yellow-500 cursor-not-allowed'
                                  : 'text-slate-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'
                              }`}
                              title="设为默认"
                            >
                              {rel.isDefault === 1 ? (
                                <StarIconSolid className="w-5 h-5" />
                              ) : (
                                <StarIcon className="w-5 h-5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleRemoveParamGroup(rel.paramGroupId)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* 输出组合关联 */}
            {activeTab === 'outputGroups' && (
              <Card>
                <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{selectedSimType.name} - 输出组合关联</h3>
                  <button
                    onClick={() => setShowAddOutputGroupModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    添加关联
                  </button>
                </div>
                <div className="p-4">
                  {outputGroupRels.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">暂无关联的输出组合</div>
                  ) : (
                    <div className="space-y-2">
                      {outputGroupRels.map(rel => (
                        <div
                          key={rel.id}
                          className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg flex justify-between items-center"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{rel.outputGroupName}</span>
                              {rel.isDefault === 1 && (
                                <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded">
                                  默认
                                </span>
                              )}
                            </div>
                            {rel.outputGroupDescription && (
                              <div className="text-sm text-slate-500 mt-1">
                                {rel.outputGroupDescription}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSetDefaultOutputGroup(rel.outputGroupId)}
                              disabled={rel.isDefault === 1}
                              className={`p-2 rounded transition-colors ${
                                rel.isDefault === 1
                                  ? 'text-yellow-500 cursor-not-allowed'
                                  : 'text-slate-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'
                              }`}
                              title="设为默认"
                            >
                              {rel.isDefault === 1 ? (
                                <StarIconSolid className="w-5 h-5" />
                              ) : (
                                <StarIcon className="w-5 h-5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleRemoveOutputGroup(rel.outputGroupId)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* 求解器关联 */}
            {activeTab === 'solvers' && (
              <Card>
                <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{selectedSimType.name} - 求解器关联</h3>
                  <button
                    onClick={() => setShowAddSolverModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    添加关联
                  </button>
                </div>
                <div className="p-4">
                  {solverRels.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">暂无关联的求解器</div>
                  ) : (
                    <div className="space-y-2">
                      {solverRels.map(rel => (
                        <div
                          key={rel.id}
                          className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg flex justify-between items-center"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{rel.solverName}</span>
                              {rel.isDefault === 1 && (
                                <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded">
                                  默认
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-slate-500 mt-1">
                              {rel.solverCode} | v{rel.solverVersion}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSetDefaultSolver(rel.solverId)}
                              disabled={rel.isDefault === 1}
                              className={`p-2 rounded transition-colors ${
                                rel.isDefault === 1
                                  ? 'text-yellow-500 cursor-not-allowed'
                                  : 'text-slate-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'
                              }`}
                              title="设为默认"
                            >
                              {rel.isDefault === 1 ? (
                                <StarIconSolid className="w-5 h-5" />
                              ) : (
                                <StarIcon className="w-5 h-5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleRemoveSolver(rel.solverId)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      {/* 添加参数组合关联模态框 */}
      {showAddParamGroupModal && selectedSimType && (
        <AddRelationModal
          title="添加参数组合关联"
          items={allParamGroups}
          existingIds={new Set(paramGroupRels.map(r => r.paramGroupId))}
          onAdd={handleAddParamGroup}
          onClose={() => setShowAddParamGroupModal(false)}
          getItemLabel={item => item.name}
          getItemSubLabel={item => item.description}
        />
      )}

      {/* 添加输出组合关联模态框 */}
      {showAddOutputGroupModal && selectedSimType && (
        <AddRelationModal
          title="添加输出组合关联"
          items={allOutputGroups}
          existingIds={new Set(outputGroupRels.map(r => r.outputGroupId))}
          onAdd={handleAddOutputGroup}
          onClose={() => setShowAddOutputGroupModal(false)}
          getItemLabel={item => item.name}
          getItemSubLabel={item => item.description}
        />
      )}

      {/* 添加求解器关联模态框 */}
      {showAddSolverModal && selectedSimType && (
        <AddRelationModal
          title="添加求解器关联"
          items={allSolvers}
          existingIds={new Set(solverRels.map(r => r.solverId))}
          onAdd={handleAddSolver}
          onClose={() => setShowAddSolverModal(false)}
          getItemLabel={item => item.name}
          getItemSubLabel={item => `${item.code} | v${item.version}`}
        />
      )}
    </div>
  );
};

// 通用添加关联模态框
interface RelationItem {
  id: number;
  name?: string;
  code?: string;
  description?: string;
  version?: string;
}

const AddRelationModal: React.FC<{
  title: string;
  items: RelationItem[];
  existingIds: Set<number>;
  onAdd: (itemId: number, isDefault: number) => void;
  onClose: () => void;
  getItemLabel: (item: RelationItem) => string | undefined;
  getItemSubLabel?: (item: RelationItem) => string | undefined;
}> = ({ title, items, existingIds, onAdd, onClose, getItemLabel, getItemSubLabel }) => {
  const initialData = useMemo(
    () => ({
      selectedId: null as number | null,
      isDefault: 0,
    }),
    []
  );

  const { formData, updateField } = useFormState(initialData);

  const availableItems = items.filter(item => !existingIds.has(item.id));
  const selectedId = formData.selectedId ?? null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">选择配置</label>
            <select
              value={selectedId ?? ''}
              onChange={e =>
                updateField(
                  'selectedId',
                  e.target.value ? Number(e.target.value) : (null as number | null)
                )
              }
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            >
              <option value="">请选择</option>
              {availableItems.map(item => (
                <option key={item.id} value={item.id}>
                  {getItemLabel(item)}
                  {getItemSubLabel && getItemSubLabel(item) ? ` - ${getItemSubLabel(item)}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={(formData.isDefault ?? 0) === 1}
              onChange={e => updateField('isDefault', e.target.checked ? 1 : 0)}
              className="rounded"
            />
            <label htmlFor="isDefault" className="text-sm">
              设为默认
            </label>
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
            onClick={() => selectedId && onAdd(selectedId, formData.isDefault ?? 0)}
            disabled={!selectedId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            添加
          </button>
        </div>
      </div>
    </div>
  );
};
