import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { resultsApi } from '@/api';
import type {
  OrderCaseResult,
  OrderConditionRoundsResponse,
  OrderConditionSummary,
} from '@/api/results';
import { buildWorkflowNodesFromRounds, mapMockRoundToLegacyRound } from './resultsConditionMappers';
import type { ConditionRoundsGroup } from './resultsAnalysisTypes';

interface UseResultsRoundQueriesOptions {
  resolvedOrderId: number | null;
}

const ROUND_QUERY_STALE_TIME = Infinity;
const ROUND_QUERY_GC_TIME = 30 * 60 * 1000;

const mapConditionRoundsGroup = (
  response: OrderConditionRoundsResponse,
  condition: OrderConditionSummary
): ConditionRoundsGroup => {
  const pageSize = Math.max(response.pageSize || response.items?.length || 0, 1);
  return {
    conditionId: condition.id,
    caseId: condition.caseId,
    caseIndex: condition.caseIndex,
    orderCondition: response.orderCondition || condition,
    resultSource: response.resultSource || 'mock',
    columns: response.columns || [],
    statistics: response.statistics,
    rounds: (response.items || []).map(item => mapMockRoundToLegacyRound(condition.id, item)),
    page: 1,
    pageSize,
    total: response.total || response.items?.length || 0,
    totalPages: 1,
  };
};

const flattenCaseRoundGroups = (cases: OrderCaseResult[]): ConditionRoundsGroup[] =>
  cases.flatMap(caseGroup =>
    (caseGroup.conditions || []).map(condition =>
      mapConditionRoundsGroup(condition.rounds, {
        ...condition,
        caseId: condition.caseId ?? caseGroup.id,
        caseIndex: condition.caseIndex ?? caseGroup.caseIndex,
      })
    )
  );

export const useResultsRoundQueries = ({ resolvedOrderId }: UseResultsRoundQueriesOptions) => {
  const {
    data: orderCaseResults,
    isLoading: roundsLoading,
    error: roundsError,
    refetch: refetchRounds,
  } = useQuery({
    queryKey: ['results', 'orderCaseResults', resolvedOrderId] as const,
    queryFn: async () => {
      if (!resolvedOrderId) return null;
      const response = await resultsApi.getOrderCaseResults(resolvedOrderId);
      return response.data || null;
    },
    enabled: !!resolvedOrderId,
    staleTime: ROUND_QUERY_STALE_TIME,
    gcTime: ROUND_QUERY_GC_TIME,
  });

  const resultCases = useMemo(() => orderCaseResults?.cases || [], [orderCaseResults?.cases]);

  const conditionRoundGroups = useMemo(() => flattenCaseRoundGroups(resultCases), [resultCases]);

  const workflowNodes = useMemo(
    () => buildWorkflowNodesFromRounds(conditionRoundGroups),
    [conditionRoundGroups]
  );

  return {
    resultCases,
    conditionRoundGroups,
    workflowNodes,
    roundsLoading,
    roundsError,
    refetchRounds,
    refetchFocusedConditionAnalysis: refetchRounds,
    shouldFetchDetailRounds: true,
    shouldFetchAnalysisRounds: true,
  };
};
