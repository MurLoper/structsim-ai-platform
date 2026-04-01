import { RESULTS_CHART_MAX_POINTS } from '@/constants';
import type { ConditionRoundsGroup, ResultRecord } from './resultsAnalysisTypes';
import { buildConditionLabel } from './resultsConditionMappers';

export const buildResultRecords = (
  metric: string,
  conditionRoundGroups: ConditionRoundsGroup[]
): ResultRecord[] => {
  if (!metric || conditionRoundGroups.length === 0) {
    return [];
  }

  return conditionRoundGroups.flatMap(({ conditionId, rounds, orderCondition }) =>
    rounds
      .map(round => {
        const outputs = round.outputResults || {};
        const rawValue = outputs[metric];
        if (rawValue === undefined || rawValue === null) return null;
        const value = typeof rawValue === 'number' ? rawValue : Number(rawValue);
        if (!Number.isFinite(value)) return null;
        return {
          iteration: round.roundIndex,
          conditionId,
          metricKey: metric,
          value,
          conditionName: buildConditionLabel(orderCondition),
        } satisfies ResultRecord;
      })
      .filter((item): item is ResultRecord => Boolean(item))
  );
};

export const filterResultRecords = (
  results: ResultRecord[],
  metric: string,
  selectedConditionIds: number[],
  minValue: string,
  maxValue: string,
  minIteration: string,
  maxIteration: string
) => {
  const minVal = minValue ? Number(minValue) : Number.NEGATIVE_INFINITY;
  const maxVal = maxValue ? Number(maxValue) : Number.POSITIVE_INFINITY;
  const minIter = minIteration ? Number(minIteration) : Number.NEGATIVE_INFINITY;
  const maxIter = maxIteration ? Number(maxIteration) : Number.POSITIVE_INFINITY;
  const conditionSet = new Set(selectedConditionIds);

  return results.filter(record => {
    if (metric && record.metricKey !== metric) return false;
    if (conditionSet.size > 0 && !conditionSet.has(record.conditionId)) return false;
    if (record.value < minVal || record.value > maxVal) return false;
    if (record.iteration < minIter || record.iteration > maxIter) return false;
    return true;
  });
};

export const sampleChartResults = (filteredResults: ResultRecord[]) => {
  if (filteredResults.length <= RESULTS_CHART_MAX_POINTS) {
    return filteredResults;
  }

  const step = Math.ceil(filteredResults.length / RESULTS_CHART_MAX_POINTS);
  return filteredResults.filter((_, index) => index % step === 0);
};

export const buildTrendData = (
  chartResults: ResultRecord[],
  conditionLabelMap: Map<number, string>
) =>
  chartResults.map(record => ({
    iteration: record.iteration,
    conditionName: conditionLabelMap.get(record.conditionId) || String(record.conditionId),
    value: record.value,
  }));

export const buildAvgByCondition = (
  filteredResults: ResultRecord[],
  conditionLabelMap: Map<number, string>
) => {
  const map = new Map<number, { total: number; count: number }>();
  filteredResults.forEach(record => {
    const current = map.get(record.conditionId) || { total: 0, count: 0 };
    map.set(record.conditionId, {
      total: current.total + record.value,
      count: current.count + 1,
    });
  });

  return Array.from(map.entries()).map(([conditionId, stats]) => ({
    conditionName: conditionLabelMap.get(conditionId) || String(conditionId),
    value: stats.count ? Math.round((stats.total / stats.count) * 100) / 100 : 0,
  }));
};
