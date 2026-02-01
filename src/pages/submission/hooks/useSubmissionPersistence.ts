/**
 * 提单数据持久化 Hook
 * 处理草稿保存、加载和编辑模式
 */

import { useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { UseFormReturn } from 'react-hook-form';
import type { SubmissionFormValues, SimTypeConfig, GlobalSolverConfig, InpSetInfo } from '../types';
import type { SelectedSimType } from './useSubmissionState';
import type { SubmissionDraft } from '../types/storage';
import { saveDraft, loadDraft, clearDraft } from '../utils/draftStorage';

interface UseSubmissionPersistenceProps {
  form: UseFormReturn<SubmissionFormValues>;
  selectedSimTypes: SelectedSimType[];
  simTypeConfigs: Record<number, SimTypeConfig>;
  globalSolver: GlobalSolverConfig;
  inpSets: InpSetInfo[];
  // 状态设置函数
  setSelectedSimTypes: (types: SelectedSimType[]) => void;
  setSimTypeConfigs: (configs: Record<number, SimTypeConfig>) => void;
  setGlobalSolver: (solver: GlobalSolverConfig) => void;
  setInpSets: (sets: InpSetInfo[]) => void;
  // 配置数据是否加载完成
  isConfigLoaded: boolean;
}

interface UseSubmissionPersistenceReturn {
  // 是否为编辑模式
  isEditMode: boolean;
  // 当前编辑的申请单ID
  orderId: number | null;
  // 是否正在加载申请单数据
  isLoadingOrder: boolean;
  // 手动保存草稿
  saveCurrentDraft: () => boolean;
  // 清除草稿
  clearCurrentDraft: () => void;
  // 是否有未保存的草稿
  hasDraft: boolean;
}

export const useSubmissionPersistence = ({
  form,
  selectedSimTypes,
  simTypeConfigs,
  globalSolver,
  inpSets,
  setSelectedSimTypes,
  setSimTypeConfigs,
  setGlobalSolver,
  setInpSets,
  isConfigLoaded,
}: UseSubmissionPersistenceProps): UseSubmissionPersistenceReturn => {
  const [searchParams] = useSearchParams();

  // 从 URL 获取申请单 ID（编辑模式）
  const orderId = searchParams.get('orderId') ? Number(searchParams.get('orderId')) : null;
  const isEditMode = orderId !== null;

  // 加载状态
  const isLoadingOrderRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const hasDraftRef = useRef(false);

  // 检查是否有草稿
  useEffect(() => {
    if (!isEditMode) {
      const draft = loadDraft();
      hasDraftRef.current = draft !== null;
    }
  }, [isEditMode]);

  // 保存当前草稿
  const saveCurrentDraft = useCallback((): boolean => {
    if (isEditMode) return false; // 编辑模式不保存草稿

    const formValues = form.getValues();
    return saveDraft({
      formValues,
      selectedSimTypes,
      simTypeConfigs,
      globalSolver,
      inpSets,
    });
  }, [form, selectedSimTypes, simTypeConfigs, globalSolver, inpSets, isEditMode]);

  // 清除草稿
  const clearCurrentDraft = useCallback(() => {
    clearDraft();
    hasDraftRef.current = false;
  }, []);

  // 应用草稿数据到表单和状态
  const applyDraft = useCallback(
    (draft: SubmissionDraft) => {
      // 设置表单值
      form.reset(draft.formValues);
      // 设置仿真配置
      setSelectedSimTypes(draft.selectedSimTypes);
      setSimTypeConfigs(draft.simTypeConfigs);
      setGlobalSolver(draft.globalSolver);
      setInpSets(draft.inpSets);
    },
    [form, setSelectedSimTypes, setSimTypeConfigs, setGlobalSolver, setInpSets]
  );

  // 数据初始化逻辑
  // 优先级：编辑模式 > 草稿缓存 > 默认值
  useEffect(() => {
    if (hasInitializedRef.current || !isConfigLoaded) return;

    // 编辑模式：从后端加载申请单数据
    if (isEditMode && orderId) {
      // 编辑模式的数据加载由外部处理（通过 useQuery）
      hasInitializedRef.current = true;
      return;
    }

    // 新建模式：尝试加载草稿
    const draft = loadDraft();
    if (draft) {
      applyDraft(draft);
      hasDraftRef.current = true;
    }

    hasInitializedRef.current = true;
  }, [isConfigLoaded, isEditMode, orderId, applyDraft]);

  // 页面离开时自动保存草稿
  useEffect(() => {
    if (isEditMode) return; // 编辑模式不自动保存

    const handleBeforeUnload = () => {
      saveCurrentDraft();
    };

    // 监听页面卸载
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // 组件卸载时保存草稿
      saveCurrentDraft();
    };
  }, [isEditMode, saveCurrentDraft]);

  return {
    isEditMode,
    orderId,
    isLoadingOrder: isLoadingOrderRef.current,
    saveCurrentDraft,
    clearCurrentDraft,
    hasDraft: hasDraftRef.current,
  };
};
