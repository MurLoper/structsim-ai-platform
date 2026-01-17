import { useState, useCallback } from 'react';
import { useConfigStore } from '@/stores';
import { configApi } from '@/api';

type ModalType = 'simType' | 'paramDef' | 'solver' | 'conditionDef' | 'outputDef' | 'foldType';

const getDefaultFormData = (type: ModalType) => {
  switch (type) {
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
    fetchAllConfig,
  } = useConfigStore();

  const [activeTab, setActiveTab] = useState('simTypes');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>('simType');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  // 打开新建/编辑弹窗
  const openModal = useCallback((type: ModalType, item?: any) => {
    setModalType(type);
    setEditingItem(item || null);
    setFormData(item ? { ...item } : getDefaultFormData(type));
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingItem(null);
    setFormData({});
  }, []);

  // 保存
  const handleSave = useCallback(async () => {
    setLoading(true);
    try {
      if (modalType === 'simType') {
        if (editingItem) {
          await configApi.updateSimType(editingItem.id, formData);
        } else {
          await configApi.createSimType(formData);
        }
      } else if (modalType === 'paramDef') {
        if (editingItem) {
          await configApi.updateParamDef(editingItem.id, formData);
        } else {
          await configApi.createParamDef(formData);
        }
      } else if (modalType === 'solver') {
        if (editingItem) {
          await configApi.updateSolver(editingItem.id, formData);
        } else {
          await configApi.createSolver(formData);
        }
      } else if (modalType === 'conditionDef') {
        if (editingItem) {
          await configApi.updateConditionDef(editingItem.id, formData);
        } else {
          await configApi.createConditionDef(formData);
        }
      } else if (modalType === 'outputDef') {
        if (editingItem) {
          await configApi.updateOutputDef(editingItem.id, formData);
        } else {
          await configApi.createOutputDef(formData);
        }
      } else if (modalType === 'foldType') {
        if (editingItem) {
          await configApi.updateFoldType(editingItem.id, formData);
        } else {
          await configApi.createFoldType(formData);
        }
      }
      await fetchAllConfig();
      closeModal();
    } catch (error) {
      console.error('Save failed:', error);
      alert('保存失败');
    } finally {
      setLoading(false);
    }
  }, [modalType, editingItem, formData, fetchAllConfig, closeModal]);

  // 删除
  const handleDelete = useCallback(
    async (type: string, id: number, name: string) => {
      if (!confirm(`确定要删除 "${name}" 吗？`)) return;
      try {
        if (type === 'simType') await configApi.deleteSimType(id);
        else if (type === 'paramDef') await configApi.deleteParamDef(id);
        else if (type === 'solver') await configApi.deleteSolver(id);
        else if (type === 'conditionDef') await configApi.deleteConditionDef(id);
        else if (type === 'outputDef') await configApi.deleteOutputDef(id);
        else if (type === 'foldType') await configApi.deleteFoldType(id);
        await fetchAllConfig();
      } catch (error) {
        console.error('Delete failed:', error);
        alert('删除失败');
      }
    },
    [fetchAllConfig]
  );

  const updateFormData = useCallback((key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  }, []);

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
  };
};
