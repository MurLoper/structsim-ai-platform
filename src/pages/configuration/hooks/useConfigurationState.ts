import { useState, useCallback, useMemo } from 'react';
import { useToast, useConfirmDialog } from '@/components/ui';
import { useStableCallback } from '@/hooks/useStableCallback';
import { useFormState } from '@/hooks/useFormState';
import {
  type ConfigurationModalType,
  getConfigurationDefaultFormData,
} from './configurationFormDefaults';
import { useConfigurationCrud } from './useConfigurationCrud';
import { useConfigurationReferenceData } from './useConfigurationReferenceData';

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
    careDevices,
  } = useConfigurationReferenceData();
  const { saveEntity, deleteEntity } = useConfigurationCrud();

  const { showToast } = useToast();
  const { showConfirm, ConfirmDialogComponent } = useConfirmDialog();

  const [activeTab, setActiveTab] = useState('simTypes');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ConfigurationModalType>('simType');
  const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null);

  const initialData = useMemo(
    () => (editingItem ? { ...editingItem } : getConfigurationDefaultFormData(modalType)),
    [editingItem, modalType]
  );

  const { formData, updateField, resetForm, handleSubmit, isSubmitting } = useFormState<
    Record<string, unknown>
  >(initialData, async data => {
    const message = await saveEntity(modalType, editingItem, data);
    if (message) {
      showToast('success', message);
    }
  });

  // 打开新建/编辑弹窗
  const openModal = useCallback((type: ConfigurationModalType, item?: object) => {
    setModalType(type);
    setEditingItem(item ? (item as Record<string, unknown>) : null);
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
    } catch (error: unknown) {
      console.error('Save failed:', error);
      const message = error instanceof Error ? error.message : '保存失败，请重试';
      showToast('error', message);
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
            await deleteEntity(type as ConfigurationModalType, id);
            showToast('success', '删除成功');
          } catch (error: unknown) {
            console.error('Delete failed:', error);
            const message = error instanceof Error ? error.message : '删除失败，请重试';
            showToast('error', message);
          }
        },
        'danger'
      );
    },
    [showConfirm, showToast, deleteEntity]
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
    careDevices: careDevices || [],
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
