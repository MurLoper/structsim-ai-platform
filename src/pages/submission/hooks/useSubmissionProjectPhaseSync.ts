import { useEffect, useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { SubmissionFormValues } from '../types';

interface UseSubmissionProjectPhaseSyncOptions {
  form: UseFormReturn<SubmissionFormValues>;
  selectedProjectId: number | null;
  defaultPhaseId: number | null;
  availablePhaseIds: number[];
  isEditMode: boolean;
}

export const useSubmissionProjectPhaseSync = ({
  form,
  selectedProjectId,
  defaultPhaseId,
  availablePhaseIds,
  isEditMode,
}: UseSubmissionProjectPhaseSyncOptions) => {
  const lastProjectIdRef = useRef<number | null>(null);

  useEffect(() => {
    const currentPhaseId = form.getValues('phaseId') ?? null;

    if (!selectedProjectId) {
      if (currentPhaseId !== null) {
        form.setValue('phaseId', null, { shouldDirty: true });
      }
      lastProjectIdRef.current = null;
      return;
    }

    const projectChanged = lastProjectIdRef.current !== selectedProjectId;
    lastProjectIdRef.current = selectedProjectId;

    if (currentPhaseId && availablePhaseIds.includes(currentPhaseId)) {
      return;
    }

    if (!projectChanged && currentPhaseId === null && isEditMode) {
      return;
    }

    const nextPhaseId =
      defaultPhaseId && availablePhaseIds.includes(defaultPhaseId) ? defaultPhaseId : null;
    form.setValue('phaseId', nextPhaseId, {
      shouldDirty: projectChanged,
      shouldValidate: false,
    });
  }, [availablePhaseIds, defaultPhaseId, form, isEditMode, selectedProjectId]);
};
