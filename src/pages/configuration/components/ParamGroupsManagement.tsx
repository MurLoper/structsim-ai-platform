import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Card, useToast, useConfirmDialog } from '@/components/ui';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Download,
  Upload,
  X,
  Check,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { configApi } from '@/api';
import { useFormState } from '@/hooks/useFormState';
import type { ParamGroup, ParamInGroup, SearchParamResult } from '@/types/configGroups';
import type { ParamDef } from '@/api';

interface TableRow {
  group: ParamGroup;
  param: ParamInGroup | null;
  rowSpan: number;
  isFirstRow: boolean;
}

export const ParamGroupsManagement: React.FC = () => {
  const [groups, setGroups] = useState<ParamGroup[]>([]);
  const [allParamDefs, setAllParamDefs] = useState<ParamDef[]>([]);
  const [projects, setProjects] = useState<Array<{ id: number; name: string }>>([]);
  const [groupParamsMap, setGroupParamsMap] = useState<Map<number, ParamInGroup[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProjectId, setFilterProjectId] = useState<number | ''>('');

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showParamModal, setShowParamModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Partial<ParamGroup> | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);

  const { showToast } = useToast();
  const { showConfirm, ConfirmDialogComponent } = useConfirmDialog();

  // 加载所有数据
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [groupsRes, paramDefsRes, projectsRes] = await Promise.all([
        configApi.getParamGroups(),
        configApi.getParamDefs(),
        configApi.getProjects(),
      ]);

      const groupsData = Array.isArray(groupsRes?.data) ? groupsRes.data : [];
      const paramDefsData = Array.isArray(paramDefsRes?.data) ? paramDefsRes.data : [];
      const projectsData = Array.isArray(projectsRes?.data) ? projectsRes.data : [];

      setGroups(groupsData);
      setAllParamDefs(paramDefsData);
      setProjects(projectsData.map(p => ({ id: p.id, name: p.name })));

      // 加载所有组合的参数
      const paramsMap = new Map<number, ParamInGroup[]>();
      await Promise.all(
        groupsData.map(async (group: ParamGroup) => {
          try {
            const res = await configApi.getParamGroupParams(group.id);
            paramsMap.set(group.id, Array.isArray(res?.data) ? res.data : []);
          } catch {
            paramsMap.set(group.id, []);
          }
        })
      );
      setGroupParamsMap(paramsMap);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // 计算表格数据：按组合分组，支持行合并 + 按项目/算法类型过滤
  const tableData = useMemo(() => {
    const rows: TableRow[] = [];
    const filteredGroups = groups.filter(g => {
      // 项目过滤
      if (filterProjectId !== '') {
        const ids = g.projectIds || [];
        if (filterProjectId === -1) {
          // 全局（未关联任何项目）
          if (ids.length > 0) return false;
        } else {
          // 关联了该项目 或 全局组合
          if (ids.length > 0 && !ids.includes(filterProjectId as number)) return false;
        }
      }
      // 关键词搜索
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const nameMatch = g.name.toLowerCase().includes(term);
        const paramMatch = (groupParamsMap.get(g.id) || []).some(
          p => p.paramName?.toLowerCase().includes(term) || p.paramKey?.toLowerCase().includes(term)
        );
        if (!nameMatch && !paramMatch) return false;
      }
      return true;
    });

    filteredGroups.forEach(group => {
      const params = groupParamsMap.get(group.id) || [];
      if (params.length === 0) {
        rows.push({ group, param: null, rowSpan: 1, isFirstRow: true });
      } else {
        const filteredParams = searchTerm
          ? params.filter(
              p =>
                p.paramName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.paramKey?.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : params;

        const displayParams = filteredParams.length > 0 ? filteredParams : params;
        displayParams.forEach((param, idx) => {
          rows.push({
            group,
            param,
            rowSpan: idx === 0 ? displayParams.length : 0,
            isFirstRow: idx === 0,
          });
        });
      }
    });

    return rows;
  }, [groups, groupParamsMap, searchTerm, filterProjectId]);

  // 创建/更新参数组合（支持默认值）
  const handleSaveGroup = async (
    data: Partial<ParamGroup>,
    paramConfigs: Array<{
      paramDefId: number;
      defaultValue?: string;
      minVal?: number;
      maxVal?: number;
      doeDefaultValue?: string;
      bayesianDefaultValue?: string;
      sort?: number;
    }>
  ) => {
    try {
      let groupId: number;
      if (editingGroup?.id) {
        await configApi.updateParamGroup(editingGroup.id, data);
        groupId = editingGroup.id;
      } else {
        const res = await configApi.createParamGroup(
          data as { name: string; description?: string; sort?: number }
        );
        groupId = (res?.data as { id: number })?.id || 0;
      }

      // 使用 replaceGroupParams 一次性替换所有参数（含默认值和算法配置）
      if (groupId && paramConfigs.length > 0) {
        await configApi.replaceGroupParams(
          groupId,
          paramConfigs.map((p, idx) => ({
            paramDefId: p.paramDefId,
            defaultValue: p.defaultValue || undefined,
            minVal: p.minVal,
            maxVal: p.maxVal,
            doeDefaultValue: p.doeDefaultValue || undefined,
            bayesianDefaultValue: p.bayesianDefaultValue || undefined,
            sort: p.sort ?? idx * 10,
          }))
        );
      } else if (groupId && paramConfigs.length === 0 && editingGroup?.id) {
        // 编辑模式下清空参数
        await configApi.clearGroupParams(groupId);
      }

      setShowGroupModal(false);
      setEditingGroup(null);
      await loadAllData();
      showToast('success', '保存成功');
    } catch (error: unknown) {
      console.error('保存参数组合失败:', error);
      const errMsg = (error as { message?: string })?.message || '保存失败';
      showToast('error', errMsg);
    }
  };

  // 删除参数组合
  const handleDeleteGroup = (id: number) => {
    const group = groups.find(g => g.id === id);
    showConfirm(
      '删除参数组合',
      `确定要删除「${group?.name}」吗？`,
      async () => {
        try {
          await configApi.deleteParamGroup(id);
          await loadAllData();
          showToast('success', '删除成功');
        } catch (error) {
          console.error('删除参数组合失败:', error);
          showToast('error', '删除失败');
        }
      },
      'danger'
    );
  };

  // 批量添加参数到组合
  const handleAddParams = async (groupId: number, paramDefIds: number[]) => {
    try {
      for (const paramDefId of paramDefIds) {
        await configApi.addParamToGroup(groupId, { paramDefId });
      }
      await loadAllData();
      setShowParamModal(false);
      setEditingGroupId(null);
      showToast('success', `成功添加 ${paramDefIds.length} 个参数`);
    } catch (error) {
      console.error('添加参数失败:', error);
      showToast('error', '添加失败');
    }
  };

  // 从组合移除参数
  const handleRemoveParam = (groupId: number, paramDefId: number) => {
    const params = groupParamsMap.get(groupId) || [];
    const param = params.find(p => p.paramDefId === paramDefId);
    showConfirm(
      '移除参数',
      `确定要移除「${param?.paramName || paramDefId}」吗？`,
      async () => {
        try {
          await configApi.removeParamFromGroup(groupId, paramDefId);
          await loadAllData();
          showToast('success', '移除成功');
        } catch (error) {
          console.error('移除参数失败:', error);
          showToast('error', '移除失败');
        }
      },
      'danger'
    );
  };

  // 清空组合的所有参数
  const handleClearParams = (groupId: number) => {
    const group = groups.find(g => g.id === groupId);
    const paramCount = groupParamsMap.get(groupId)?.length || 0;
    if (paramCount === 0) {
      showToast('warning', '该组合没有参数可清空');
      return;
    }
    showConfirm(
      '清空参数',
      `确定要清空「${group?.name}」的所有 ${paramCount} 个参数吗？`,
      async () => {
        try {
          await configApi.clearGroupParams(groupId);
          await loadAllData();
          showToast('success', '清空成功');
        } catch (error) {
          console.error('清空参数失败:', error);
          showToast('error', '清空失败');
        }
      },
      'warning'
    );
  };

  // 下载 Excel 模板
  const handleDownloadTemplate = () => {
    const headers = ['参数Key(必填)', '参数名称', '默认值', '下限', '上限', '单位'];
    const exampleRow = ['param_key_1', '参数名称示例', '0', '', '', 'mm'];
    const csvContent = [headers.join(','), exampleRow.join(',')].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '参数组合模板.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      {/* 头部 */}
      <div className="p-4 border-b dark:border-slate-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold">参数组合管理</h3>
            <p className="text-sm text-slate-500 mt-1">管理参数组合，支持批量添加参数和导入</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1 text-sm"
            >
              <Download className="w-4 h-4" />
              模板
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-3 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1 text-sm"
            >
              <Upload className="w-4 h-4" />
              导入
            </button>
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
        </div>
        {/* 搜索框 + 过滤器 */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索组合名称或参数..."
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
                onClick={() => setFilterProjectId('')}
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
          <div className="p-12 text-center text-slate-500">加载中...</div>
        ) : tableData.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            {searchTerm ? '未找到匹配的结果' : '暂无参数组合'}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 eyecare:text-foreground w-56">
                  组合名称
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 eyecare:text-foreground w-40">
                  参数 Key
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 eyecare:text-foreground w-40">
                  参数名称
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 eyecare:text-foreground w-24">
                  默认值
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 eyecare:text-foreground w-20">
                  单位
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 eyecare:text-foreground w-24">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {tableData.map((row, idx) => (
                <tr
                  key={`${row.group.id}-${row.param?.paramDefId || 'empty'}-${idx}`}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700 eyecare:hover:bg-muted/30"
                >
                  {row.rowSpan > 0 && (
                    <td
                      rowSpan={row.rowSpan}
                      className="px-4 py-3 align-top border-r dark:border-slate-700"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white eyecare:text-foreground flex items-center gap-2">
                            {row.group.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                              setShowParamModal(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                            title="添加参数"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleClearParams(row.group.id)}
                            className="p-1.5 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg"
                            title="清空参数"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingGroup(row.group);
                              setShowGroupModal(true);
                            }}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 eyecare:hover:bg-muted rounded-lg"
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
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    {row.param ? (
                      <span className="font-mono text-xs text-slate-600 dark:text-slate-400 eyecare:text-muted-foreground">
                        {row.param.paramKey}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-sm">未配置参数</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.param && (
                      <span className="text-slate-900 dark:text-white eyecare:text-foreground">
                        {row.param.paramName}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.param && (
                      <span className="text-slate-500">{row.param.defaultValue || '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.param && <span className="text-slate-500">{row.param.unit || '-'}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {row.param && (
                      <button
                        onClick={() => handleRemoveParam(row.group.id, row.param!.paramDefId)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                        title="移除"
                      >
                        <Trash2 className="w-4 h-4" />
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
          paramDefs={allParamDefs}
          projects={projects}
          existingParams={editingGroup?.id ? groupParamsMap.get(editingGroup.id) || [] : []}
          onSave={handleSaveGroup}
          onClose={() => {
            setShowGroupModal(false);
            setEditingGroup(null);
          }}
        />
      )}
      {showParamModal && editingGroupId !== null && (
        <AddParamsModal
          groupId={editingGroupId}
          groupName={groups.find(g => g.id === editingGroupId)?.name || ''}
          paramDefs={allParamDefs}
          existingParamIds={
            new Set((groupParamsMap.get(editingGroupId) || []).map(p => p.paramDefId))
          }
          onAdd={handleAddParams}
          onClose={() => {
            setShowParamModal(false);
            setEditingGroupId(null);
          }}
          onRefresh={loadAllData}
          showToast={showToast}
        />
      )}
      {showUploadModal && (
        <UploadExcelModal
          groups={groups}
          allParamDefs={allParamDefs}
          onSuccess={loadAllData}
          onClose={() => setShowUploadModal(false)}
        />
      )}
      <ConfirmDialogComponent />
    </Card>
  );
};

// 参数配置项（含默认值和算法相关配置）
interface ParamConfigItem {
  paramDefId: number;
  defaultValue: string;
  minVal: string;
  maxVal: string;
  doeDefaultValue: string;
  bayesianDefaultValue: string;
  sort: number;
}

// 组合编辑模态框组件（整合参数选择+默认值编辑）
const GroupModal: React.FC<{
  group: Partial<ParamGroup> | null;
  paramDefs: ParamDef[];
  projects: Array<{ id: number; name: string }>;
  existingParams?: ParamInGroup[];
  onSave: (
    data: Partial<ParamGroup>,
    paramConfigs: Array<{
      paramDefId: number;
      defaultValue?: string;
      minVal?: number;
      maxVal?: number;
      doeDefaultValue?: string;
      bayesianDefaultValue?: string;
      sort?: number;
    }>
  ) => void;
  onClose: () => void;
}> = ({ group, paramDefs, projects, existingParams = [], onSave, onClose }) => {
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
  const [searchTerm, setSearchTerm] = useState('');

  // 已选参数配置列表（有序，含默认值）
  const [paramConfigs, setParamConfigs] = useState<ParamConfigItem[]>(() =>
    existingParams.map((p, idx) => ({
      paramDefId: p.paramDefId,
      defaultValue: p.defaultValue || '',
      minVal: p.minVal != null ? String(p.minVal) : '',
      maxVal: p.maxVal != null ? String(p.maxVal) : '',
      doeDefaultValue: p.doeDefaultValue || '',
      bayesianDefaultValue: p.bayesianDefaultValue || '',
      sort: p.sort ?? idx * 10,
    }))
  );

  // 已选的 paramDefId 集合（快速查找）
  const selectedIdSet = useMemo(() => new Set(paramConfigs.map(p => p.paramDefId)), [paramConfigs]);

  // 可供添加的参数（未选中的，按搜索过滤）
  const availableParams = useMemo(() => {
    return paramDefs.filter(
      p =>
        !selectedIdSet.has(p.id) &&
        (!searchTerm ||
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.key.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [paramDefs, selectedIdSet, searchTerm]);

  // 添加参数
  const addParam = (paramDefId: number) => {
    const paramDef = paramDefs.find(p => p.id === paramDefId);
    setParamConfigs(prev => [
      ...prev,
      {
        paramDefId,
        defaultValue: paramDef?.defaultVal || '',
        minVal: paramDef?.minVal != null ? String(paramDef.minVal) : '',
        maxVal: paramDef?.maxVal != null ? String(paramDef.maxVal) : '',
        doeDefaultValue: '',
        bayesianDefaultValue: '',
        sort: (prev.length + 1) * 10,
      },
    ]);
  };

  // 移除参数
  const removeParam = (paramDefId: number) => {
    setParamConfigs(prev => prev.filter(p => p.paramDefId !== paramDefId));
  };

  // 更新参数配置字段（通用）
  const updateParamField = (paramDefId: number, field: keyof ParamConfigItem, value: string) => {
    setParamConfigs(prev =>
      prev.map(p => (p.paramDefId === paramDefId ? { ...p, [field]: value } : p))
    );
  };

  // 查找参数定义
  const getParamDef = (paramDefId: number) => paramDefs.find(p => p.id === paramDefId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 eyecare:bg-card rounded-lg p-6 w-full max-w-3xl max-h-[90vh] flex flex-col">
        <h3 className="text-lg font-semibold mb-4">{group?.id ? '编辑' : '创建'}参数组合</h3>
        <div className="space-y-4 overflow-y-auto flex-1">
          {/* 基本信息 */}
          <div>
            <label className="block text-sm font-medium mb-1">名称 *</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={e => updateField('name', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 eyecare:bg-card dark:border-slate-600 eyecare:border-border"
              placeholder="输入组合名称"
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                关联项目（可多选，不选=全局）
              </label>
              <div className="border rounded-lg dark:border-slate-600 max-h-[120px] overflow-y-auto p-2 space-y-1">
                {projects.length === 0 ? (
                  <span className="text-xs text-slate-400">暂无项目</span>
                ) : (
                  projects.map(p => (
                    <label
                      key={p.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 px-1 py-0.5 rounded text-sm"
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
            <div>
              <label className="block text-sm font-medium mb-1">排序</label>
              <input
                type="number"
                value={formData.sort ?? 100}
                onChange={e => updateField('sort', Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 eyecare:bg-card dark:border-slate-600 eyecare:border-border"
              />
            </div>
          </div>

          {/* 已选参数表格 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">已选参数</label>
              <span className="text-xs text-slate-500">{paramConfigs.length} 个参数</span>
            </div>
            {paramConfigs.length > 0 ? (
              <div className="border rounded-lg dark:border-slate-600 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700 text-xs uppercase">
                    <tr>
                      <th className="px-2 py-2 text-left">参数名</th>
                      <th className="px-2 py-2 text-left">Key</th>
                      <th className="px-2 py-2 text-left">单位</th>
                      <th className="px-2 py-2 text-left">下限</th>
                      <th className="px-2 py-2 text-left">上限</th>
                      <th className="px-2 py-2 text-left">默认值</th>
                      <th className="px-2 py-2 text-left">DOE默认</th>
                      <th className="px-2 py-2 text-left">贝叶斯默认</th>
                      <th className="px-2 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-600">
                    {paramConfigs.map(pc => {
                      const def = getParamDef(pc.paramDefId);
                      const inputCls =
                        'w-full px-1.5 py-1 text-xs border rounded dark:bg-slate-600 dark:border-slate-500 eyecare:bg-card eyecare:border-border';
                      return (
                        <tr
                          key={pc.paramDefId}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        >
                          <td className="px-2 py-1.5 font-medium text-xs">{def?.name || '-'}</td>
                          <td className="px-2 py-1.5 font-mono text-xs text-slate-500">
                            {def?.key || '-'}
                          </td>
                          <td className="px-2 py-1.5 text-slate-400 text-xs">{def?.unit || '-'}</td>
                          <td className="px-2 py-1">
                            <input
                              type="text"
                              value={pc.minVal}
                              onChange={e =>
                                updateParamField(pc.paramDefId, 'minVal', e.target.value)
                              }
                              placeholder={def?.minVal != null ? String(def.minVal) : '-'}
                              className={inputCls}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="text"
                              value={pc.maxVal}
                              onChange={e =>
                                updateParamField(pc.paramDefId, 'maxVal', e.target.value)
                              }
                              placeholder={def?.maxVal != null ? String(def.maxVal) : '-'}
                              className={inputCls}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="text"
                              value={pc.defaultValue}
                              onChange={e =>
                                updateParamField(pc.paramDefId, 'defaultValue', e.target.value)
                              }
                              placeholder={def?.defaultVal || '无'}
                              className={inputCls}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="text"
                              value={pc.doeDefaultValue}
                              onChange={e =>
                                updateParamField(pc.paramDefId, 'doeDefaultValue', e.target.value)
                              }
                              placeholder="留空"
                              className={inputCls}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="text"
                              value={pc.bayesianDefaultValue}
                              onChange={e =>
                                updateParamField(
                                  pc.paramDefId,
                                  'bayesianDefaultValue',
                                  e.target.value
                                )
                              }
                              placeholder="留空"
                              className={inputCls}
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <button
                              onClick={() => removeParam(pc.paramDefId)}
                              className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border rounded-lg dark:border-slate-600 p-4 text-center text-slate-400 text-sm">
                尚未选择参数，请从下方列表添加
              </div>
            )}
          </div>

          {/* 添加参数区域 */}
          <div>
            <label className="block text-sm font-medium mb-2">添加参数</label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索参数名或Key..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-slate-700 eyecare:bg-card dark:border-slate-600 eyecare:border-border"
              />
            </div>
            <div className="border rounded-lg dark:border-slate-600 max-h-[200px] overflow-y-auto">
              {availableParams.length === 0 ? (
                <div className="px-3 py-4 text-center text-slate-400 text-sm">
                  {searchTerm
                    ? '未找到匹配参数'
                    : paramDefs.length === 0
                      ? '暂无参数定义，请先在「参数定义」中创建参数'
                      : '所有参数已添加'}
                </div>
              ) : (
                availableParams.map(param => (
                  <button
                    key={param.id}
                    onClick={() => addParam(param.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b last:border-b-0 dark:border-slate-600 text-left transition-colors"
                  >
                    <Plus className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{param.name}</div>
                      <div className="text-xs text-slate-500">{param.key}</div>
                    </div>
                    {param.unit && (
                      <span className="text-xs text-slate-400 flex-shrink-0">{param.unit}</span>
                    )}
                    {(param.minVal != null || param.maxVal != null) && (
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        [{param.minVal ?? '−∞'}, {param.maxVal ?? '+∞'}]
                      </span>
                    )}
                    {param.defaultVal && (
                      <span className="text-xs text-blue-400 flex-shrink-0">
                        默认: {param.defaultVal}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={() =>
              onSave(
                formData,
                paramConfigs.map(p => ({
                  paramDefId: p.paramDefId,
                  defaultValue: p.defaultValue || undefined,
                  minVal: p.minVal ? Number(p.minVal) : undefined,
                  maxVal: p.maxVal ? Number(p.maxVal) : undefined,
                  doeDefaultValue: p.doeDefaultValue || undefined,
                  bayesianDefaultValue: p.bayesianDefaultValue || undefined,
                  sort: p.sort,
                }))
              )
            }
            disabled={!formData.name?.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

// 添加参数模态框组件（支持多选和快速创建）
const AddParamsModal: React.FC<{
  groupId: number;
  groupName: string;
  paramDefs: ParamDef[];
  existingParamIds: Set<number>;
  onAdd: (groupId: number, paramDefIds: number[]) => void;
  onClose: () => void;
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}> = ({
  groupId,
  groupName,
  paramDefs,
  existingParamIds,
  onAdd,
  onClose,
  onRefresh,
  showToast,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchParamResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newParamData, setNewParamData] = useState({ key: '', name: '', unit: '' });
  const [creating, setCreating] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 本地过滤的可用参数
  const availableParams = paramDefs.filter(p => !existingParamIds.has(p.id));
  const filteredParams = availableParams.filter(
    p =>
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 搜索参数（调用后端API）
  const handleSearch = useCallback(
    async (keyword: string) => {
      if (!keyword.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await configApi.searchParams(keyword, groupId);
        setSearchResults(res?.data?.params || []);
      } catch (error) {
        console.error('搜索参数失败:', error);
      } finally {
        setIsSearching(false);
      }
    },
    [groupId]
  );

  // 防抖搜索
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (searchTerm.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch(searchTerm);
      }, 300);
    } else {
      setSearchResults([]);
    }
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, handleSearch]);

  const toggleParam = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredParams.map(p => p.id)));
  };

  const clearAll = () => {
    setSelectedIds(new Set());
  };

  // 快速创建并添加参数
  const handleCreateAndAdd = async () => {
    if (!newParamData.key.trim()) {
      showToast('warning', '参数Key不能为空');
      return;
    }
    setCreating(true);
    try {
      const res = await configApi.createAndAddParam(groupId, {
        key: newParamData.key.trim(),
        name: newParamData.name.trim() || newParamData.key.trim(),
        unit: newParamData.unit.trim() || undefined,
      });
      if (res?.data?.added) {
        showToast(
          'success',
          `参数「${res.data.param.paramName}」${res.data.created ? '创建并' : ''}添加成功`
        );
        setNewParamData({ key: '', name: '', unit: '' });
        setShowCreateForm(false);
        // 刷新数据后重新搜索以更新列表
        await onRefresh();
        if (searchTerm.trim().length >= 2) {
          handleSearch(searchTerm);
        }
      } else if (res?.data?.reason) {
        showToast('warning', res.data.reason);
      }
    } catch (error: unknown) {
      console.error('创建参数失败:', error);
      const errMsg = (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      showToast('error', errMsg || '创建失败');
    } finally {
      setCreating(false);
    }
  };

  // 显示的参数列表：优先显示搜索结果
  const displayParams =
    searchTerm.trim().length >= 2 && searchResults.length > 0
      ? searchResults.filter(p => !p.inGroup)
      : filteredParams;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 eyecare:bg-card rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        <div className="p-4 border-b dark:border-slate-700">
          <h3 className="text-lg font-bold">添加参数到 {groupName}</h3>
          <p className="text-sm text-slate-500 mt-1">选择要添加的参数，或快速创建新参数</p>
        </div>

        {/* 搜索和操作 */}
        <div className="p-4 border-b dark:border-slate-700 space-y-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索参数名称或 Key（输入2个字符开始搜索）..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-700 eyecare:bg-card dark:border-slate-600 eyecare:border-border"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">已选择 {selectedIds.size} 个参数</span>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-blue-600 hover:underline">
                全选
              </button>
              <button onClick={clearAll} className="text-slate-500 hover:underline">
                清空
              </button>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="text-green-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                快速创建
              </button>
            </div>
          </div>
        </div>

        {/* 快速创建表单 */}
        {showCreateForm && (
          <div className="p-4 border-b dark:border-slate-700 bg-green-50 dark:bg-green-900/20">
            <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-3">
              快速创建新参数
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="参数Key *"
                value={newParamData.key}
                onChange={e => setNewParamData(prev => ({ ...prev, key: e.target.value }))}
                className="px-2 py-1.5 text-sm border rounded dark:bg-slate-700 eyecare:bg-card dark:border-slate-600 eyecare:border-border"
              />
              <input
                type="text"
                placeholder="参数名称"
                value={newParamData.name}
                onChange={e => setNewParamData(prev => ({ ...prev, name: e.target.value }))}
                className="px-2 py-1.5 text-sm border rounded dark:bg-slate-700 eyecare:bg-card dark:border-slate-600 eyecare:border-border"
              />
              <input
                type="text"
                placeholder="单位"
                value={newParamData.unit}
                onChange={e => setNewParamData(prev => ({ ...prev, unit: e.target.value }))}
                className="px-2 py-1.5 text-sm border rounded dark:bg-slate-700 eyecare:bg-card dark:border-slate-600 eyecare:border-border"
              />
            </div>
            <div className="flex justify-end mt-2">
              <button
                onClick={handleCreateAndAdd}
                disabled={creating || !newParamData.key.trim()}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {creating ? '创建中...' : '创建并添加'}
              </button>
            </div>
          </div>
        )}

        {/* 参数列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {displayParams.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {searchTerm ? (
                <div>
                  <p>未找到匹配的参数</p>
                  <button
                    onClick={() => {
                      setNewParamData(prev => ({ ...prev, key: searchTerm }));
                      setShowCreateForm(true);
                    }}
                    className="mt-2 text-green-600 hover:underline"
                  >
                    点击创建「{searchTerm}」
                  </button>
                </div>
              ) : (
                '没有可添加的参数'
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {displayParams.map(param => {
                const paramId = 'paramDefId' in param ? param.paramDefId : (param as ParamDef).id;
                const paramName = 'paramName' in param ? param.paramName : (param as ParamDef).name;
                const paramKey = 'paramKey' in param ? param.paramKey : (param as ParamDef).key;
                return (
                  <label
                    key={paramId}
                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedIds.has(paramId)
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                        : 'bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 eyecare:hover:bg-muted border-2 border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(paramId)}
                      onChange={() => toggleParam(paramId)}
                      className="rounded mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{paramName}</div>
                      <div className="text-xs text-slate-500 font-mono">{paramKey}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3 p-4 border-t dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 dark:text-slate-300 eyecare:text-foreground hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
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
  groups: ParamGroup[];
  allParamDefs: ParamDef[];
  onSuccess: () => void;
  onClose: () => void;
}> = ({ groups, allParamDefs, onSuccess, onClose }) => {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedParam[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  interface ParsedParam {
    key: string;
    name: string;
    defaultValue: string;
    minValue: string;
    maxValue: string;
    unit: string;
    exists: boolean;
    paramDefId?: number;
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
      alert('文件格式错误，至少需要标题行和一行数据');
      return;
    }

    const dataLines = lines.slice(1);
    const parsed: ParsedParam[] = dataLines
      .map(line => {
        const cols = line.split(',').map(c => c.trim());
        const key = cols[0] || '';
        const existingParam = allParamDefs.find(p => p.key === key);
        return {
          key,
          name: cols[1] || '',
          defaultValue: cols[2] || '',
          minValue: cols[3] || '',
          maxValue: cols[4] || '',
          unit: cols[5] || '',
          exists: !!existingParam,
          paramDefId: existingParam?.id,
        };
      })
      .filter(p => p.key);

    setParsedData(parsed);
  };

  const handleUpload = async () => {
    if (!selectedGroupId || parsedData.length === 0) return;
    setUploading(true);
    try {
      for (const param of parsedData) {
        if (!param.exists) {
          const res = await configApi.createParamDef({
            key: param.key,
            name: param.name || param.key,
            defaultVal: param.defaultValue || undefined,
            unit: param.unit || undefined,
          });
          param.paramDefId = res.data?.id;
        }
      }

      for (const param of parsedData) {
        if (param.paramDefId) {
          await configApi.addParamToGroup(selectedGroupId, { paramDefId: param.paramDefId });
        }
      }

      alert('导入成功');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('导入失败:', error);
      alert('导入失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 eyecare:bg-card rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        <div className="p-4 border-b dark:border-slate-700">
          <h3 className="text-lg font-bold">导入参数组合</h3>
          <p className="text-sm text-slate-500 mt-1">上传 CSV 文件，自动识别并创建参数</p>
        </div>

        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-2">选择目标组合</label>
            <select
              value={selectedGroupId ?? ''}
              onChange={e => setSelectedGroupId(e.target.value ? Number(e.target.value) : null)}
              className="w-full p-2 border rounded-lg dark:bg-slate-700 eyecare:bg-card dark:border-slate-600 eyecare:border-border"
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
              className="w-full p-4 border-2 border-dashed rounded-lg text-center hover:bg-slate-50 dark:hover:bg-slate-700 eyecare:hover:bg-muted"
            >
              {file ? file.name : '点击选择文件 (CSV)'}
            </button>
          </div>

          {parsedData.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">
                预览 ({parsedData.length} 个参数)
              </label>
              <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-3 py-2 text-left">Key</th>
                      <th className="px-3 py-2 text-left">名称</th>
                      <th className="px-3 py-2 text-left">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-700">
                    {parsedData.map((p, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-mono text-xs">{p.key}</td>
                        <td className="px-3 py-2">{p.name || '-'}</td>
                        <td className="px-3 py-2">
                          {p.exists ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <Check className="w-4 h-4" /> 已存在
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
            className="px-4 py-2 text-slate-700 dark:text-slate-300 eyecare:text-foreground hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
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
