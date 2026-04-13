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
  globalParams?: {
    applyToAll?: boolean;
    rotateDropFlag?: boolean;
  };
  user?: {
    maxBatchSize?: number;
    dailyRoundLimit?: number;
    todayUsedRounds?: number;
  } | null;
}

export const useSubmissionSubmitMeta = ({
  conditions,
  globalParams,
  user,
}: UseSubmissionSubmitMetaOptions) => {
  return useMemo(() => {
    const currentSubmitRounds = estimateRoundsFromConditions(
      conditions as Array<Record<string, unknown>>,
      globalParams as Record<string, unknown> | undefined
    );
    const maxBatchSize = user?.maxBatchSize ?? 200;
    const dailyRoundLimit = user?.dailyRoundLimit ?? 500;
    const todayUsedRounds = user?.todayUsedRounds ?? 0;

    return {
      currentSubmitRounds,
      maxBatchSize,
      dailyRoundLimit,
      todayUsedRounds,
      willExceedBatchLimit: currentSubmitRounds > maxBatchSize,
      willExceedDailyLimit: todayUsedRounds + currentSubmitRounds > dailyRoundLimit,
    };
  }, [conditions, globalParams, user]);
};
