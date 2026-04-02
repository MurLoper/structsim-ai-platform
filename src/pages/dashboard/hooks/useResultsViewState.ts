import { useEffect, useMemo, useState } from 'react';
import { PAGINATION, RESULTS_PAGE_SIZE } from '@/constants';
import type { OrderConditionSummary } from '@/api/results';
import type { ConditionRoundPagingState } from './resultsAnalysisTypes';
import { buildConditionLabel } from './resultsConditionMappers';

interface UseResultsViewStateOptions {
  orderConditions: OrderConditionSummary[];
  orderDetailConditionIds: number[];
}

export const useResultsViewState = ({
  orderConditions,
  orderDetailConditionIds,
}: UseResultsViewStateOptions) => {
  const [selectedConditionIds, setSelectedConditionIds] = useState<number[]>([]);
  const [focusedConditionId, setFocusedConditionId] = useState<number | null>(null);
  const [conditionRoundPaging, setConditionRoundPaging] = useState<
    Record<number, ConditionRoundPagingState>
  >({});

  useEffect(() => {
    if (selectedConditionIds.length > 0) return;
    const defaultConditionIds =
      orderConditions.length > 0 ? orderConditions.map(item => item.id) : orderDetailConditionIds;
    if (defaultConditionIds.length > 0) {
      setSelectedConditionIds(defaultConditionIds);
    }
  }, [orderConditions, orderDetailConditionIds, selectedConditionIds.length]);

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

  const toggleCondition = (conditionId: number) => {
    setSelectedConditionIds(prev =>
      prev.includes(conditionId)
        ? prev.filter(item => item !== conditionId)
        : [...prev, conditionId]
    );
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

  return {
    selectedConditionIds,
    setSelectedConditionIds,
    toggleCondition,
    focusedConditionId,
    setFocusedConditionId,
    conditionRoundPaging,
    updateConditionRoundsPage,
    updateConditionRoundsPageSize,
    availableConditions,
    availableConditionIds,
    conditionLabelMap,
    selectedConditions,
    focusedCondition,
  };
};
