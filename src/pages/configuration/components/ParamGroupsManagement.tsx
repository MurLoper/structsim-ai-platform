import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, useToast, useConfirmDialog } from '@/components/ui';
import { Plus, Pencil, Trash2, Search, Download, X, RefreshCw, Filter } from 'lucide-react';
import { configApi } from '@/api';
import type { ParamGroup, ParamInGroup } from '@/types/configGroups';
import type { ParamDef } from '@/api';
import {
  managementFieldClass,
  managementPrimaryButtonClass,
  managementSearchInputClass,
} from './sharedManagementStyles';
import { ParamGroupFormModal } from './paramGroups/ParamGroupFormModal';
import { AddParamsModal } from './paramGroups/AddParamsModal';

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
  const [editingGroup, setEditingGroup] = useState<Partial<ParamGroup> | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const initializedRef = useRef(false);

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
    if (initializedRef.current) return;
    initializedRef.current = true;
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
      enumValues?: string;
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
          data as {
            name: string;
            description?: string;
            projectIds?: number[];
            algType?: number;
            doeFileName?: string;
            doeFileHeads?: string[];
            doeFileData?: Array<Record<string, number | string>>;
            sort?: number;
          }
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
            enumValues: p.enumValues || undefined,
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

  // 下载 DOE 模板（后端固定文件）
  const handleDownloadTemplate = () => {
    const url = configApi.getParamGroupDoeTemplateDownloadUrl();
    window.open(url, '_blank');
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
              onClick={() => {
                setEditingGroup({});
                setShowGroupModal(true);
              }}
              className={managementPrimaryButtonClass}
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
              className={managementSearchInputClass}
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
              className={`${managementFieldClass} text-sm`}
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
        <ParamGroupFormModal
          group={editingGroup}
          paramDefs={allParamDefs}
          projects={projects}
          existingParams={editingGroup?.id ? groupParamsMap.get(editingGroup.id) || [] : []}
          onSave={handleSaveGroup}
          showToast={showToast}
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
      <ConfirmDialogComponent />
    </Card>
  );
};
