import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutputDefs, useParamDefs } from '@/features/config/queries';
import { ordersApi, resultsApi } from '@/api';
import { queryKeys } from '@/lib/queryClient';
import type { OrderConditionSummary } from '@/api/results';
import {
  buildConditionResults,
  buildFocusedConditionResults,
  buildMetricLabelMap,
  buildOverviewStats,
} from './resultsConditionMappers';
import {
  buildAvgByCondition,
  buildResultRecords,
  buildTrendData,
  filterResultRecords,
  sampleChartResults,
} from './resultsMetricSelectors';
import type { ResultRecord } from './resultsAnalysisTypes';
import { useResultsRoundQueries } from './useResultsRoundQueries';
import { useResultsViewState } from './useResultsViewState';

export const useResultsData = (
  orderId: number | null,
  activeTab: 'overview' | 'detail' | 'analysis' = 'overview'
) => {
  const resolvedOrderId = orderId && Number.isFinite(orderId) ? orderId : null;

  const {
    data: outputDefs = [],
    error: outputDefsError,
    isLoading: outputDefsLoading,
    refetch: refetchOutputDefs,
  } = useOutputDefs();
  const {
    data: paramDefs = [],
    error: paramDefsError,
    isLoading: paramDefsLoading,
    refetch: refetchParamDefs,
  } = useParamDefs();

  const {
    data: orderDetail,
    error: orderError,
    isLoading: orderLoading,
    refetch: refetchOrder,
  } = useQuery({
    queryKey: resolvedOrderId
      ? queryKeys.orders.detail(resolvedOrderId)
      : ['orders', 'detail', 'none'],
    queryFn: async () => {
      if (!resolvedOrderId) return null;
      const response = await ordersApi.getOrder(resolvedOrderId);
      return response.data;
    },
    enabled: !!resolvedOrderId,
  });

  const {
    data: orderConditions = [],
    isLoading: orderConditionsLoading,
    error: orderConditionsError,
    refetch: refetchOrderConditions,
  } = useQuery({
    queryKey: ['results', 'orderConditions', resolvedOrderId],
    queryFn: async () => {
      if (!resolvedOrderId) return [] as OrderConditionSummary[];
      const response = await resultsApi.getOrderConditions(resolvedOrderId);
      return response.data || [];
    },
    enabled: !!resolvedOrderId,
    staleTime: 30 * 1000,
  });

  const { data: externalConditionSummaries = [], refetch: refetchExternalConditionSummaries } =
    useQuery({
      queryKey: ['results', 'orderConditionExternalSummaries', resolvedOrderId],
      queryFn: async () => {
        if (!resolvedOrderId) return [] as OrderConditionSummary[];
        const response = await resultsApi.getOrderConditionExternalSummaries(resolvedOrderId);
        return response.data || [];
      },
      enabled: !!resolvedOrderId && orderConditions.length > 0,
      staleTime: 30 * 1000,
    });

  const resolvedOrderConditions = useMemo(() => {
    if (!externalConditionSummaries.length) return orderConditions;
    const externalMap = new Map(externalConditionSummaries.map(item => [item.id, item]));
    return orderConditions.map(condition => {
      const external = externalMap.get(condition.id);
      if (!external) return condition;
      return {
        ...condition,
        ...external,
        conditionSnapshot: external.conditionSnapshot ?? condition.conditionSnapshot,
      };
    });
  }, [externalConditionSummaries, orderConditions]);

  const displayOrderId = orderDetail?.orderNo || (resolvedOrderId ? `#${resolvedOrderId}` : '-');
  const orderStatus = typeof orderDetail?.status === 'number' ? orderDetail.status : null;
  const orderProgress = typeof orderDetail?.progress === 'number' ? orderDetail.progress : null;

  const orderDetailConditionIds = useMemo(
    () =>
      Array.isArray(orderDetail?.conditions)
        ? orderDetail.conditions.map((item: { id: number }) => item.id)
        : [],
    [orderDetail]
  );

  const viewState = useResultsViewState({
    orderConditions: resolvedOrderConditions,
    orderDetailConditionIds,
  });

  const roundQueries = useResultsRoundQueries({
    resolvedOrderId,
    activeTab,
    focusedConditionId: viewState.focusedConditionId,
    focusedCondition: viewState.focusedCondition,
    conditionRoundPaging: viewState.conditionRoundPaging,
  });

  const metricLabelMap = useMemo(
    () =>
      buildMetricLabelMap(
        roundQueries.conditionRoundGroups,
        roundQueries.focusedConditionAnalysis,
        outputDefs
      ),
    [outputDefs, roundQueries.conditionRoundGroups, roundQueries.focusedConditionAnalysis]
  );

  const metricOptions = useMemo(
    () =>
      Array.from(metricLabelMap.entries()).map(([value, label]) => ({
        value,
        label,
      })),
    [metricLabelMap]
  );

  const [metric, setMetric] = useState('');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [minIteration, setMinIteration] = useState('');
  const [maxIteration, setMaxIteration] = useState('');

  useEffect(() => {
    if (!metricOptions.length) return;
    if (!metric || !metricOptions.some(option => option.value === metric)) {
      setMetric(metricOptions[0].value);
    }
  }, [metric, metricOptions]);

  const handleReset = () => {
    setMetric(metricOptions[0]?.value || '');
    viewState.setSelectedConditionIds(viewState.availableConditionIds);
    viewState.availableConditionIds.forEach(conditionId => {
      viewState.updateConditionRoundsPage(conditionId, 1);
    });
    setMinValue('');
    setMaxValue('');
    setMinIteration('');
    setMaxIteration('');
  };

  const conditionResults = useMemo(
    () => buildConditionResults(resolvedOrderConditions, roundQueries.conditionRoundGroups),
    [resolvedOrderConditions, roundQueries.conditionRoundGroups]
  );

  const overviewStats = useMemo(
    () => buildOverviewStats(resolvedOrderConditions),
    [resolvedOrderConditions]
  );

  const results = useMemo(
    () => buildResultRecords(metric, roundQueries.conditionRoundGroups),
    [metric, roundQueries.conditionRoundGroups]
  );

  const filteredResults = useMemo(
    () =>
      filterResultRecords(
        results,
        metric,
        viewState.selectedConditionIds,
        minValue,
        maxValue,
        minIteration,
        maxIteration
      ),
    [
      maxIteration,
      maxValue,
      metric,
      minIteration,
      minValue,
      results,
      viewState.selectedConditionIds,
    ]
  );

  const chartResults = useMemo(() => sampleChartResults(filteredResults), [filteredResults]);

  const trendData = useMemo(
    () => buildTrendData(chartResults, viewState.conditionLabelMap),
    [chartResults, viewState.conditionLabelMap]
  );

  const avgByCondition = useMemo(
    () => buildAvgByCondition(filteredResults, viewState.conditionLabelMap),
    [filteredResults, viewState.conditionLabelMap]
  );

  const focusedConditionResults = useMemo<ResultRecord[]>(
    () => buildFocusedConditionResults(metric, roundQueries.focusedConditionAnalysis),
    [metric, roundQueries.focusedConditionAnalysis]
  );

  const resultsError =
    outputDefsError ||
    paramDefsError ||
    orderError ||
    orderConditionsError ||
    roundQueries.roundsError ||
    roundQueries.focusedConditionAnalysisError;

  const retryResults = () => {
    void refetchOutputDefs();
    void refetchParamDefs();
    if (resolvedOrderId) {
      void refetchOrder();
      void refetchOrderConditions();
      void refetchExternalConditionSummaries();
      if (roundQueries.shouldFetchDetailRounds) {
        void roundQueries.refetchRounds();
      }
      if (viewState.focusedConditionId && roundQueries.shouldFetchAnalysisRounds) {
        void roundQueries.refetchFocusedConditionAnalysis();
      }
    }
  };

  return {
    displayOrderId,
    orderStatus,
    orderProgress,
    metric,
    setMetric,
    focusedConditionId: viewState.focusedConditionId,
    setFocusedConditionId: viewState.setFocusedConditionId,
    focusedCondition: viewState.focusedCondition,
    focusedConditionAnalysis: roundQueries.focusedConditionAnalysis,
    focusedConditionResults,
    metricOptions,
    metricLabelMap,
    conditionLabelMap: viewState.conditionLabelMap,
    selectedConditionIds: viewState.selectedConditionIds,
    toggleCondition: viewState.toggleCondition,
    minValue,
    setMinValue,
    maxValue,
    setMaxValue,
    minIteration,
    setMinIteration,
    maxIteration,
    setMaxIteration,
    availableConditions: viewState.availableConditions,
    availableConditionIds: viewState.availableConditionIds,
    filteredResults,
    trendData,
    avgByCondition,
    conditionResults,
    conditionRoundGroups: roundQueries.conditionRoundGroups,
    conditionRoundPaging: viewState.conditionRoundPaging,
    updateConditionRoundsPage: viewState.updateConditionRoundsPage,
    updateConditionRoundsPageSize: viewState.updateConditionRoundsPageSize,
    overviewStats,
    paramDefs,
    outputDefs,
    workflowNodes: roundQueries.workflowNodes,
    isResultsLoading:
      outputDefsLoading ||
      paramDefsLoading ||
      orderLoading ||
      orderConditionsLoading ||
      roundQueries.roundsLoading ||
      roundQueries.focusedConditionAnalysisLoading,
    resultsError,
    retryResults,
    handleReset,
  };
};
