import { useMemo } from 'react';
import { estimateRoundsFromConditions } from '../utils/submitEstimation';

export interface SubmissionConditionLike {
  conditionId?: number;
  foldTypeId?: number;
  foldTypeName?: string;
  simTypeId?: number;
  simTypeName?: string;
  params?: unknown;
  output?: unknown;
  solver?: unknown;
  careDeviceIds?: Array<number | string>;
  remark?: string;
}

interface UseSubmissionSubmitMetaOptions {
  conditions: SubmissionConditionLike[];
  submitLimits?: {
    maxBatchSize?: number;
    dailyRoundLimit?: number;
    todayUsedRounds?: number;
  };
  user?: {
    maxBatchSize?: number;
    dailyRoundLimit?: number;
  } | null;
}

export const useSubmissionSubmitMeta = ({
  conditions,
  submitLimits,
  user,
}: UseSubmissionSubmitMetaOptions) => {
  return useMemo(() => {
    const currentSubmitRounds = estimateRoundsFromConditions(
      conditions as Array<Record<string, unknown>>
    );
    const maxBatchSize = submitLimits?.maxBatchSize ?? user?.maxBatchSize ?? 200;
    const dailyRoundLimit = submitLimits?.dailyRoundLimit ?? user?.dailyRoundLimit ?? 500;
    const todayUsedRounds = submitLimits?.todayUsedRounds ?? 0;

    return {
      currentSubmitRounds,
      maxBatchSize,
      dailyRoundLimit,
      todayUsedRounds,
      willExceedBatchLimit: currentSubmitRounds > maxBatchSize,
      willExceedDailyLimit: todayUsedRounds + currentSubmitRounds > dailyRoundLimit,
    };
  }, [conditions, submitLimits, user]);
};
