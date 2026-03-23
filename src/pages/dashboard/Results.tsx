import React, { useCallback, useMemo, useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import type { OrderConditionSummary } from '@/api/results';
import {
  Activity,
  BarChart3,
  Boxes,
  FileStack,
  Gauge,
  Orbit,
  ScanSearch,
  Sparkles,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BarChart } from '@/components/charts';
import { Badge, Button, Card, Tabs } from '@/components/ui';
import { RESOURCES } from '@/locales';
import { useUIStore } from '@/stores';
import { ConditionAnalysisWorkbench } from './components/ConditionAnalysisWorkbench';
import { ConditionResultTable } from './components/ConditionResultTable';
import { useResultsData } from './hooks/useResultsData';

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
) => `工况${index} / ${getBaseConditionTitle(condition, fallbackLabel)}`;

const Results: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useUIStore();
  const t = useCallback((key: string) => RESOURCES[language]?.[key] || key, [language]);
  const orderId = Number(id);
  const resolvedOrderId = Number.isFinite(orderId) ? orderId : null;
  const [activeTab, setActiveTab] = useState('overview');

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
  } = useResultsData(resolvedOrderId, activeTab as 'overview' | 'detail' | 'analysis');

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
      { key: 'overview', label: '一屏概览', icon: <Boxes className="h-4 w-4" /> },
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
      setFocusedConditionId(conditionId);
      setActiveTab(targetTab);
    },
    [setFocusedConditionId]
  );

  if (invalidOrderId) {
    return (
      <div className="animate-fade-in space-y-6">
        <Card className="rounded-[24px] border border-slate-200 bg-white/95 shadow-none">
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-4">
              <Link
                to="/orders"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                {t('res.back_to_orders')}
              </Link>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {t('res.summary.order_id')}
                </p>
                <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                  {t('res.invalid_title')}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-500">{t('res.invalid_desc')}</p>
              </div>
            </div>
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="text-sm text-slate-600">{t('res.error_desc')}</div>
              <Button className="mt-4" variant="secondary" onClick={() => navigate('/orders')}>
                {t('res.back_to_orders')}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-5">
      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.98)_0%,rgba(239,246,255,0.95)_100%)] px-5 py-4 shadow-[0_14px_34px_-26px_rgba(15,23,42,0.32)]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/orders"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                {t('res.back_to_orders')}
              </Link>
              <Badge variant={sourceVariant} size="sm">
                {sourceLabel}
              </Badge>
              <Badge variant={orderStatusMeta.variant} size="sm">
                {orderStatusMeta.label}
              </Badge>
              <Badge variant="info" size="sm">
                进度 {derivedOrderProgress}%
              </Badge>
            </div>

            {focusedCard ? (
              <div className="rounded-full border border-slate-200 bg-white/85 px-3 py-1.5 text-xs text-slate-600">
                当前工况：{focusedCard.label}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-1.5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                {t('res.summary.order_id')}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 lg:text-[30px]">
                结果页 / {displayOrderId}
              </h1>
              <p className="max-w-3xl text-sm text-slate-600">
                页面保留一屏概览、明细结果、数据分析三段工作流，顶部只保留必要状态，把主要可视区域让给下方
                tab 内容。
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[560px] xl:grid-cols-4">
              {summaryCards.map(card => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-slate-200/80 bg-white/85 px-3 py-3"
                >
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                    {card.icon}
                    <span>{card.label}</span>
                  </div>
                  <div className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
                    {card.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Tabs
        items={tabs}
        activeKey={activeTab}
        onChange={setActiveTab}
        variant="pills"
        className="inline-flex w-auto rounded-xl border border-slate-200 bg-white shadow-none"
      />

      {resultsError && (
        <Card className="border-red-200 bg-red-50 text-red-700 shadow-none">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-medium">{t('res.error_title')}</div>
              <div className="text-sm">{resultsErrorMessage}</div>
            </div>
            <Button variant="outline" onClick={retryResults}>
              {t('res.retry')}
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
            <Card className="shadow-none">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                  <Sparkles className="h-4 w-4 text-brand-500" />
                  <span>一屏总览</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  第一屏只看全局：工况数量、轮次规模、订单状态和当前聚焦工况。
                </p>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-900/50">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      订单进度
                    </div>
                    <div className="mt-2 text-2xl font-semibold tabular-nums">
                      {derivedOrderProgress}%
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-900/50">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      运行轮次
                    </div>
                    <div className="mt-2 text-2xl font-semibold tabular-nums">
                      {overviewStats.runningRounds}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-900/50">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      流程节点
                    </div>
                    <div className="mt-2 text-2xl font-semibold tabular-nums">
                      {workflowNodes.length}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-900/50">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      当前工况
                    </div>
                    <div className="mt-2 text-sm font-semibold">{focusConditionLabel}</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="shadow-none">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                  <Gauge className="h-4 w-4 text-brand-500" />
                  <span>轮次规模分布</span>
                </div>
                <div className="h-[280px]">
                  <BarChart
                    data={scaleChartData}
                    xField="conditionName"
                    yField="value"
                    showLegend={false}
                    barWidth={26}
                    height={280}
                  />
                </div>
              </div>
            </Card>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
              <Boxes className="h-4 w-4 text-brand-500" />
              <span>工况矩阵</span>
            </div>

            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {conditionCards.map(condition => (
                <Card key={condition.id} className="shadow-none">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="text-base font-semibold text-slate-900 dark:text-white">
                          {condition.label}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          总轮次 {condition.totalRounds.toLocaleString()}
                        </div>
                      </div>
                      <Badge variant={condition.statusMeta.variant} size="sm">
                        {condition.statusMeta.label}
                      </Badge>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-900/50">
                        <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                          完成
                        </div>
                        <div className="mt-2 font-medium tabular-nums">
                          {condition.completedRounds}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-900/50">
                        <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                          失败
                        </div>
                        <div className="mt-2 font-medium tabular-nums">
                          {condition.failedRounds}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-900/50">
                        <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                          进度
                        </div>
                        <div className="mt-2 font-medium tabular-nums">{condition.progress}%</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleOpenCondition(condition.id, 'detail')}
                      >
                        查看明细
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleOpenCondition(condition.id, 'analysis')}
                      >
                        进入分析
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === 'detail' && (
        <div className="grid gap-6 xl:grid-cols-[290px_minmax(0,1fr)]">
          <Card className="shadow-none">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                <FileStack className="h-4 w-4 text-brand-500" />
                <span>工况切换</span>
              </div>
              <div className="space-y-3">
                {conditionCards.map(condition => {
                  const active = condition.id === (focusedConditionId || focusedGroup?.conditionId);
                  return (
                    <button
                      key={condition.id}
                      type="button"
                      onClick={() => setFocusedConditionId(condition.id)}
                      className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors ${
                        active
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                          : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {condition.label}
                          </div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {condition.totalRounds.toLocaleString()} 轮
                          </div>
                        </div>
                        <Badge variant={condition.statusMeta.variant} size="sm">
                          {condition.statusMeta.label}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            {focusedGroup ? (
              <Card className="shadow-none">
                <ConditionResultTable
                  conditionId={focusedGroup.conditionId}
                  conditionName={focusConditionLabel}
                  condition={focusedGroup.orderCondition}
                  resultSource={focusedGroup.resultSource}
                  rounds={focusedGroup.rounds}
                  columns={focusedGroup.columns}
                  bestRoundIndex={null}
                  loading={isResultsLoading}
                  height={640}
                  page={focusedGroup.page}
                  pageSize={focusedGroup.pageSize}
                  total={focusedGroup.total}
                  totalPages={focusedGroup.totalPages}
                  onPageChange={page => updateConditionRoundsPage(focusedGroup.conditionId, page)}
                  onPageSizeChange={pageSize =>
                    updateConditionRoundsPageSize(focusedGroup.conditionId, pageSize)
                  }
                />
              </Card>
            ) : (
              <Card className="shadow-none">
                <div className="flex h-56 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                  {isResultsLoading ? '当前工况明细加载中...' : '当前工况暂无明细数据'}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-6">
          <Card className="shadow-none">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                  <ScanSearch className="h-4 w-4 text-brand-500" />
                  <span>数据分析入口</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  分析页一次只聚焦一个工况，默认拉取该工况完整轮次，用于图表、结果报告和预览表。
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {conditionCards.map(condition => (
                  <button
                    key={condition.id}
                    type="button"
                    onClick={() => setFocusedConditionId(condition.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      condition.id === focusedConditionId
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    {condition.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <ConditionAnalysisWorkbench
            condition={focusedConditionAnalysis?.orderCondition || focusedCondition || null}
            conditionTitle={focusConditionLabel}
            rounds={focusedConditionAnalysis?.rounds || []}
            resultSource={focusedConditionAnalysis?.resultSource || overviewStats.resultSource}
            total={focusedConditionAnalysis?.total || focusedCondition?.roundTotal || 0}
            loading={isResultsLoading}
            sampled={focusedConditionAnalysis?.sampled || false}
            metricLabelMap={metricLabelMap}
          />
        </div>
      )}
    </div>
  );
};

export default Results;
