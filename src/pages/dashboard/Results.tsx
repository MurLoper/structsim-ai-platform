import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { OrderConditionSummary } from '@/api/results';
import { Activity, BarChart3, Boxes, FileStack, Gauge, Orbit } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { RESOURCES } from '@/locales';
import { useUIStore } from '@/stores';
import { useToast } from '@/components/ui';
import { ResultsAnalysisSection } from './components/results/ResultsAnalysisSection';
import { ResultsDetailSection } from './components/results/ResultsDetailSection';
import { ResultsErrorSection } from './components/results/ResultsErrorSection';
import { ResultsHeaderSection } from './components/results/ResultsHeaderSection';
import { ResultsInvalidState } from './components/results/ResultsInvalidState';
import { ResultsOverviewSection } from './components/results/ResultsOverviewSection';
import { useOrderConditionResubmit } from './hooks/useOrderConditionResubmit';
import { useResultsData } from './hooks/useResultsData';
import {
  trackResultsConditionFocus,
  trackResultsTabChange,
  trackResultsView,
} from '@/features/platform/tracking/domains/resultsTracking';

type ResultsTabKey = 'overview' | 'detail' | 'analysis';

const ORDER_STATUS_META: Record<
  number,
  { label: string; variant: 'default' | 'success' | 'warning' | 'error' }
> = {
  0: { label: '待运行', variant: 'default' },
  1: { label: '运行中', variant: 'warning' },
  2: { label: '已完成', variant: 'success' },
  3: { label: '失败', variant: 'error' },
  4: { label: '草稿', variant: 'default' },
  5: { label: '已取消', variant: 'error' },
};

const parseConditionLabel = (value?: string | null) => {
  const segments = String(value || '')
    .split('/')
    .map(item => item.trim())
    .filter(Boolean);

  return {
    fold: segments[0] || '目标姿态',
    sim: segments[1] || '仿真类型',
  };
};

const getBaseConditionTitle = (
  condition?: Partial<OrderConditionSummary> | null,
  fallbackLabel?: string | null
) => {
  const parsed = parseConditionLabel(fallbackLabel);
  const fold = condition?.foldTypeName || parsed.fold || `目标姿态#${condition?.foldTypeId ?? '-'}`;
  const sim = condition?.simTypeName || parsed.sim || `仿真类型#${condition?.simTypeId ?? '-'}`;
  return `${fold} / ${sim}`;
};

const getConditionTitle = (
  index: number,
  condition?: Partial<OrderConditionSummary> | null,
  fallbackLabel?: string | null
) => `工况 ${index} / ${getBaseConditionTitle(condition, fallbackLabel)}`;

interface ResultsProps {
  orderId?: number;
  onOpenEdit?: (orderId: number) => void;
  onClose?: () => void;
}

const Results: React.FC<ResultsProps> = ({ orderId: propOrderId, onOpenEdit, onClose }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useUIStore();
  const { showToast } = useToast();
  const t = useCallback((key: string) => RESOURCES[language]?.[key] || key, [language]);
  const orderId = propOrderId !== undefined ? propOrderId : Number(id);
  const resolvedOrderId = Number.isFinite(orderId) ? orderId : null;
  const [activeTab, setActiveTab] = useState<ResultsTabKey>('overview');

  const {
    displayOrderId,
    orderStatus,
    orderProgress,
    focusedConditionId,
    setFocusedConditionId,
    focusedCondition,
    focusedConditionAnalysis,
    metricLabelMap,
    conditionLabelMap,
    conditionResults,
    conditionRoundGroups,
    overviewStats,
    workflowNodes,
    updateConditionRoundsPage,
    updateConditionRoundsPageSize,
    isResultsLoading,
    resultsError,
    retryResults,
  } = useResultsData(resolvedOrderId, activeTab);

  const { resubmitCondition, isResubmittingCondition, resubmittingConditionId } =
    useOrderConditionResubmit({
      orderId: resolvedOrderId,
      onSuccess: () => showToast('success', t('res.resubmit.success')),
      onError: () => showToast('error', t('res.resubmit.failure')),
    });

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

  const orderStatusMeta = ORDER_STATUS_META[derivedOrderStatus] || ORDER_STATUS_META[0];

  const tabs = useMemo(
    () => [
      { key: 'overview', label: '概览', icon: <Boxes className="h-4 w-4" /> },
      { key: 'detail', label: '明细结果', icon: <FileStack className="h-4 w-4" /> },
      { key: 'analysis', label: '数据分析', icon: <BarChart3 className="h-4 w-4" /> },
    ],
    []
  );

  const summaryCards = useMemo(
    () => [
      { icon: <Boxes className="h-4 w-4" />, label: '工况数', value: overviewStats.conditionCount },
      { icon: <Orbit className="h-4 w-4" />, label: '总轮次', value: overviewStats.totalRounds },
      {
        icon: <Gauge className="h-4 w-4" />,
        label: '完成轮次',
        value: overviewStats.completedRounds,
      },
      {
        icon: <Activity className="h-4 w-4" />,
        label: '失败轮次',
        value: overviewStats.failedRounds,
      },
    ],
    [
      overviewStats.completedRounds,
      overviewStats.conditionCount,
      overviewStats.failedRounds,
      overviewStats.totalRounds,
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
          item.simTypeName || conditionLabelMap.get(item.id) || `工况 ${item.id}`;
        const statusMeta = ORDER_STATUS_META[item.status] || ORDER_STATUS_META[0];

        return {
          ...item,
          orderIndex: index + 1,
          detail,
          shortLabel: getBaseConditionTitle(detail, fallbackLabel),
          label: getConditionTitle(index + 1, detail, fallbackLabel),
          statusMeta,
          status: item.status,
          canResubmit: item.canResubmit === true,
        };
      }),
    [conditionDetailMap, conditionLabelMap, conditionResults]
  );

  const scaleChartData = useMemo(
    () =>
      conditionCards.map(item => ({
        conditionName:
          item.shortLabel.length > 18 ? `${item.shortLabel.slice(0, 18)}...` : item.shortLabel,
        value: item.totalRounds,
      })),
    [conditionCards]
  );

  const focusedGroup = useMemo(
    () =>
      conditionRoundGroups.find(group => group.conditionId === focusedConditionId) ||
      conditionRoundGroups[0] ||
      null,
    [conditionRoundGroups, focusedConditionId]
  );

  const focusedCard = useMemo(
    () =>
      conditionCards.find(item => item.id === (focusedConditionId || focusedGroup?.conditionId)) ||
      conditionCards[0] ||
      null,
    [conditionCards, focusedConditionId, focusedGroup]
  );

  const focusConditionLabel = focusedCard?.label || '--';

  const handleOpenCondition = useCallback(
    (conditionId: number, targetTab: 'detail' | 'analysis' = 'detail') => {
      if (resolvedOrderId) {
        trackResultsConditionFocus(resolvedOrderId, conditionId, 'overview');
      }
      setFocusedConditionId(conditionId);
      setActiveTab(targetTab);
    },
    [resolvedOrderId, setFocusedConditionId]
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
        focusedLabel={focusedCard?.label}
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
          runningRounds={overviewStats.runningRounds}
          workflowNodeCount={workflowNodes.length}
          focusConditionLabel={focusConditionLabel}
          scaleChartData={scaleChartData}
          conditionCards={conditionCards}
          onOpenCondition={handleOpenCondition}
          onResubmitCondition={resubmitCondition}
          resubmitLabel={t('res.resubmit')}
          resubmittingLabel={t('res.resubmitting')}
          resubmittingConditionId={resubmittingConditionId}
          isResubmittingCondition={isResubmittingCondition}
        />
      )}

      {activeTab === 'detail' && (
        <ResultsDetailSection
          conditionCards={conditionCards}
          focusedConditionId={focusedConditionId}
          focusedGroup={focusedGroup}
          focusConditionLabel={focusConditionLabel}
          isResultsLoading={isResultsLoading}
          onSelectCondition={setFocusedConditionId}
          onResubmitCondition={resubmitCondition}
          resubmitLabel={t('res.resubmit')}
          resubmittingLabel={t('res.resubmitting')}
          resubmittingConditionId={resubmittingConditionId}
          isResubmittingCondition={isResubmittingCondition}
          onPageChange={updateConditionRoundsPage}
          onPageSizeChange={updateConditionRoundsPageSize}
        />
      )}

      {activeTab === 'analysis' && (
        <ResultsAnalysisSection
          conditionCards={conditionCards}
          focusedConditionId={focusedConditionId}
          focusedCondition={focusedCondition}
          focusedConditionAnalysis={focusedConditionAnalysis}
          focusConditionLabel={focusConditionLabel}
          overviewResultSource={overviewStats.resultSource}
          metricLabelMap={metricLabelMap}
          isResultsLoading={isResultsLoading}
          onSelectCondition={setFocusedConditionId}
        />
      )}
    </div>
  );
};

export default Results;
