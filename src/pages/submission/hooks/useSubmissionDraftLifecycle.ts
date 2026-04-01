import { useEffect, useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { clearDraft, loadDraft, saveDraft } from '../utils/draftStorage';
import type { SubmissionFormValues, InpSetInfo, SimTypeConfig, GlobalSolverConfig } from '../types';
import type { SelectedSimType } from './submissionStateUtils';

interface DraftPayload {
  formValues: SubmissionFormValues;
  selectedSimTypes: SelectedSimType[];
  simTypeConfigs: Record<number, SimTypeConfig>;
  globalSolver: GlobalSolverConfig;
  inpSets: InpSetInfo[];
}

interface UseSubmissionDraftLifecycleOptions {
  form: UseFormReturn<SubmissionFormValues>;
  orderId: number | null;
  isEditMode: boolean;
  isConfigLoading: boolean;
  hasInitializedRef: React.MutableRefObject<boolean>;
  draftScopeIdRef: React.MutableRefObject<string>;
  draftPayload: DraftPayload;
  markConditionIdsAsInitialized: (ids: number[]) => void;
  setSelectedSimTypes: (value: SelectedSimType[]) => void;
  setSimTypeConfigs: (value: Record<number, SimTypeConfig>) => void;
  setGlobalSolver: (value: GlobalSolverConfig) => void;
  setInpSets: (value: InpSetInfo[]) => void;
  showDraftRestored: () => void;
  resetToLatestDefaults: () => Promise<void>;
}

export const useSubmissionDraftLifecycle = ({
  form,
  orderId,
  isEditMode,
  isConfigLoading,
  hasInitializedRef,
  draftScopeIdRef,
  draftPayload,
  markConditionIdsAsInitialized,
  setSelectedSimTypes,
  setSimTypeConfigs,
  setGlobalSolver,
  setInpSets,
  showDraftRestored,
  resetToLatestDefaults,
}: UseSubmissionDraftLifecycleOptions) => {
  const isLoadingDraftRef = useRef(false);
  const draftDataRef = useRef(draftPayload);

  draftDataRef.current = draftPayload;

  useEffect(() => {
    if (hasInitializedRef.current) return;
    if (isConfigLoading) return;
    if (isEditMode) return;

    const draft = loadDraft(orderId, 7 * 24 * 60 * 60 * 1000, draftScopeIdRef.current);
    if (draft) {
      isLoadingDraftRef.current = true;
      const conditionIds = Object.keys(draft.simTypeConfigs).map(Number);
      markConditionIdsAsInitialized(conditionIds);
      form.reset(draft.formValues);
      setSelectedSimTypes(draft.selectedSimTypes);
      setSimTypeConfigs(draft.simTypeConfigs);
      setGlobalSolver(draft.globalSolver);
      setInpSets(draft.inpSets);
      showDraftRestored();
      setTimeout(() => {
        isLoadingDraftRef.current = false;
      }, 100);
    } else {
      void resetToLatestDefaults();
    }

    hasInitializedRef.current = true;
  }, [
    draftScopeIdRef,
    form,
    hasInitializedRef,
    isConfigLoading,
    isEditMode,
    markConditionIdsAsInitialized,
    orderId,
    resetToLatestDefaults,
    setGlobalSolver,
    setInpSets,
    setSelectedSimTypes,
    setSimTypeConfigs,
    showDraftRestored,
  ]);

  useEffect(() => {
    const draftScopeId = draftScopeIdRef.current;
    return () => {
      if (hasInitializedRef.current && !isLoadingDraftRef.current) {
        saveDraft(draftDataRef.current, orderId, draftScopeId);
      }
    };
  }, [draftScopeIdRef, hasInitializedRef, orderId]);

  useEffect(() => {
    const draftScopeId = draftScopeIdRef.current;
    const handleBeforeUnload = () => {
      if (hasInitializedRef.current && !isLoadingDraftRef.current) {
        saveDraft(draftDataRef.current, orderId, draftScopeId);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [draftScopeIdRef, hasInitializedRef, orderId]);

  return {
    clearCurrentDraft: () => clearDraft(orderId, draftScopeIdRef.current),
  };
};
