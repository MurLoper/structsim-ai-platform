import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, useConfirmDialog, useToast } from '@/components/ui';
import { configApi } from '@/api';
import type { ParamDef } from '@/api';
import type { ParamGroup, ParamInGroup } from '@/types/configGroups';
import { AddParamsModal } from './paramGroups/AddParamsModal';
import { ParamGroupFormModal } from './paramGroups/ParamGroupFormModal';
import { ParamGroupTable } from './paramGroups/ParamGroupTable';
import { ParamGroupToolbar } from './paramGroups/ParamGroupToolbar';
import { buildParamGroupTableRows } from './paramGroups/paramGroupTableRows';

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

  const loadAllData = useCallback(async () => {
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
      setProjects(projectsData.map(project => ({ id: project.id, name: project.name })));

      const paramsMap = new Map<number, ParamInGroup[]>();
      await Promise.all(
        groupsData.map(async group => {
          try {
            const response = await configApi.getParamGroupParams(group.id);
            paramsMap.set(group.id, Array.isArray(response?.data) ? response.data : []);
          } catch {
            paramsMap.set(group.id, []);
          }
        })
      );
      setGroupParamsMap(paramsMap);
    } catch (error) {
      console.error('加载参数组数据失败:', error);
      showToast('error', '加载参数组数据失败');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;
    void loadAllData();
  }, [loadAllData]);

  const tableRows = useMemo(
    () =>
      buildParamGroupTableRows({
        groups,
        groupParamsMap,
        searchTerm,
        filterProjectId,
      }),
    [filterProjectId, groupParamsMap, groups, searchTerm]
  );

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
        const response = await configApi.createParamGroup(
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
        groupId = (response?.data as { id: number })?.id || 0;
      }

      if (groupId && paramConfigs.length > 0) {
        await configApi.replaceGroupParams(
          groupId,
          paramConfigs.map((item, index) => ({
            paramDefId: item.paramDefId,
            defaultValue: item.defaultValue || undefined,
            minVal: item.minVal,
            maxVal: item.maxVal,
            enumValues: item.enumValues || undefined,
            sort: item.sort ?? index * 10,
          }))
        );
      } else if (groupId && paramConfigs.length === 0 && editingGroup?.id) {
        await configApi.clearGroupParams(groupId);
      }

      setShowGroupModal(false);
      setEditingGroup(null);
      await loadAllData();
      showToast('success', '参数组保存成功');
    } catch (error: unknown) {
      console.error('保存参数组失败:', error);
      showToast('error', (error as { message?: string })?.message || '参数组保存失败');
    }
  };

  const handleDeleteGroup = (id: number) => {
    const group = groups.find(item => item.id === id);
    showConfirm(
      '删除参数组',
      `确认删除参数组「${group?.name || id}」吗？此操作不可撤销。`,
      async () => {
        try {
          await configApi.deleteParamGroup(id);
          await loadAllData();
          showToast('success', '参数组删除成功');
        } catch (error) {
          console.error('删除参数组失败:', error);
          showToast('error', '参数组删除失败');
        }
      },
      'danger'
    );
  };

  const handleAddParams = async (groupId: number, paramDefIds: number[]) => {
    try {
      for (const paramDefId of paramDefIds) {
        await configApi.addParamToGroup(groupId, { paramDefId });
      }
      await loadAllData();
      setShowParamModal(false);
      setEditingGroupId(null);
      showToast('success', `已添加 ${paramDefIds.length} 个参数到参数组`);
    } catch (error) {
      console.error('添加参数失败:', error);
      showToast('error', '添加参数失败');
    }
  };

  const handleRemoveParam = (groupId: number, paramDefId: number) => {
    const params = groupParamsMap.get(groupId) || [];
    const param = params.find(item => item.paramDefId === paramDefId);

    showConfirm(
      '移除参数',
      `确认将参数「${param?.paramName || paramDefId}」从参数组中移除吗？`,
      async () => {
        try {
          await configApi.removeParamFromGroup(groupId, paramDefId);
          await loadAllData();
          showToast('success', '参数移除成功');
        } catch (error) {
          console.error('移除参数失败:', error);
          showToast('error', '移除参数失败');
        }
      },
      'danger'
    );
  };

  const handleClearParams = (groupId: number) => {
    const group = groups.find(item => item.id === groupId);
    const paramCount = groupParamsMap.get(groupId)?.length || 0;

    if (paramCount === 0) {
      showToast('warning', '当前参数组没有可清空的参数');
      return;
    }

    showConfirm(
      '清空参数组',
      `确认清空参数组「${group?.name || groupId}」中的全部 ${paramCount} 个参数吗？`,
      async () => {
        try {
          await configApi.clearGroupParams(groupId);
          await loadAllData();
          showToast('success', '参数组已清空');
        } catch (error) {
          console.error('清空参数组失败:', error);
          showToast('error', '清空参数组失败');
        }
      },
      'warning'
    );
  };

  const handleDownloadTemplate = () => {
    const url = configApi.getParamGroupDoeTemplateDownloadUrl();
    window.open(url, '_blank');
  };

  return (
    <Card>
      <ParamGroupToolbar
        searchTerm={searchTerm}
        filterProjectId={filterProjectId}
        projects={projects}
        onSearchTermChange={setSearchTerm}
        onFilterProjectIdChange={setFilterProjectId}
        onDownloadTemplate={handleDownloadTemplate}
        onCreateGroup={() => {
          setEditingGroup({});
          setShowGroupModal(true);
        }}
      />

      <ParamGroupTable
        loading={loading}
        rows={tableRows}
        projects={projects}
        groupParamsMap={groupParamsMap}
        searchTerm={searchTerm}
        onEditGroup={group => {
          setEditingGroup(group);
          setShowGroupModal(true);
        }}
        onDeleteGroup={handleDeleteGroup}
        onOpenParamModal={groupId => {
          setEditingGroupId(groupId);
          setShowParamModal(true);
        }}
        onClearParams={handleClearParams}
        onRemoveParam={handleRemoveParam}
      />

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
          groupName={groups.find(group => group.id === editingGroupId)?.name || ''}
          paramDefs={allParamDefs}
          existingParamIds={
            new Set((groupParamsMap.get(editingGroupId) || []).map(item => item.paramDefId))
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
