import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { OrderCaseResult, OrderConditionSummary } from '@/api/results';
import { Activity, Boxes, FileStack, Gauge, Orbit } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';
import type { TranslationParams } from '@/locales';
import { ResultsDetailSection } from './components/results/ResultsDetailSection';
import { ResultsErrorSection } from './components/results/ResultsErrorSection';
import { ResultsHeaderSection } from './components/results/ResultsHeaderSection';
import { ResultsInvalidState } from './components/results/ResultsInvalidState';
import { ResultsOverviewSection } from './components/results/ResultsOverviewSection';
import type { ResultsCaseCard } from './components/results/types';
import { useResultsData } from './hooks/useResultsData';
import {
  trackResultsTabChange,
  trackResultsView,
} from '@/features/platform/tracking/domains/resultsTracking';

type ResultsTabKey = 'overview' | 'detail';
type Translator = (key: string, params?: TranslationParams) => string;

const getOrderStatusMeta = (
  t: Translator
): Record<number, { label: string; variant: 'default' | 'success' | 'warning' | 'error' }> => ({
  0: { label: t('res.status.not_started'), variant: 'default' },
  1: { label: t('res.status.running'), variant: 'warning' },
  2: { label: t('res.status.completed'), variant: 'success' },
  3: { label: t('res.status.failed'), variant: 'error' },
  4: { label: t('res.status.draft'), variant: 'default' },
  5: { label: t('res.status.cancelled'), variant: 'error' },
});

const parseConditionLabel = (value: string | null | undefined, t: Translator) => {
  const segments = String(value || '')
    .split('/')
    .map(item => item.trim())
    .filter(Boolean);

  return {
    fold: segments[0] || t('cfg.sect.loadcases'),
    sim: segments[1] || t('res.table.sim_type'),
  };
};

const getBaseConditionTitle = (
  condition?: Partial<OrderConditionSummary> | null,
  fallbackLabel?: string | null,
  t?: Translator
) => {
  const fallbackTranslator = t || ((key: string) => key);
  const parsed = parseConditionLabel(fallbackLabel, fallbackTranslator);
  const fold =
    condition?.foldTypeName ||
    parsed.fold ||
    `${fallbackTranslator('cfg.sect.loadcases')}#${condition?.foldTypeId ?? '-'}`;
  const sim =
    condition?.simTypeName ||
    parsed.sim ||
    `${fallbackTranslator('res.table.sim_type')}#${condition?.simTypeId ?? '-'}`;
  return `${fold} / ${sim}`;
};

const getConditionTitle = (
  index: number,
  condition?: Partial<OrderConditionSummary> | null,
  fallbackLabel?: string | null,
  t?: Translator
) =>
  `${t?.('res.case.condition_fallback', { index }) || `Condition ${index}`} / ${getBaseConditionTitle(
    condition,
    fallbackLabel,
    t
  )}`;

const getCaseLabel = (caseItem: OrderCaseResult) =>
  caseItem.caseName || `case-${caseItem.caseIndex || caseItem.id}`;

const sumBy = <T,>(items: T[], selector: (item: T) => number | null | undefined) =>
  items.reduce((sum, item) => sum + Number(selector(item) || 0), 0);

interface ResultsProps {
  orderId?: number;
  onOpenEdit?: (orderId: number) => void;
  onClose?: () => void;
}

const Results: React.FC<ResultsProps> = ({ orderId: propOrderId, onOpenEdit, onClose }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const orderId = propOrderId !== undefined ? propOrderId : Number(id);
  const resolvedOrderId = Number.isFinite(orderId) ? orderId : null;
  const [activeTab, setActiveTab] = useState<ResultsTabKey>('overview');
  const [activeCaseId, setActiveCaseId] = useState<number | null>(null);

  const {
    displayOrderId,
    orderStatus,
    orderProgress,
    setFocusedConditionId,
    focusedCondition,
    focusedConditionAnalysis,
    conditionLabelMap,
    conditionResults,
    conditionRoundGroups,
    resultCases,
    overviewStats,
    isResultsLoading,
    resultsError,
    retryResults,
  } = useResultsData(resolvedOrderId);

  const invalidOrderId = resolvedOrderId === null;
  const resultsErrorMessage = resultsError ? String(resultsError) : t('res.error_desc');
  const sourceVariant = overviewStats.resultSource === 'mock' ? 'warning' : 'success';
  const sourceLabel =
    overviewStats.resultSource === 'mock' ? t('res.source.mock') : t('res.source.live');

  const derivedOrderStatus = useMemo(() => {
    if (typeof orderStatus === 'number') return orderStatus;
    if (conditionResults.some(item => item.status === 1)) return 1;
    if (conditionResults.some(item => item.status === 3)) return 3;
    if (conditionResults.length > 0 && conditionResults.every(item => item.status === 2)) return 2;
    return conditionResults.length > 0 ? Math.max(...conditionResults.map(item => item.status)) : 0;
  }, [conditionResults, orderStatus]);

  const derivedOrderProgress = useMemo(() => {
    if (typeof orderProgress === 'number') return orderProgress;
    if (conditionResults.length === 0) return 0;
    return Math.round(
      conditionResults.reduce((sum, item) => sum + Number(item.progress || 0), 0) /
        conditionResults.length
    );
  }, [conditionResults, orderProgress]);

  const orderStatusMetaMap = useMemo(() => getOrderStatusMeta(t), [t]);
  const orderStatusMeta = orderStatusMetaMap[derivedOrderStatus] || orderStatusMetaMap[0];

  const tabs = useMemo(
    () => [
      { key: 'overview', label: t('res.tab.overview'), icon: <Boxes className="h-4 w-4" /> },
      { key: 'detail', label: t('res.matrix.tab.detail'), icon: <FileStack className="h-4 w-4" /> },
    ],
    [t]
  );

  const summaryCards = useMemo(
    () => [
      {
        icon: <Boxes className="h-4 w-4" />,
        label: t('res.summary.conditions'),
        value: overviewStats.conditionCount,
      },
      {
        icon: <Orbit className="h-4 w-4" />,
        label: t('res.summary.total_rounds'),
        value: overviewStats.totalRounds,
      },
      {
        icon: <Gauge className="h-4 w-4" />,
        label: t('res.summary.completed_rounds'),
        value: overviewStats.completedRounds,
      },
      {
        icon: <Activity className="h-4 w-4" />,
        label: t('res.summary.failed_rounds'),
        value: overviewStats.failedRounds,
      },
    ],
    [
      overviewStats.completedRounds,
      overviewStats.conditionCount,
      overviewStats.failedRounds,
      overviewStats.totalRounds,
      t,
    ]
  );

  const conditionDetailMap = useMemo(() => {
    const map = new Map<number, OrderConditionSummary>();
    conditionRoundGroups.forEach(group => {
      map.set(group.conditionId, group.orderCondition);
    });
    if (focusedCondition) {
      map.set(focusedCondition.id, focusedCondition);
    }
    if (focusedConditionAnalysis?.orderCondition) {
      map.set(focusedConditionAnalysis.orderCondition.id, focusedConditionAnalysis.orderCondition);
    }
    return map;
  }, [conditionRoundGroups, focusedCondition, focusedConditionAnalysis]);

  const conditionCards = useMemo(
    () =>
      conditionResults.map((item, index) => {
        const detail = conditionDetailMap.get(item.id);
        const fallbackLabel =
          item.simTypeName ||
          conditionLabelMap.get(item.id) ||
          t('res.case.condition_id_fallback', { id: item.id });
        const statusMeta = orderStatusMetaMap[item.status] || orderStatusMetaMap[0];

        return {
          ...item,
          orderIndex: index + 1,
          detail,
          shortLabel: getBaseConditionTitle(detail, fallbackLabel, t),
          label: getConditionTitle(index + 1, detail, fallbackLabel, t),
          caseId: detail?.caseId,
          caseIndex: detail?.caseIndex,
          statusMeta,
          status: item.status,
          canResubmit: item.canResubmit === true,
        };
      }),
    [conditionDetailMap, conditionLabelMap, conditionResults, orderStatusMetaMap, t]
  );

  const caseCards = useMemo<ResultsCaseCard[]>(() => {
    return resultCases.map(caseItem => {
      const caseGroups = conditionRoundGroups.filter(group => group.caseId === caseItem.id);
      const caseConditionIds = new Set([
        ...caseItem.conditions.map(condition => condition.id),
        ...caseGroups.map(group => group.conditionId),
      ]);
      const cards = conditionCards.filter(
        card => card.caseId === caseItem.id || caseConditionIds.has(card.id)
      );
      const statistics = caseItem.statistics || {};
      const totalRounds = Number(statistics.totalRounds ?? sumBy(cards, card => card.totalRounds));
      const completedRounds = Number(
        statistics.completedRounds ?? sumBy(cards, card => card.completedRounds)
      );
      const failedRounds = Number(
        statistics.failedRounds ?? sumBy(cards, card => card.failedRounds)
      );
      const runningRounds = Number(
        statistics.runningRounds ?? Math.max(totalRounds - completedRounds - failedRounds, 0)
      );
      const progress = Number(
        statistics.progressPercent ??
          caseItem.process ??
          (totalRounds > 0 ? Math.round((completedRounds / totalRounds) * 100) : 0)
      );
      const conditionCount = Math.max(caseItem.conditions.length, cards.length, caseGroups.length);
      const statusMeta = orderStatusMetaMap[caseItem.status] || orderStatusMetaMap[0];
      const conditionLabels = cards.length
        ? cards.map(card => card.shortLabel)
        : caseItem.conditions.map((condition, index) =>
            getConditionTitle(index + 1, condition, condition.simTypeName, t)
          );

      return {
        id: caseItem.id,
        label: getCaseLabel(caseItem),
        conditionCount,
        totalRounds,
        completedRounds,
        failedRounds,
        runningRounds,
        progress,
        status: caseItem.status,
        statusMeta,
        conditionLabels,
      };
    });
  }, [conditionCards, conditionRoundGroups, orderStatusMetaMap, resultCases, t]);

  useEffect(() => {
    if (!resultCases.length) {
      setActiveCaseId(null);
      return;
    }
    if (activeCaseId && resultCases.some(item => item.id === activeCaseId)) {
      return;
    }
    setActiveCaseId(resultCases[0].id);
  }, [activeCaseId, resultCases]);

  const activeCaseRoundGroups = useMemo(
    () =>
      activeCaseId
        ? conditionRoundGroups.filter(group => group.caseId === activeCaseId)
        : conditionRoundGroups,
    [activeCaseId, conditionRoundGroups]
  );

  const activeCaseConditionCards = useMemo(() => {
    const activeConditionIds = new Set(activeCaseRoundGroups.map(group => group.conditionId));
    return conditionCards.filter(item => activeConditionIds.has(item.id));
  }, [activeCaseRoundGroups, conditionCards]);

  const activeCaseCard = useMemo(
    () => caseCards.find(item => item.id === activeCaseId) || caseCards[0] || null,
    [activeCaseId, caseCards]
  );

  const handleSelectCase = useCallback(
    (caseId: number) => {
      setActiveCaseId(caseId);
      const firstGroup = conditionRoundGroups.find(group => group.caseId === caseId);
      if (firstGroup) {
        setFocusedConditionId(firstGroup.conditionId);
      }
    },
    [conditionRoundGroups, setFocusedConditionId]
  );

  const handleOpenCase = useCallback(
    (caseId: number) => {
      handleSelectCase(caseId);
      setActiveTab('detail');
    },
    [handleSelectCase]
  );

  useEffect(() => {
    if (resolvedOrderId) {
      trackResultsView(resolvedOrderId);
    }
  }, [resolvedOrderId]);

  useEffect(() => {
    if (resolvedOrderId) {
      trackResultsTabChange(resolvedOrderId, activeTab);
    }
  }, [activeTab, resolvedOrderId]);

  if (invalidOrderId) {
    return (
      <ResultsInvalidState
        backLabel={t('res.back_to_orders')}
        orderIdLabel={t('res.summary.order_id')}
        title={t('res.invalid_title')}
        description={t('res.invalid_desc')}
        errorDescription={t('res.error_desc')}
        onBack={() => {
          if (onClose) onClose();
          else navigate('/orders');
        }}
      />
    );
  }

  return (
    <div className="animate-fade-in space-y-4">
      <ResultsHeaderSection
        showBackLink={!propOrderId}
        backLabel={t('res.back_to_orders')}
        displayOrderId={displayOrderId}
        sourceVariant={sourceVariant}
        sourceLabel={sourceLabel}
        orderStatusMeta={orderStatusMeta}
        derivedOrderProgress={derivedOrderProgress}
        summaryCards={summaryCards}
        focusedLabel={activeCaseCard?.label}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={key => setActiveTab(key as ResultsTabKey)}
        onOpenEdit={onOpenEdit && resolvedOrderId ? () => onOpenEdit(resolvedOrderId) : undefined}
      />

      {resultsError && (
        <ResultsErrorSection
          title={t('res.error_title')}
          message={resultsErrorMessage}
          retryLabel={t('res.retry')}
          onRetry={retryResults}
        />
      )}

      {activeTab === 'overview' && (
        <ResultsOverviewSection
          derivedOrderProgress={derivedOrderProgress}
          caseCount={caseCards.length}
          conditionCount={overviewStats.conditionCount}
          totalRounds={overviewStats.totalRounds}
          completedRounds={overviewStats.completedRounds}
          failedRounds={overviewStats.failedRounds}
          caseCards={caseCards}
          onOpenCase={handleOpenCase}
        />
      )}

      {activeTab === 'detail' && (
        <ResultsDetailSection
          resultCases={resultCases}
          activeCaseId={activeCaseId}
          activeCaseRoundGroups={activeCaseRoundGroups}
          activeCaseConditionCards={activeCaseConditionCards}
          caseCards={caseCards}
          isResultsLoading={isResultsLoading}
          onSelectCase={handleSelectCase}
        />
      )}
    </div>
  );
};

export default Results;
