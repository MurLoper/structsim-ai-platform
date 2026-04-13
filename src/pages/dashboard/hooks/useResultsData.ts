import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutputDefs, useParamDefs } from '@/features/config/queries';
import { ordersApi } from '@/api';
import { queryKeys } from '@/lib/queryClient';
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
import type {
  ConditionRoundsGroup,
  FullConditionRoundsGroup,
  ResultRecord,
} from './resultsAnalysisTypes';
import { useResultsRoundQueries } from './useResultsRoundQueries';
import { useResultsViewState } from './useResultsViewState';

export const useResultsData = (orderId: number | null) => {
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

  const roundQueries = useResultsRoundQueries({ resolvedOrderId });

  const resolvedOrderConditions = useMemo(() => {
    const map = new Map<number, ConditionRoundsGroup['orderCondition']>();
    roundQueries.conditionRoundGroups.forEach(group => {
      map.set(group.orderCondition.id, group.orderCondition);
    });
    return Array.from(map.values());
  }, [roundQueries.conditionRoundGroups]);

  const displayOrderId = orderDetail?.orderNo || (resolvedOrderId ? `#${resolvedOrderId}` : '-');
  const orderStatus = typeof orderDetail?.status === 'number' ? orderDetail.status : null;
  const orderProgress = typeof orderDetail?.progress === 'number' ? orderDetail.progress : null;

  const viewState = useResultsViewState({
    orderConditions: resolvedOrderConditions,
  });

  const focusedConditionAnalysis = useMemo<FullConditionRoundsGroup | null>(() => {
    const focusedGroup =
      roundQueries.conditionRoundGroups.find(
        group => group.conditionId === viewState.focusedConditionId
      ) ||
      roundQueries.conditionRoundGroups[0] ||
      null;
    if (!focusedGroup) return null;
    return {
      ...focusedGroup,
      sampled: false,
    };
  }, [roundQueries.conditionRoundGroups, viewState.focusedConditionId]);

  const metricLabelMap = useMemo(
    () =>
      buildMetricLabelMap(roundQueries.conditionRoundGroups, focusedConditionAnalysis, outputDefs),
    [outputDefs, roundQueries.conditionRoundGroups, focusedConditionAnalysis]
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
    () => buildFocusedConditionResults(metric, focusedConditionAnalysis),
    [metric, focusedConditionAnalysis]
  );

  const resultsError = outputDefsError || paramDefsError || orderError || roundQueries.roundsError;

  const retryResults = () => {
    void refetchOutputDefs();
    void refetchParamDefs();
    if (resolvedOrderId) {
      void refetchOrder();
      void roundQueries.refetchRounds();
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
    focusedConditionAnalysis,
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
    resultCases: roundQueries.resultCases,
    conditionRoundPaging: viewState.conditionRoundPaging,
    updateConditionRoundsPage: viewState.updateConditionRoundsPage,
    updateConditionRoundsPageSize: viewState.updateConditionRoundsPageSize,
    overviewStats,
    paramDefs,
    outputDefs,
    workflowNodes: roundQueries.workflowNodes,
    isResultsLoading:
      outputDefsLoading || paramDefsLoading || orderLoading || roundQueries.roundsLoading,
    resultsError,
    retryResults,
    handleReset,
  };
};
