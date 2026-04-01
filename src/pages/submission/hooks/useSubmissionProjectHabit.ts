import { useEffect } from 'react';
import { updateProjectHabit } from '../utils/submissionPageUtils';

interface UseSubmissionProjectHabitOptions {
  selectedProjectId: number | null;
  userKey: string;
  storageKey: string;
}

export const useSubmissionProjectHabit = ({
  selectedProjectId,
  userKey,
  storageKey,
}: UseSubmissionProjectHabitOptions) => {
  useEffect(() => {
    if (selectedProjectId != null) {
      updateProjectHabit(userKey, selectedProjectId, storageKey);
    }
  }, [selectedProjectId, storageKey, userKey]);
};
