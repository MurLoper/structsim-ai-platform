import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { PlusIcon, TrashIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { configApi } from '@/api';
import type { ProjectSimTypeRel } from '@/types/configGroups';
import type { Project, SimType } from '@/types/config';

export const ProjectSimTypeManagement: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [simTypeRels, setSimTypeRels] = useState<ProjectSimTypeRel[]>([]);
  const [allSimTypes, setAllSimTypes] = useState<SimType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // 加载项目列表
  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await configApi.getProjects();
      setProjects(response.data || []);
    } catch (error) {
      console.error('加载项目失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载所有仿真类型
  const loadAllSimTypes = async () => {
    try {
      const response = await configApi.getSimTypes();
      setAllSimTypes(response.data || []);
    } catch (error) {
      console.error('加载仿真类型失败:', error);
    }
  };

  // 加载项目的仿真类型关联
  const loadProjectSimTypes = async (projectId: number) => {
    try {
      const response = await configApi.getProjectSimTypes(projectId);
      setSimTypeRels((response.data || []) as ProjectSimTypeRel[]);
    } catch (error) {
      console.error('加载项目仿真类型关联失败:', error);
    }
  };

  useEffect(() => {
    loadProjects();
    loadAllSimTypes();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadProjectSimTypes(selectedProject.id);
    }
  }, [selectedProject]);

  // 添加仿真类型关联
  const handleAddSimType = async (simTypeId: number, isDefault: number) => {
    if (!selectedProject) return;
    try {
      await configApi.addSimTypeToProject(selectedProject.id, { simTypeId, isDefault });
      loadProjectSimTypes(selectedProject.id);
      setShowAddModal(false);
    } catch (error) {
      console.error('添加仿真类型关联失败:', error);
      alert('添加失败');
    }
  };

  // 设置默认仿真类型
  const handleSetDefault = async (simTypeId: number) => {
    if (!selectedProject) return;
    try {
      await configApi.setDefaultSimType(selectedProject.id, simTypeId);
      loadProjectSimTypes(selectedProject.id);
    } catch (error) {
      console.error('设置默认仿真类型失败:', error);
      alert('设置失败');
    }
  };

  // 移除仿真类型关联
  const handleRemove = async (simTypeId: number) => {
    if (!selectedProject || !confirm('确定要移除此关联吗？')) return;
    try {
      await configApi.removeSimTypeFromProject(selectedProject.id, simTypeId);
      loadProjectSimTypes(selectedProject.id);
    } catch (error) {
      console.error('移除仿真类型关联失败:', error);
      alert('移除失败');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 左侧：项目列表 */}
      <Card>
        <div className="p-4 border-b dark:border-slate-700">
          <h3 className="text-lg font-semibold">项目列表</h3>
        </div>
        <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-slate-500">加载中...</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-slate-500">暂无项目</div>
          ) : (
            projects.map(project => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedProject?.id === project.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                    : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <div className="font-medium">{project.name}</div>
                <div className="text-xs text-slate-500 mt-1">{project.code || '无编码'}</div>
              </button>
            ))
          )}
        </div>
      </Card>

      {/* 右侧：仿真类型关联 */}
      <div className="lg:col-span-2">
        {!selectedProject ? (
          <Card>
            <div className="p-12 text-center text-slate-500">
              <p>请从左侧选择一个项目</p>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold">{selectedProject.name} - 仿真类型关联</h3>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                添加关联
              </button>
            </div>
            <div className="p-4">
              {simTypeRels.length === 0 ? (
                <div className="text-center py-12 text-slate-500">暂无关联的仿真类型</div>
              ) : (
                <div className="space-y-2">
                  {simTypeRels.map(rel => (
                    <div
                      key={rel.id}
                      className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg flex justify-between items-center"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{rel.simTypeName}</span>
                          {rel.isDefault === 1 && (
                            <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
                              默认
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          编码: {rel.simTypeCode || '无'} | 排序: {rel.sort}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSetDefault(rel.simTypeId)}
                          className={`p-2 rounded-lg transition-colors ${
                            rel.isDefault === 1
                              ? 'text-yellow-500'
                              : 'text-slate-400 hover:text-yellow-500 hover:bg-slate-100 dark:hover:bg-slate-600'
                          }`}
                          title={rel.isDefault === 1 ? '已是默认' : '设为默认'}
                        >
                          {rel.isDefault === 1 ? (
                            <StarIconSolid className="w-5 h-5" />
                          ) : (
                            <StarIcon className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleRemove(rel.simTypeId)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="移除关联"
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
      </div>

      {/* 添加仿真类型模态框 */}
      {showAddModal && selectedProject && (
        <AddSimTypeModal
          simTypes={allSimTypes}
          existingIds={new Set(simTypeRels.map(r => r.simTypeId))}
          onAdd={handleAddSimType}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};

// 添加仿真类型模态框组件
interface AddSimTypeModalProps {
  simTypes: SimType[];
  existingIds: Set<number>;
  onAdd: (simTypeId: number, isDefault: number) => void;
  onClose: () => void;
}

const AddSimTypeModal: React.FC<AddSimTypeModalProps> = ({
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
      onAdd(selectedId, isDefault);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="p-4 border-b dark:border-slate-700">
          <h3 className="text-lg font-bold">添加仿真类型关联</h3>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">选择仿真类型</label>
            <select
              value={selectedId || ''}
              onChange={e => setSelectedId(Number(e.target.value))}
              className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            >
              <option value="">请选择...</option>
              {availableSimTypes.map(st => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.code})
                </option>
              ))}
            </select>
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
