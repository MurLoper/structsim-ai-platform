import { useState, useCallback, useMemo } from 'react';
import { useConfigStore } from '@/stores';
import { configApi } from '@/api';
import { useToast, useConfirmDialog } from '@/components/ui';
import { useStableCallback } from '@/hooks/useStableCallback';
import { useFormState } from '@/hooks/useFormState';

type ModalType =
  | 'project'
  | 'simType'
  | 'paramDef'
  | 'solver'
  | 'conditionDef'
  | 'outputDef'
  | 'foldType';

const getDefaultFormData = (type: ModalType) => {
  switch (type) {
    case 'project':
      return { name: '', code: '', sort: 100, remark: '' };
    case 'simType':
      return { name: '', code: '', category: 'STRUCTURE', colorTag: 'blue', sort: 100 };
    case 'paramDef':
      return {
        name: '',
        key: '',
        valType: 1,
        unit: '',
        minVal: 0,
        maxVal: 100,
        defaultVal: '',
        precision: 3,
        sort: 100,
      };
    case 'solver':
      return {
        name: '',
        code: '',
        version: '2024',
        cpuCoreMin: 1,
        cpuCoreMax: 64,
        cpuCoreDefault: 8,
        memoryMin: 1,
        memoryMax: 1024,
        memoryDefault: 64,
        sort: 100,
      };
    case 'conditionDef':
      return { name: '', code: '', category: '', unit: '', sort: 100, remark: '' };
    case 'outputDef':
      return { name: '', code: '', unit: '', dataType: 'float', sort: 100, remark: '' };
    case 'foldType':
      return { name: '', code: '', angle: 0, sort: 100, remark: '' };
    default:
      return {};
  }
};

export const useConfigurationState = () => {
  const {
    projects,
    paramDefs,
    workflows,
    simTypes,
    solvers,
    conditionDefs,
    outputDefs,
    foldTypes,
    refreshProjects,
    refreshSimTypes,
    refreshParamDefs,
    refreshSolvers,
    refreshConditionDefs,
    refreshOutputDefs,
    refreshFoldTypes,
  } = useConfigStore();

  const { showToast } = useToast();
  const { showConfirm, ConfirmDialogComponent } = useConfirmDialog();

  const [activeTab, setActiveTab] = useState('simTypes');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>('simType');
  const [editingItem, setEditingItem] = useState<any>(null);

  const initialData = useMemo(
    () => (editingItem ? { ...editingItem } : getDefaultFormData(modalType)),
    [editingItem, modalType]
  );

  const { formData, updateField, resetForm, handleSubmit, isSubmitting } = useFormState<any>(
    initialData,
    async data => {
      if (modalType === 'project') {
        if (editingItem) {
          await configApi.updateProject(editingItem.id as number, data);
          showToast('success', '项目更新成功');
          await refreshProjects();
        } else {
          await configApi.createProject(data);
          showToast('success', '项目创建成功');
          await refreshProjects();
        }
      } else if (modalType === 'simType') {
        if (editingItem) {
          await configApi.updateSimType(editingItem.id, data);
          showToast('success', '仿真类型更新成功');
          await refreshSimTypes();
        } else {
          await configApi.createSimType(data);
          showToast('success', '仿真类型创建成功');
          await refreshSimTypes();
        }
      } else if (modalType === 'paramDef') {
        if (editingItem) {
          await configApi.updateParamDef(editingItem.id, data);
          showToast('success', '参数定义更新成功');
          await refreshParamDefs();
        } else {
          await configApi.createParamDef(data);
          showToast('success', '参数定义创建成功');
          await refreshParamDefs();
        }
      } else if (modalType === 'solver') {
        if (editingItem) {
          await configApi.updateSolver(editingItem.id, data);
          showToast('success', '求解器更新成功');
          await refreshSolvers();
        } else {
          await configApi.createSolver(data);
          showToast('success', '求解器创建成功');
          await refreshSolvers();
        }
      } else if (modalType === 'conditionDef') {
        if (editingItem) {
          await configApi.updateConditionDef(editingItem.id, data);
          showToast('success', '工况定义更新成功');
          await refreshConditionDefs();
        } else {
          await configApi.createConditionDef(data);
          showToast('success', '工况定义创建成功');
          await refreshConditionDefs();
        }
      } else if (modalType === 'outputDef') {
        if (editingItem) {
          await configApi.updateOutputDef(editingItem.id, data);
          showToast('success', '输出定义更新成功');
          await refreshOutputDefs();
        } else {
          await configApi.createOutputDef(data);
          showToast('success', '输出定义创建成功');
          await refreshOutputDefs();
        }
      } else if (modalType === 'foldType') {
        if (editingItem) {
          await configApi.updateFoldType(editingItem.id, data);
          showToast('success', '姿态类型更新成功');
          await refreshFoldTypes();
        } else {
          await configApi.createFoldType(data);
          showToast('success', '姿态类型创建成功');
          await refreshFoldTypes();
        }
      }
    }
  );

  // 打开新建/编辑弹窗
  const openModal = useCallback((type: ModalType, item?: any) => {
    setModalType(type);
    setEditingItem(item || null);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingItem(null);
    resetForm();
  }, [resetForm]);

  // 保存 - 使用 useStableCallback 避免闭包陷阱
  const handleSave = useStableCallback(async () => {
    try {
      await handleSubmit();
      closeModal();
    } catch (error: any) {
      console.error('Save failed:', error);
      showToast('error', error?.message || '保存失败，请重试');
    }
  });

  // 删除
  const handleDelete = useCallback(
    async (type: string, id: number, name: string) => {
      showConfirm(
        '确认删除',
        `确定要删除 "${name}" 吗？此操作无法撤销。`,
        async () => {
          try {
            if (type === 'project') {
              await configApi.deleteProject(id);
              await refreshProjects();
            } else if (type === 'simType') {
              await configApi.deleteSimType(id);
              await refreshSimTypes();
            } else if (type === 'paramDef') {
              await configApi.deleteParamDef(id);
              await refreshParamDefs();
            } else if (type === 'solver') {
              await configApi.deleteSolver(id);
              await refreshSolvers();
            } else if (type === 'conditionDef') {
              await configApi.deleteConditionDef(id);
              await refreshConditionDefs();
            } else if (type === 'outputDef') {
              await configApi.deleteOutputDef(id);
              await refreshOutputDefs();
            } else if (type === 'foldType') {
              await configApi.deleteFoldType(id);
              await refreshFoldTypes();
            }

            showToast('success', '删除成功');
          } catch (error: any) {
            console.error('Delete failed:', error);
            showToast('error', error?.message || '删除失败，请重试');
          }
        },
        'danger'
      );
    },
    [
      showConfirm,
      showToast,
      refreshProjects,
      refreshSimTypes,
      refreshParamDefs,
      refreshSolvers,
      refreshConditionDefs,
      refreshOutputDefs,
      refreshFoldTypes,
    ]
  );

  const updateFormData = useStableCallback((key: string, value: unknown) => {
    updateField(key as never, value);
  });

  return {
    // 数据
    projects: projects || [],
    paramDefs: paramDefs || [],
    workflows: workflows || [],
    simTypes: simTypes || [],
    solvers: solvers || [],
    conditionDefs: conditionDefs || [],
    outputDefs: outputDefs || [],
    foldTypes: foldTypes || [],
    // 状态
    activeTab,
    setActiveTab,
    modalOpen,
    modalType,
    editingItem,
    formData,
    loading: isSubmitting,
    // 方法
    openModal,
    closeModal,
    handleSave,
    handleDelete,
    updateFormData,
    // 组件
    ConfirmDialogComponent,
  };
};
