import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, useToast, useConfirmDialog } from '@/components/ui';
import { Plus, Pencil, Trash2, Search, X, Filter } from 'lucide-react';
import { configApi, outputGroupsApi } from '@/api';
import type { OutputGroup, OutputInGroup } from '@/types/configGroups';
import type { OutputDef } from '@/api';
import { usePostProcessModes } from '@/features/config/queries';
import {
  managementFieldClass,
  managementPrimaryButtonClass,
  managementSearchInputClass,
} from './managementSurfaceTokens';
import { OutputGroupFormModal, type OutputRespConfig } from './outputGroups/OutputGroupFormModal';

const POST_PROCESS_MODE_OPTIONS = [
  { value: '18', label: 'Other' },
  { value: '35', label: 'RF_AT_XX' },
];
const DEFAULT_POST_PROCESS_MODE = '18';

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
  const { data: postProcessModes = [] } = usePostProcessModes();
  const loadedRef = useRef(false);

  const postProcessModeOptions = useMemo(() => {
    return postProcessModes.length > 0
      ? postProcessModes.map(mode => ({
          value: mode.code,
          label: mode.name,
        }))
      : POST_PROCESS_MODE_OPTIONS;
  }, [postProcessModes]);

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
            className={managementPrimaryButtonClass}
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
        <OutputGroupFormModal
          group={editingGroup}
          outputDefs={allOutputDefs}
          projects={projects}
          postProcessModeOptions={postProcessModeOptions}
          existingOutputConfigs={
            editingGroup?.id
              ? (groupOutputsMap.get(editingGroup.id) || []).map(o => ({
                  outputDefId: o.outputDefId,
                  setName: o.setName || 'push',
                  component: o.component || DEFAULT_POST_PROCESS_MODE,
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
