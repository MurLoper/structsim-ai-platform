import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, useConfirmDialog, useToast } from '@/components/ui';
import { configApi, outputGroupsApi } from '@/api';
import type { OutputDef } from '@/api';
import type { OutputGroup, OutputInGroup } from '@/types/configGroups';
import { usePostProcessModes } from '@/features/config/queries';
import { OutputGroupFormModal, type OutputRespConfig } from './outputGroups/OutputGroupFormModal';
import { OutputGroupsTable } from './outputGroups/OutputGroupsTable';
import { OutputGroupsToolbar } from './outputGroups/OutputGroupsToolbar';
import { buildOutputGroupTableRows } from './outputGroups/outputGroupTableRows';

const POST_PROCESS_MODE_OPTIONS = [
  { value: '18', label: 'Other' },
  { value: '35', label: 'RF_AT_XX' },
];
const DEFAULT_POST_PROCESS_MODE = '18';

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

  const postProcessModeOptions = useMemo(
    () =>
      postProcessModes.length > 0
        ? postProcessModes.map(mode => ({
            value: mode.code,
            label: mode.name,
          }))
        : POST_PROCESS_MODE_OPTIONS,
    [postProcessModes]
  );

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [groupsResponse, outputDefsResponse, projectsResponse] = await Promise.all([
        outputGroupsApi.getOutputGroups(),
        configApi.getOutputDefs(),
        configApi.getProjects(),
      ]);

      const nextGroups = Array.isArray(groupsResponse?.data) ? groupsResponse.data : [];
      const nextOutputDefs = Array.isArray(outputDefsResponse?.data) ? outputDefsResponse.data : [];
      const nextProjects = Array.isArray(projectsResponse?.data) ? projectsResponse.data : [];

      setGroups(nextGroups);
      setAllOutputDefs(nextOutputDefs);
      setProjects(nextProjects.map(project => ({ id: project.id, name: project.name })));

      const outputsMap = new Map<number, OutputInGroup[]>();
      await Promise.all(
        nextGroups.map(async group => {
          try {
            const response = await outputGroupsApi.getOutputGroupOutputs(group.id);
            outputsMap.set(group.id, Array.isArray(response?.data) ? response.data : []);
          } catch {
            outputsMap.set(group.id, []);
          }
        })
      );
      setGroupOutputsMap(outputsMap);
    } catch (error) {
      console.error('加载输出组合失败:', error);
      showToast('error', '加载输出组合失败');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    void loadAllData();
  }, [loadAllData]);

  const tableRows = useMemo(
    () =>
      buildOutputGroupTableRows({
        groups,
        projects,
        groupOutputsMap,
        searchTerm,
        filterProjectId,
      }),
    [filterProjectId, groupOutputsMap, groups, projects, searchTerm]
  );

  const handleSaveGroup = async (data: Partial<OutputGroup>, outputConfigs: OutputRespConfig[]) => {
    try {
      let groupId: number;

      if (editingGroup?.id) {
        await outputGroupsApi.updateOutputGroup(editingGroup.id, data);
        groupId = editingGroup.id;
        await outputGroupsApi.clearGroupOutputs(groupId);
      } else {
        const response = await outputGroupsApi.createOutputGroup(
          data as { name: string; description?: string; sort?: number }
        );
        groupId = (response?.data as { id: number })?.id || 0;
      }

      if (groupId && outputConfigs.length > 0) {
        for (const config of outputConfigs) {
          try {
            await outputGroupsApi.addOutputToGroup(groupId, {
              outputDefId: config.outputDefId,
              setName: config.setName,
              component: config.component,
              stepName: config.stepName || undefined,
              sectionPoint: config.sectionPoint || undefined,
              specialOutputSet: config.specialOutputSet || undefined,
              description: config.description || undefined,
              weight: config.weight,
              multiple: config.multiple,
              lowerLimit: config.lowerLimit,
              upperLimit: config.upperLimit,
              targetType: config.targetType,
              targetValue: config.targetValue,
              sort: config.sort,
            });
          } catch (error) {
            console.error(`添加输出 ${config.outputDefId} 失败:`, error);
          }
        }
      }

      setShowGroupModal(false);
      setEditingGroup(null);
      await loadAllData();
      showToast('success', editingGroup?.id ? '更新组合成功' : '创建组合成功');
    } catch (error) {
      console.error('保存输出组合失败:', error);
      showToast('error', '保存输出组合失败');
    }
  };

  const handleDeleteGroup = (groupId: number) => {
    const group = groups.find(item => item.id === groupId);
    showConfirm(
      '删除工况输出组合',
      `确定要删除“${group?.name}”吗？`,
      async () => {
        try {
          await outputGroupsApi.deleteOutputGroup(groupId);
          await loadAllData();
          showToast('success', '删除成功');
        } catch (error) {
          console.error('删除输出组合失败:', error);
          showToast('error', '删除失败');
        }
      },
      'danger'
    );
  };

  const handleRemoveOutput = (groupId: number, outputDefId: number) => {
    const outputs = groupOutputsMap.get(groupId) || [];
    const output = outputs.find(item => item.outputDefId === outputDefId);

    showConfirm(
      '移除输出',
      `确定要移除“${output?.outputName || outputDefId}”吗？`,
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
      <OutputGroupsToolbar
        searchTerm={searchTerm}
        filterProjectId={filterProjectId}
        projects={projects}
        onSearchChange={setSearchTerm}
        onFilterProjectChange={setFilterProjectId}
        onCreate={() => {
          setEditingGroup({});
          setShowGroupModal(true);
        }}
      />

      <OutputGroupsTable
        loading={loading}
        rows={tableRows}
        onEdit={group => {
          setEditingGroup(group);
          setShowGroupModal(true);
        }}
        onDeleteGroup={handleDeleteGroup}
        onRemoveOutput={handleRemoveOutput}
      />

      {showGroupModal && (
        <OutputGroupFormModal
          group={editingGroup}
          outputDefs={allOutputDefs}
          projects={projects}
          postProcessModeOptions={postProcessModeOptions}
          existingOutputConfigs={
            editingGroup?.id
              ? (groupOutputsMap.get(editingGroup.id) || []).map(item => ({
                  outputDefId: item.outputDefId,
                  setName: item.setName || 'push',
                  component: item.component || DEFAULT_POST_PROCESS_MODE,
                  stepName: item.stepName,
                  sectionPoint: item.sectionPoint,
                  specialOutputSet: item.specialOutputSet,
                  description: item.description,
                  weight: item.weight ?? 1.0,
                  multiple: item.multiple ?? 1.0,
                  lowerLimit: item.lowerLimit ?? 0.0,
                  upperLimit: item.upperLimit,
                  targetType: item.targetType ?? 3,
                  targetValue: item.targetValue,
                  sort: item.sort ?? 100,
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
