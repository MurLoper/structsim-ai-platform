import { useState, useCallback, useMemo } from 'react';
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useSimTypes,
  useCreateSimType,
  useUpdateSimType,
  useDeleteSimType,
  useParamDefs,
  useCreateParamDef,
  useUpdateParamDef,
  useDeleteParamDef,
  useSolvers,
  useCreateSolver,
  useUpdateSolver,
  useDeleteSolver,
  useConditionDefs,
  useCreateConditionDef,
  useUpdateConditionDef,
  useDeleteConditionDef,
  useOutputDefs,
  useCreateOutputDef,
  useUpdateOutputDef,
  useDeleteOutputDef,
  useFoldTypes,
  useCreateFoldType,
  useUpdateFoldType,
  useDeleteFoldType,
  useWorkflows,
} from '@/features/config/queries';
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
  const { data: projects = [] } = useProjects();
  const { data: paramDefs = [] } = useParamDefs();
  const { data: workflows = [] } = useWorkflows();
  const { data: simTypes = [] } = useSimTypes();
  const { data: solvers = [] } = useSolvers();
  const { data: conditionDefs = [] } = useConditionDefs();
  const { data: outputDefs = [] } = useOutputDefs();
  const { data: foldTypes = [] } = useFoldTypes();

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const createSimType = useCreateSimType();
  const updateSimType = useUpdateSimType();
  const deleteSimType = useDeleteSimType();

  const createParamDef = useCreateParamDef();
  const updateParamDef = useUpdateParamDef();
  const deleteParamDef = useDeleteParamDef();

  const createSolver = useCreateSolver();
  const updateSolver = useUpdateSolver();
  const deleteSolver = useDeleteSolver();

  const createConditionDef = useCreateConditionDef();
  const updateConditionDef = useUpdateConditionDef();
  const deleteConditionDef = useDeleteConditionDef();

  const createOutputDef = useCreateOutputDef();
  const updateOutputDef = useUpdateOutputDef();
  const deleteOutputDef = useDeleteOutputDef();

  const createFoldType = useCreateFoldType();
  const updateFoldType = useUpdateFoldType();
  const deleteFoldType = useDeleteFoldType();

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
          await updateProject.mutateAsync({ id: editingItem.id as number, data });
          showToast('success', '项目更新成功');
        } else {
          await createProject.mutateAsync(data);
          showToast('success', '项目创建成功');
        }
      } else if (modalType === 'simType') {
        if (editingItem) {
          await updateSimType.mutateAsync({ id: editingItem.id as number, data });
          showToast('success', '仿真类型更新成功');
        } else {
          await createSimType.mutateAsync(data);
          showToast('success', '仿真类型创建成功');
        }
      } else if (modalType === 'paramDef') {
        if (editingItem) {
          await updateParamDef.mutateAsync({ id: editingItem.id as number, data });
          showToast('success', '参数定义更新成功');
        } else {
          await createParamDef.mutateAsync(data);
          showToast('success', '参数定义创建成功');
        }
      } else if (modalType === 'solver') {
        if (editingItem) {
          await updateSolver.mutateAsync({ id: editingItem.id as number, data });
          showToast('success', '求解器更新成功');
        } else {
          await createSolver.mutateAsync(data);
          showToast('success', '求解器创建成功');
        }
      } else if (modalType === 'conditionDef') {
        if (editingItem) {
          await updateConditionDef.mutateAsync({ id: editingItem.id as number, data });
          showToast('success', '工况定义更新成功');
        } else {
          await createConditionDef.mutateAsync(data);
          showToast('success', '工况定义创建成功');
        }
      } else if (modalType === 'outputDef') {
        if (editingItem) {
          await updateOutputDef.mutateAsync({ id: editingItem.id as number, data });
          showToast('success', '输出定义更新成功');
        } else {
          await createOutputDef.mutateAsync(data);
          showToast('success', '输出定义创建成功');
        }
      } else if (modalType === 'foldType') {
        if (editingItem) {
          await updateFoldType.mutateAsync({ id: editingItem.id as number, data });
          showToast('success', '姿态类型更新成功');
        } else {
          await createFoldType.mutateAsync(data);
          showToast('success', '姿态类型创建成功');
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
              await deleteProject.mutateAsync(id);
            } else if (type === 'simType') {
              await deleteSimType.mutateAsync(id);
            } else if (type === 'paramDef') {
              await deleteParamDef.mutateAsync(id);
            } else if (type === 'solver') {
              await deleteSolver.mutateAsync(id);
            } else if (type === 'conditionDef') {
              await deleteConditionDef.mutateAsync(id);
            } else if (type === 'outputDef') {
              await deleteOutputDef.mutateAsync(id);
            } else if (type === 'foldType') {
              await deleteFoldType.mutateAsync(id);
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
      deleteProject,
      deleteSimType,
      deleteParamDef,
      deleteSolver,
      deleteConditionDef,
      deleteOutputDef,
      deleteFoldType,
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
