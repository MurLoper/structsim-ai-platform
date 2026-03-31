import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutputDefs, useParamDefs } from '@/features/config/queries';
import { ordersApi, resultsApi } from '@/api';
import { queryKeys } from '@/lib/queryClient';
import { PAGINATION, RESULTS_PAGE_SIZE } from '@/constants';
import type { OrderConditionSummary } from '@/api/results';
import {
  RESULTS_ANALYSIS_PAGE_SIZE,
  buildAvgByCondition,
  buildConditionLabel,
  buildConditionResults,
  buildFocusedConditionResults,
  buildMetricLabelMap,
  buildOverviewStats,
  buildResultRecords,
  buildTrendData,
  buildWorkflowNodesFromRounds,
  filterResultRecords,
  mapMockRoundToLegacyRound,
  sampleChartResults,
} from './resultsDataUtils';
import type {
  ConditionRoundPagingState,
  ConditionRoundsGroup,
  FullConditionRoundsGroup,
  ResultRecord,
} from './resultsDataUtils';

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

  const displayOrderId = orderDetail?.orderNo || (resolvedOrderId ? `#${resolvedOrderId}` : '-');
  const orderStatus = typeof orderDetail?.status === 'number' ? orderDetail.status : null;
  const orderProgress = typeof orderDetail?.progress === 'number' ? orderDetail.progress : null;

  const [metric, setMetric] = useState('');
  const [selectedConditionIds, setSelectedConditionIds] = useState<number[]>([]);
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [minIteration, setMinIteration] = useState('');
  const [maxIteration, setMaxIteration] = useState('');
  const [focusedConditionId, setFocusedConditionId] = useState<number | null>(null);
  const [conditionRoundPaging, setConditionRoundPaging] = useState<
    Record<number, ConditionRoundPagingState>
  >({});

  useEffect(() => {
    if (selectedConditionIds.length > 0) return;
    const fromConditions = orderConditions.map(item => item.id);
    const fromOrder = Array.isArray(orderDetail?.conditions)
      ? orderDetail.conditions.map((item: { id: number }) => item.id)
      : [];
    const defaults = fromConditions.length > 0 ? fromConditions : fromOrder;
    if (defaults.length > 0) {
      setSelectedConditionIds(defaults);
    }
  }, [orderConditions, orderDetail, selectedConditionIds.length]);

  useEffect(() => {
    if (!orderConditions.length) return;
    if (
      focusedConditionId &&
      orderConditions.some(condition => condition.id === focusedConditionId)
    ) {
      return;
    }
    setFocusedConditionId(orderConditions[0]?.id ?? null);
  }, [focusedConditionId, orderConditions]);

  const availableConditions = useMemo(
    () =>
      orderConditions.map(condition => ({
        id: condition.id,
        name: buildConditionLabel(condition),
      })),
    [orderConditions]
  );

  const availableConditionIds = useMemo(
    () => availableConditions.map(item => item.id),
    [availableConditions]
  );

  const conditionLabelMap = useMemo(
    () => new Map(availableConditions.map(item => [item.id, item.name])),
    [availableConditions]
  );

  const selectedConditions = useMemo(
    () => orderConditions.filter(condition => selectedConditionIds.includes(condition.id)),
    [orderConditions, selectedConditionIds]
  );

  useEffect(() => {
    if (selectedConditions.length === 0) return;
    setConditionRoundPaging(prev => {
      const next: Record<number, ConditionRoundPagingState> = {};
      selectedConditions.forEach(condition => {
        next[condition.id] = prev[condition.id] || {
          page: PAGINATION.DEFAULT_PAGE,
          pageSize: RESULTS_PAGE_SIZE,
        };
      });
      return next;
    });
  }, [selectedConditions]);

  const focusedCondition = useMemo(
    () => orderConditions.find(condition => condition.id === focusedConditionId) ?? null,
    [focusedConditionId, orderConditions]
  );

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

  const metricLabelMap = useMemo(
    () => buildMetricLabelMap(conditionRoundGroups, focusedConditionAnalysis, outputDefs),
    [conditionRoundGroups, focusedConditionAnalysis, outputDefs]
  );

  const metricOptions = useMemo(
    () =>
      Array.from(metricLabelMap.entries()).map(([value, label]) => ({
        value,
        label,
      })),
    [metricLabelMap]
  );

  useEffect(() => {
    if (!metricOptions.length) return;
    if (!metric || !metricLabelMap.has(metric)) {
      setMetric(metricOptions[0].value);
    }
  }, [metric, metricLabelMap, metricOptions]);

  const conditionResults = useMemo(
    () => buildConditionResults(orderConditions, conditionRoundGroups),
    [orderConditions, conditionRoundGroups]
  );

  const overviewStats = useMemo(() => buildOverviewStats(orderConditions), [orderConditions]);

  const results = useMemo(
    () => buildResultRecords(metric, conditionRoundGroups),
    [metric, conditionRoundGroups]
  );

  const filteredResults = useMemo(
    () =>
      filterResultRecords(
        results,
        metric,
        selectedConditionIds,
        minValue,
        maxValue,
        minIteration,
        maxIteration
      ),
    [results, metric, selectedConditionIds, minValue, maxValue, minIteration, maxIteration]
  );

  const chartResults = useMemo(() => sampleChartResults(filteredResults), [filteredResults]);

  const trendData = useMemo(
    () => buildTrendData(chartResults, conditionLabelMap),
    [chartResults, conditionLabelMap]
  );

  const avgByCondition = useMemo(
    () => buildAvgByCondition(filteredResults, conditionLabelMap),
    [filteredResults, conditionLabelMap]
  );

  const focusedConditionResults = useMemo<ResultRecord[]>(
    () => buildFocusedConditionResults(metric, focusedConditionAnalysis),
    [focusedConditionAnalysis, metric]
  );

  const toggleCondition = (value: number) => {
    setSelectedConditionIds(prev =>
      prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
    );
  };

  const handleReset = () => {
    setMetric(metricOptions[0]?.value || '');
    setSelectedConditionIds(availableConditionIds);
    setMinValue('');
    setMaxValue('');
    setMinIteration('');
    setMaxIteration('');
  };

  const updateConditionRoundsPage = (conditionId: number, page: number) => {
    setConditionRoundPaging(prev => ({
      ...prev,
      [conditionId]: {
        ...(prev[conditionId] || { pageSize: RESULTS_PAGE_SIZE }),
        page: Math.max(1, page),
      },
    }));
  };

  const updateConditionRoundsPageSize = (conditionId: number, pageSize: number) => {
    setConditionRoundPaging(prev => ({
      ...prev,
      [conditionId]: {
        page: PAGINATION.DEFAULT_PAGE,
        pageSize,
      },
    }));
  };

  const resultsError =
    outputDefsError ||
    paramDefsError ||
    orderError ||
    orderConditionsError ||
    roundsError ||
    focusedConditionAnalysisError;

  const retryResults = () => {
    void refetchOutputDefs();
    void refetchParamDefs();
    if (resolvedOrderId) {
      void refetchOrder();
      void refetchOrderConditions();
      if (shouldFetchDetailRounds) {
        void refetchRounds();
      }
      if (focusedConditionId && shouldFetchAnalysisRounds) {
        void refetchFocusedConditionAnalysis();
      }
    }
  };

  return {
    displayOrderId,
    orderStatus,
    orderProgress,
    metric,
    setMetric,
    focusedConditionId,
    setFocusedConditionId,
    focusedCondition,
    focusedConditionAnalysis,
    focusedConditionResults,
    metricOptions,
    metricLabelMap,
    conditionLabelMap,
    selectedConditionIds,
    toggleCondition,
    minValue,
    setMinValue,
    maxValue,
    setMaxValue,
    minIteration,
    setMinIteration,
    maxIteration,
    setMaxIteration,
    availableConditions,
    availableConditionIds,
    filteredResults,
    trendData,
    avgByCondition,
    conditionResults,
    conditionRoundGroups,
    conditionRoundPaging,
    updateConditionRoundsPage,
    updateConditionRoundsPageSize,
    overviewStats,
    paramDefs,
    outputDefs,
    workflowNodes,
    isResultsLoading:
      outputDefsLoading ||
      paramDefsLoading ||
      orderLoading ||
      orderConditionsLoading ||
      roundsLoading ||
      focusedConditionAnalysisLoading,
    resultsError,
    retryResults,
    handleReset,
  };
};
