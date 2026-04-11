import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { resultsApi } from '@/api';
import { PAGINATION, RESULTS_PAGE_SIZE } from '@/constants';
import type { OrderConditionRoundsResponse, OrderConditionSummary } from '@/api/results';
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

const ROUND_QUERY_STALE_TIME = Infinity;
const ROUND_QUERY_GC_TIME = 30 * 60 * 1000;

const buildRoundQueryKey = (
  orderId: number | null,
  conditionId: number | null,
  page: number,
  pageSize: number,
  status?: number
) => ['results', 'conditionRounds', orderId, conditionId, page, pageSize, status ?? 'all'] as const;

const getDetailPaging = (
  condition: OrderConditionSummary | null,
  conditionRoundPaging: Record<number, ConditionRoundPagingState>
) =>
  condition
    ? conditionRoundPaging[condition.id] || {
        page: PAGINATION.DEFAULT_PAGE,
        pageSize: RESULTS_PAGE_SIZE,
      }
    : {
        page: PAGINATION.DEFAULT_PAGE,
        pageSize: RESULTS_PAGE_SIZE,
      };

const getAnalysisPaging = (condition: OrderConditionSummary | null) => {
  const expectedTotal = Math.max(Number(condition?.roundTotal || 0), 1);
  return {
    page: PAGINATION.DEFAULT_PAGE,
    pageSize: Math.min(Math.max(expectedTotal, RESULTS_PAGE_SIZE), RESULTS_ANALYSIS_PAGE_SIZE),
    expectedTotal,
  };
};

const fetchConditionRounds = async (
  condition: OrderConditionSummary,
  page: number,
  pageSize: number
) => {
  const response = await resultsApi.getOrderConditionRounds(condition.id, { page, pageSize });
  return response.data || null;
};

const mapConditionRoundsGroup = (
  response: OrderConditionRoundsResponse,
  condition: OrderConditionSummary,
  fallbackPage: number,
  fallbackPageSize: number
): ConditionRoundsGroup => ({
  conditionId: condition.id,
  orderCondition: response.orderCondition || condition,
  resultSource: response.resultSource || 'mock',
  columns: response.columns || [],
  statistics: response.statistics,
  rounds: (response.items || []).map(item => mapMockRoundToLegacyRound(condition.id, item)),
  page: response.page || fallbackPage,
  pageSize: response.pageSize || fallbackPageSize,
  total: response.total || 0,
  totalPages: response.totalPages || 0,
});

const mapFullConditionRoundsGroup = (
  response: OrderConditionRoundsResponse,
  condition: OrderConditionSummary,
  fallbackPageSize: number,
  expectedTotal: number
): FullConditionRoundsGroup => ({
  ...mapConditionRoundsGroup(response, condition, PAGINATION.DEFAULT_PAGE, fallbackPageSize),
  total: response.total || expectedTotal,
  totalPages: response.totalPages || 1,
  sampled: (response.total || expectedTotal) > fallbackPageSize,
});

export const useResultsRoundQueries = ({
  resolvedOrderId,
  activeTab,
  focusedConditionId,
  focusedCondition,
  conditionRoundPaging,
}: UseResultsRoundQueriesOptions) => {
  const shouldFetchDetailRounds = activeTab === 'detail';
  const shouldFetchAnalysisRounds = activeTab === 'analysis';
  const detailPaging = getDetailPaging(focusedCondition, conditionRoundPaging);
  const analysisPaging = getAnalysisPaging(focusedCondition);

  const {
    data: conditionRoundGroups = [],
    isLoading: roundsLoading,
    error: roundsError,
    refetch: refetchRounds,
  } = useQuery({
    queryKey: buildRoundQueryKey(
      resolvedOrderId,
      focusedConditionId,
      detailPaging.page,
      detailPaging.pageSize
    ),
    queryFn: async () => {
      if (!focusedCondition) return null;
      return fetchConditionRounds(focusedCondition, detailPaging.page, detailPaging.pageSize);
    },
    select: response =>
      response && focusedCondition
        ? [
            mapConditionRoundsGroup(
              response,
              focusedCondition,
              detailPaging.page,
              detailPaging.pageSize
            ),
          ]
        : [],
    enabled: !!resolvedOrderId && !!focusedCondition && shouldFetchDetailRounds,
    staleTime: ROUND_QUERY_STALE_TIME,
    gcTime: ROUND_QUERY_GC_TIME,
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
    queryKey: buildRoundQueryKey(
      resolvedOrderId,
      focusedConditionId,
      analysisPaging.page,
      analysisPaging.pageSize
    ),
    queryFn: async () => {
      if (!focusedCondition) return null;
      return fetchConditionRounds(focusedCondition, analysisPaging.page, analysisPaging.pageSize);
    },
    select: response =>
      response && focusedCondition
        ? mapFullConditionRoundsGroup(
            response,
            focusedCondition,
            analysisPaging.pageSize,
            analysisPaging.expectedTotal
          )
        : null,
    enabled: !!resolvedOrderId && !!focusedCondition && shouldFetchAnalysisRounds,
    staleTime: ROUND_QUERY_STALE_TIME,
    gcTime: ROUND_QUERY_GC_TIME,
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
