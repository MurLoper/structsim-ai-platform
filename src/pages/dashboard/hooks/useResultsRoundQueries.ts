import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { resultsApi } from '@/api';
import { PAGINATION, RESULTS_PAGE_SIZE } from '@/constants';
import type { OrderConditionSummary } from '@/api/results';
import { buildWorkflowNodesFromRounds, mapMockRoundToLegacyRound } from './resultsConditionMappers';
import type {
  ConditionRoundPagingState,
  ConditionRoundsGroup,
  FullConditionRoundsGroup,
} from './resultsAnalysisTypes';
import { RESULTS_ANALYSIS_PAGE_SIZE } from './resultsAnalysisTypes';

interface UseResultsRoundQueriesOptions {
  resolvedOrderId: number | null;
  activeTab: 'overview' | 'detail' | 'analysis';
  focusedConditionId: number | null;
  focusedCondition: OrderConditionSummary | null;
  conditionRoundPaging: Record<number, ConditionRoundPagingState>;
}

export const useResultsRoundQueries = ({
  resolvedOrderId,
  activeTab,
  focusedConditionId,
  focusedCondition,
  conditionRoundPaging,
}: UseResultsRoundQueriesOptions) => {
  const shouldFetchDetailRounds = activeTab === 'detail';
  const shouldFetchAnalysisRounds = activeTab === 'analysis';

  const {
    data: conditionRoundGroups = [],
    isLoading: roundsLoading,
    error: roundsError,
    refetch: refetchRounds,
  } = useQuery({
    queryKey: [
      'results',
      'conditionRounds',
      resolvedOrderId,
      focusedConditionId,
      focusedConditionId ? conditionRoundPaging[focusedConditionId] : null,
      activeTab,
    ],
    queryFn: async () => {
      if (!resolvedOrderId || !focusedCondition) return [] as ConditionRoundsGroup[];
      const paging = conditionRoundPaging[focusedCondition.id] || {
        page: PAGINATION.DEFAULT_PAGE,
        pageSize: RESULTS_PAGE_SIZE,
      };
      const response = await resultsApi.getOrderConditionRounds(focusedCondition.id, {
        page: paging.page,
        pageSize: paging.pageSize,
      });

      return [
        {
          conditionId: focusedCondition.id,
          orderCondition: response.data?.orderCondition || focusedCondition,
          resultSource: response.data?.resultSource || 'mock',
          columns: response.data?.columns || [],
          statistics: response.data?.statistics,
          rounds: (response.data?.items || []).map(item =>
            mapMockRoundToLegacyRound(focusedCondition.id, item)
          ),
          page: response.data?.page || paging.page,
          pageSize: response.data?.pageSize || paging.pageSize,
          total: response.data?.total || 0,
          totalPages: response.data?.totalPages || 0,
        } satisfies ConditionRoundsGroup,
      ];
    },
    enabled: !!resolvedOrderId && !!focusedCondition && shouldFetchDetailRounds,
    staleTime: 30 * 1000,
  });

  const workflowNodes = useMemo(
    () => buildWorkflowNodesFromRounds(conditionRoundGroups),
    [conditionRoundGroups]
  );

  const {
    data: focusedConditionAnalysis,
    isLoading: focusedConditionAnalysisLoading,
    error: focusedConditionAnalysisError,
    refetch: refetchFocusedConditionAnalysis,
  } = useQuery({
    queryKey: ['results', 'focusedConditionAnalysis', focusedConditionId],
    queryFn: async () => {
      if (!focusedCondition) return null as FullConditionRoundsGroup | null;
      const expectedTotal = Math.max(Number(focusedCondition.roundTotal || 0), 1);
      const pageSize = Math.min(
        Math.max(expectedTotal, RESULTS_PAGE_SIZE),
        RESULTS_ANALYSIS_PAGE_SIZE
      );
      const response = await resultsApi.getOrderConditionRounds(focusedCondition.id, {
        page: PAGINATION.DEFAULT_PAGE,
        pageSize,
      });

      return {
        conditionId: focusedCondition.id,
        orderCondition: response.data?.orderCondition || focusedCondition,
        resultSource: response.data?.resultSource || 'mock',
        columns: response.data?.columns || [],
        statistics: response.data?.statistics,
        rounds: (response.data?.items || []).map(item =>
          mapMockRoundToLegacyRound(focusedCondition.id, item)
        ),
        page: response.data?.page || PAGINATION.DEFAULT_PAGE,
        pageSize: response.data?.pageSize || pageSize,
        total: response.data?.total || expectedTotal,
        totalPages: response.data?.totalPages || 1,
        sampled: (response.data?.total || expectedTotal) > pageSize,
      } satisfies FullConditionRoundsGroup;
    },
    enabled: !!focusedCondition && shouldFetchAnalysisRounds,
    staleTime: 30 * 1000,
  });

  return {
    conditionRoundGroups,
    workflowNodes,
    focusedConditionAnalysis,
    roundsLoading,
    roundsError,
    refetchRounds,
    focusedConditionAnalysisLoading,
    focusedConditionAnalysisError,
    refetchFocusedConditionAnalysis,
    shouldFetchDetailRounds,
    shouldFetchAnalysisRounds,
  };
};
