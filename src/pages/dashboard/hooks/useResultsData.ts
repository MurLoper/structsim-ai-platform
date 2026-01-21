import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSimTypes, useOutputDefs } from '@/features/config/queries';
import { ordersApi, apiClient } from '@/api';
import { queryKeys } from '@/lib/queryClient';
import { LEGACY_API_BASE_URL, RESULTS_PAGE_SIZE, RESULTS_CHART_MAX_POINTS, PAGINATION } from '@/constants';


export interface ResultRecord {
  iteration: number;
  simTypeId: number;
  metricId: number;
  value: number;
  group: string;
}

interface SimTypeResult {
  id: number;
  orderId: number;
  simTypeId: number;
  status: number;
  progress: number;
  totalRounds: number;
  completedRounds: number;
  failedRounds: number;
}

interface RoundItem {
  id: number;
  roundIndex: number;
  params?: Record<string, number | string> | null;
  outputs?: Record<string, number | string> | null;
  status?: number;
}

interface RoundListResponse {
  items: RoundItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface RoundsGroup {
  simTypeId: number;
  rounds: RoundItem[];
}

export const useResultsData = (orderId: number | null) => {
  const resolvedOrderId = orderId && Number.isFinite(orderId) ? orderId : null;
  const {
    data: simTypes = [],
    error: simTypesError,
    isLoading: simTypesLoading,
    refetch: refetchSimTypes,
  } = useSimTypes();
  const {
    data: outputDefs = [],
    error: outputDefsError,
    isLoading: outputDefsLoading,
    refetch: refetchOutputDefs,
  } = useOutputDefs();

  const {
    data: orderDetail,
    error: orderError,
    isLoading: orderLoading,
    refetch: refetchOrder,
  } = useQuery({
    queryKey: resolvedOrderId ? queryKeys.orders.detail(resolvedOrderId) : ['orders', 'detail', 'none'],
    queryFn: async () => {
      if (!resolvedOrderId) return null;
      const response = await ordersApi.getOrder(resolvedOrderId);
      return response.data;
    },
    enabled: !!resolvedOrderId,
  });

  const {
    data: simTypeResults = [],
    isLoading: simTypeResultsLoading,
    error: simTypeResultsError,
    refetch: refetchSimTypeResults,
  } = useQuery({
    queryKey: ['results', 'simTypes', resolvedOrderId],
    queryFn: async () => {
      if (!resolvedOrderId) return [];
      const response = await apiClient.get<SimTypeResult[]>(
        `${LEGACY_API_BASE_URL}/results/order/${resolvedOrderId}/sim-types`
      );
      return response.data || [];
    },
    enabled: !!resolvedOrderId,
    staleTime: 30 * 1000,
  });


  const displayOrderId = orderDetail?.orderNo || (resolvedOrderId ? `#${resolvedOrderId}` : '-');

  const [metric, setMetric] = useState('');
  const [selectedSimTypes, setSelectedSimTypes] = useState<number[]>([]);
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [minIteration, setMinIteration] = useState('');
  const [maxIteration, setMaxIteration] = useState('');

  useEffect(() => {
    if (!metric && outputDefs.length > 0) {
      setMetric(String(outputDefs[0].id));
    }
  }, [metric, outputDefs]);

  useEffect(() => {
    if (selectedSimTypes.length > 0) return;
    const fromOrder = orderDetail?.simTypeIds?.length ? orderDetail.simTypeIds : [];
    const fallback = simTypeResults.map(result => result.simTypeId);
    const defaults = fromOrder.length > 0 ? fromOrder : fallback;
    if (defaults.length > 0) {
      setSelectedSimTypes(defaults);
    }
  }, [orderDetail, simTypeResults, selectedSimTypes.length]);

  const availableSimTypeIds = useMemo(() => {
    if (orderDetail?.simTypeIds?.length) return orderDetail.simTypeIds;
    if (simTypeResults.length) return simTypeResults.map(result => result.simTypeId);
    return simTypes.map(simType => simType.id);
  }, [orderDetail, simTypeResults, simTypes]);

  const availableSimTypes = useMemo(
    () => simTypes.filter(simType => availableSimTypeIds.includes(simType.id)),
    [simTypes, availableSimTypeIds]
  );

  const selectedSimTypeResults = useMemo(
    () => simTypeResults.filter(result => selectedSimTypes.includes(result.simTypeId)),
    [simTypeResults, selectedSimTypes]
  );

  const {
    data: roundsBySimType = [],
    isLoading: roundsLoading,
    error: roundsError,
    refetch: refetchRounds,
  } = useQuery({
    queryKey: ['results', 'rounds', resolvedOrderId, selectedSimTypes],
    queryFn: async () => {
      if (!resolvedOrderId || selectedSimTypeResults.length === 0) return [] as RoundsGroup[];
      const responses = await Promise.all(
        selectedSimTypeResults.map(async result => {
          const response = await apiClient.get<RoundListResponse>(
            `${LEGACY_API_BASE_URL}/results/sim-type/${result.id}/rounds`,
            { params: { page: PAGINATION.DEFAULT_PAGE, pageSize: RESULTS_PAGE_SIZE } }
          );
          return {
            simTypeId: result.simTypeId,
            rounds: response.data?.items || [],
          };
        })
      );
      return responses;
    },
    enabled: !!resolvedOrderId && selectedSimTypeResults.length > 0,
    staleTime: 30 * 1000,
  });


  const simTypeLabelMap = useMemo(
    () => new Map(availableSimTypes.map(simType => [simType.id, simType.name])),
    [availableSimTypes]
  );

  const metricLabelMap = useMemo(
    () => new Map(outputDefs.map(def => [def.id, def.name])),
    [outputDefs]
  );

  const metricOptions = useMemo(
    () => outputDefs.map(def => ({ value: String(def.id), label: def.name })),
    [outputDefs]
  );

  const results = useMemo(() => {
    const metricId = Number(metric);
    if (!metricId || roundsBySimType.length === 0) return [] as ResultRecord[];

    return roundsBySimType.flatMap(({ simTypeId, rounds }) =>
      rounds
        .map(round => {
          const outputs = round.outputs || {};
          const rawValue =
            outputs[String(metricId)] ??
            (outputs as Record<string, number | string>)[metricId as unknown as string];
          if (rawValue === undefined || rawValue === null) return null;
          const value = typeof rawValue === 'number' ? rawValue : Number(rawValue);
          if (!Number.isFinite(value)) return null;
          return {
            iteration: round.roundIndex,
            simTypeId,
            metricId,
            value,
            group: `S-${simTypeId}`,
          } as ResultRecord;
        })
        .filter((item): item is ResultRecord => Boolean(item))
    );
  }, [metric, roundsBySimType]);

  const filteredResults = useMemo(() => {
    const minVal = minValue ? Number(minValue) : Number.NEGATIVE_INFINITY;
    const maxVal = maxValue ? Number(maxValue) : Number.POSITIVE_INFINITY;
    const minIter = minIteration ? Number(minIteration) : Number.NEGATIVE_INFINITY;
    const maxIter = maxIteration ? Number(maxIteration) : Number.POSITIVE_INFINITY;
    const metricId = Number(metric);
    const simTypeSet = new Set(selectedSimTypes);

    return results.filter(record => {
      if (metricId && record.metricId !== metricId) return false;
      if (simTypeSet.size > 0 && !simTypeSet.has(record.simTypeId)) return false;
      if (record.value < minVal || record.value > maxVal) return false;
      if (record.iteration < minIter || record.iteration > maxIter) return false;
      return true;
    });
  }, [results, metric, selectedSimTypes, minValue, maxValue, minIteration, maxIteration]);

  const chartResults = useMemo(() => {
    if (filteredResults.length <= RESULTS_CHART_MAX_POINTS) {
      return filteredResults;
    }
    const step = Math.ceil(filteredResults.length / RESULTS_CHART_MAX_POINTS);
    return filteredResults.filter((_, index) => index % step === 0);
  }, [filteredResults]);

  const trendData = useMemo(
    () =>
      chartResults.map(record => ({
        iteration: record.iteration,
        simType: simTypeLabelMap.get(record.simTypeId) || String(record.simTypeId),
        value: record.value,
      })),
    [chartResults, simTypeLabelMap]
  );


  const avgBySimType = useMemo(() => {
    const map = new Map<number, { total: number; count: number }>();
    filteredResults.forEach(record => {
      const current = map.get(record.simTypeId) || { total: 0, count: 0 };
      map.set(record.simTypeId, { total: current.total + record.value, count: current.count + 1 });
    });
    return Array.from(map.entries()).map(([simTypeId, stats]) => ({
      simType: simTypeLabelMap.get(simTypeId) || String(simTypeId),
      value: stats.count ? Math.round((stats.total / stats.count) * 100) / 100 : 0,
    }));
  }, [filteredResults, simTypeLabelMap]);

  const toggleSimType = (value: number) => {
    setSelectedSimTypes(prev =>
      prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
    );
  };

  const handleReset = () => {
    setMetric(metricOptions[0]?.value || '');
    setSelectedSimTypes(availableSimTypeIds);
    setMinValue('');
    setMaxValue('');
    setMinIteration('');
    setMaxIteration('');
  };

  const resultsError =
    simTypesError || outputDefsError || orderError || simTypeResultsError || roundsError;
  const retryResults = () => {
    void refetchSimTypes();
    void refetchOutputDefs();
    if (resolvedOrderId) {
      void refetchOrder();
      void refetchSimTypeResults();
      void refetchRounds();
    }
  };

  return {
    displayOrderId,
    metric,
    setMetric,
    metricOptions,
    metricLabelMap,
    simTypeLabelMap,
    selectedSimTypes,
    toggleSimType,
    minValue,
    setMinValue,
    maxValue,
    setMaxValue,
    minIteration,
    setMinIteration,
    maxIteration,
    setMaxIteration,
    availableSimTypes,
    availableSimTypeIds,
    filteredResults,
    trendData,
    avgBySimType,
    isResultsLoading:
      simTypesLoading || outputDefsLoading || orderLoading || simTypeResultsLoading || roundsLoading,
    resultsError,
    retryResults,
    handleReset,
  };
};

