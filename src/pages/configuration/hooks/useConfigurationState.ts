import { useState, useCallback, useEffect, useRef } from 'react';
import { useConfigStore } from '@/stores';
import { configApi } from '@/api';
import { useToast, useConfirmDialog } from '@/components/ui';
import { useStableCallback } from '@/hooks/useStableCallback';

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
      return { name: '', key: '', valType: 1, unit: '', minVal: 0, maxVal: 100, sort: 100 };
    case 'solver':
      return {
        name: '',
        code: '',
        version: '2024',
        cpuCoreMin: 1,
        cpuCoreMax: 64,
        cpuCoreDefault: 8,
        sort: 100,
      };
    case 'conditionDef':
      return { name: '', code: '', category: '', unit: '', sort: 100 };
    case 'outputDef':
      return { name: '', code: '', unit: '', dataType: 'float', sort: 100 };
    case 'foldType':
      return { name: '', code: '', angle: 0, sort: 100 };
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
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  // 使用 ref 保存最新的 formData，确保 handleSave 能访问到最新值
  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
    console.log('📌 [formDataRef] 更新:', formData);
  }, [formData]);

  // 打开新建/编辑弹窗
  const openModal = useCallback((type: ModalType, item?: any) => {
    console.log('🔷 [openModal] 打开弹窗');
    console.log('🔷 [openModal] type:', type);
    console.log('🔷 [openModal] item:', item);

    setModalType(type);
    setEditingItem(item || null);

    const initialData = item ? { ...item } : getDefaultFormData(type);
    console.log('🔷 [openModal] 初始化 formData:', initialData);
    setFormData(initialData);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingItem(null);
    setFormData({});
  }, []);

  // 保存 - 使用 useStableCallback 避免闭包陷阱
  const handleSave = useStableCallback(async () => {
    // 使用 ref 获取最新的 formData
    const latestFormData = formDataRef.current;

    console.log('=== 表单提交调试 ===');
    console.log('modalType:', modalType);
    console.log('editingItem:', editingItem);
    console.log('formData (state):', formData);
    console.log('formData (ref):', latestFormData);
    console.log('是否相同:', formData === latestFormData);

    setLoading(true);
    try {
      if (modalType === 'project') {
        if (editingItem) {
          console.log('更新项目，ID:', editingItem.id, '数据:', latestFormData);
          await configApi.updateProject(editingItem.id as number, latestFormData);
          showToast('success', '项目更新成功');
          await refreshProjects();
        } else {
          console.log('创建项目，数据:', latestFormData);
          await configApi.createProject(latestFormData);
          showToast('success', '项目创建成功');
          await refreshProjects();
        }
      } else if (modalType === 'simType') {
        if (editingItem) {
          console.log('更新仿真类型，ID:', editingItem.id, '数据:', latestFormData);
          await configApi.updateSimType(editingItem.id, latestFormData);
          showToast('success', '仿真类型更新成功');
          await refreshSimTypes();
        } else {
          console.log('创建仿真类型，数据:', latestFormData);
          await configApi.createSimType(latestFormData);
          showToast('success', '仿真类型创建成功');
          await refreshSimTypes();
        }
      } else if (modalType === 'paramDef') {
        if (editingItem) {
          console.log('更新参数定义，ID:', editingItem.id, '数据:', latestFormData);
          await configApi.updateParamDef(editingItem.id, latestFormData);
          showToast('success', '参数定义更新成功');
          await refreshParamDefs();
        } else {
          console.log('创建参数定义，数据:', latestFormData);
          await configApi.createParamDef(latestFormData);
          showToast('success', '参数定义创建成功');
          await refreshParamDefs();
        }
      } else if (modalType === 'solver') {
        if (editingItem) {
          console.log('更新求解器，ID:', editingItem.id, '数据:', latestFormData);
          await configApi.updateSolver(editingItem.id, latestFormData);
          showToast('success', '求解器更新成功');
          await refreshSolvers();
        } else {
          console.log('创建求解器，数据:', latestFormData);
          await configApi.createSolver(latestFormData);
          showToast('success', '求解器创建成功');
          await refreshSolvers();
        }
      } else if (modalType === 'conditionDef') {
        if (editingItem) {
          console.log('更新工况定义，ID:', editingItem.id, '数据:', latestFormData);
          await configApi.updateConditionDef(editingItem.id, latestFormData);
          showToast('success', '工况定义更新成功');
          await refreshConditionDefs();
        } else {
          console.log('创建工况定义，数据:', latestFormData);
          await configApi.createConditionDef(latestFormData);
          showToast('success', '工况定义创建成功');
          await refreshConditionDefs();
        }
      } else if (modalType === 'outputDef') {
        if (editingItem) {
          console.log('更新输出定义，ID:', editingItem.id, '数据:', latestFormData);
          await configApi.updateOutputDef(editingItem.id, latestFormData);
          showToast('success', '输出定义更新成功');
          await refreshOutputDefs();
        } else {
          console.log('创建输出定义，数据:', latestFormData);
          await configApi.createOutputDef(latestFormData);
          showToast('success', '输出定义创建成功');
          await refreshOutputDefs();
        }
      } else if (modalType === 'foldType') {
        if (editingItem) {
          console.log('更新姿态类型，ID:', editingItem.id, '数据:', latestFormData);
          await configApi.updateFoldType(editingItem.id, latestFormData);
          showToast('success', '姿态类型更新成功');
          await refreshFoldTypes();
        } else {
          console.log('创建姿态类型，数据:', latestFormData);
          await configApi.createFoldType(latestFormData);
          showToast('success', '姿态类型创建成功');
          await refreshFoldTypes();
        }
      }
      closeModal();
    } catch (error: any) {
      console.error('Save failed:', error);
      showToast('error', error?.message || '保存失败，请重试');
    } finally {
      setLoading(false);
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
    console.log(`[updateFormData] 更新字段 ${key}:`, value);
    setFormData((prev: any) => {
      const newData = { ...prev, [key]: value };
      console.log('[updateFormData] 新表单数据:', newData);
      return newData;
    });
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
    loading,
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
