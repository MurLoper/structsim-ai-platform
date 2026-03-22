import React, { useMemo, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores';
import { RESOURCES } from '@/locales';
import { Card, Tabs, Badge, Button, Input, Select } from '@/components/ui';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { VirtualTable } from '@/components/tables/VirtualTable';
import { useResultsData, type ResultRecord } from './hooks/useResultsData';
import { SimTypeResultTable } from './components/SimTypeResultTable';
import { ProcessFlowView } from './components/ProcessFlowView';
import type { ColumnDef } from '@tanstack/react-table';

const Results: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useUIStore();
  const t = useCallback((key: string) => RESOURCES[language]?.[key] || key, [language]);
  const orderId = Number(id);
  const resolvedOrderId = Number.isFinite(orderId) ? orderId : null;

  const {
    displayOrderId,
    metric,
    setMetric,
    metricOptions,
    metricLabelMap,
    schemeLabelMap,
    selectedSchemeIds,
    toggleScheme,
    minValue,
    setMinValue,
    maxValue,
    setMaxValue,
    minIteration,
    setMinIteration,
    maxIteration,
    setMaxIteration,
    availableSchemes,
    filteredResults,
    trendData,
    avgByScheme,
    schemeResults,
    schemeRoundGroups,
    overviewStats,
    paramDefs,
    outputDefs,
    workflowNodes,
    isResultsLoading,
    resultsError,
    retryResults,
    handleReset,
  } = useResultsData(resolvedOrderId);

  const [activeTab, setActiveTab] = useState('overview');
  const invalidOrderId = resolvedOrderId === null;
  const resultsErrorMessage = resultsError ? String(resultsError) : undefined;

  const tabs = useMemo(
    () => [
      { key: 'overview', label: t('res.tab.overview') },
      { key: 'analysis', label: t('res.tab.analysis') },
      { key: 'process', label: t('res.tab.process') },
    ],
    [t]
  );

  const downloadFile = useCallback((content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleExport = useCallback(
    (format: 'csv' | 'json') => {
      if (format === 'json') {
        const payload = filteredResults.map(record => ({
          iteration: record.iteration,
          schemeId: record.schemeId,
          schemeName: schemeLabelMap.get(record.schemeId) || String(record.schemeId),
          metricKey: record.metricKey,
          metric: metricLabelMap.get(record.metricKey) || String(record.metricKey),
          value: record.value,
          group: record.group,
        }));
        downloadFile(
          JSON.stringify(payload, null, 2),
          `results_${id || 'detail'}.json`,
          'application/json'
        );
        return;
      }

      const header = [
        t('res.table.iteration'),
        t('res.table.sim_type'),
        t('res.table.metric'),
        t('res.table.value'),
        t('res.table.group'),
      ];
      const rows = filteredResults.map(record => [
        record.iteration,
        schemeLabelMap.get(record.schemeId) || record.schemeId,
        metricLabelMap.get(record.metricKey) || record.metricKey,
        record.value,
        record.group,
      ]);
      const csvContent = [header, ...rows].map(row => row.join(',')).join('\n');
      downloadFile(csvContent, `results_${id || 'detail'}.csv`, 'text/csv');
    },
    [filteredResults, schemeLabelMap, metricLabelMap, t, id, downloadFile]
  );

  const selectedLabel = useMemo(
    () => t('res.filters.selected').replace('{count}', String(selectedSchemeIds.length)),
    [t, selectedSchemeIds.length]
  );

  const tableCountLabel = useMemo(
    () => t('res.table.count').replace('{count}', String(filteredResults.length)),
    [t, filteredResults.length]
  );

  const resultColumns = useMemo<ColumnDef<ResultRecord>[]>(
    () => [
      {
        header: t('res.table.iteration'),
        accessorKey: 'iteration',
      },
      {
        header: '工况方案',
        accessorKey: 'schemeId',
        cell: ({ row }) =>
          schemeLabelMap.get(row.original.schemeId) || String(row.original.schemeId),
      },
      {
        header: t('res.table.metric'),
        accessorKey: 'metricKey',
        cell: ({ row }) =>
          metricLabelMap.get(row.original.metricKey) || String(row.original.metricKey),
      },
      {
        header: t('res.table.value'),
        accessorKey: 'value',
        cell: ({ row }) => row.original.value.toFixed(2),
      },
      {
        header: '分组',
        accessorKey: 'group',
      },
    ],
    [metricLabelMap, schemeLabelMap, t]
  );

  if (invalidOrderId) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 eyecare:hover:bg-muted transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white eyecare:text-foreground">
              订单不存在
            </h1>
            <p className="text-slate-500 eyecare:text-muted-foreground text-sm">
              无效的订单 ID，请返回订单列表
            </p>
          </div>
        </div>
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-slate-600 eyecare:text-muted-foreground">
              无法加载结果数据。
            </div>
            <Button variant="secondary" onClick={() => navigate('/')}>
              返回列表
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 eyecare:hover:bg-muted transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white eyecare:text-foreground">
            {t('res.title')}: {displayOrderId}
          </h1>
          <p className="text-slate-500 eyecare:text-muted-foreground text-sm">
            当前页面优先展示工况方案级结果，开发环境由正式接口返回 mock 数据。
          </p>
        </div>
      </div>

      <Tabs items={tabs} activeKey={activeTab} onChange={setActiveTab} variant="pills" />

      {resultsError && (
        <Card className="border-red-200 bg-red-50 text-red-700">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-medium">结果加载失败</div>
              <div className="text-sm">{resultsErrorMessage || '请检查网络或稍后重试'}</div>
            </div>
            <Button variant="outline" onClick={retryResults}>
              重试
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <Card>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-brand-600">{overviewStats.schemeCount}</div>
                <div className="text-sm text-slate-500 eyecare:text-muted-foreground">
                  工况方案数
                </div>
              </div>
            </Card>
            <Card>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-green-600">{overviewStats.totalRounds}</div>
                <div className="text-sm text-slate-500 eyecare:text-muted-foreground">轮次总数</div>
              </div>
            </Card>
            <Card>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-red-600">{overviewStats.failedRounds}</div>
                <div className="text-sm text-slate-500 eyecare:text-muted-foreground">失败轮次</div>
              </div>
            </Card>
            <Card>
              <div className="text-center space-y-2">
                <Badge
                  variant={overviewStats.resultSource === 'mock' ? 'warning' : 'success'}
                  size="md"
                >
                  {overviewStats.resultSource.toUpperCase()}
                </Badge>
                <div className="text-sm text-slate-500 eyecare:text-muted-foreground">
                  当前结果源
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="success" size="sm">
                已完成 {overviewStats.completedRounds}
              </Badge>
              <Badge variant="warning" size="sm">
                运行中 {overviewStats.runningRounds}
              </Badge>
              <Badge variant="error" size="sm">
                失败 {overviewStats.failedRounds}
              </Badge>
              {overviewStats.runningModules.length > 0 && (
                <span className="text-sm text-slate-500 eyecare:text-muted-foreground">
                  当前运行模块：{overviewStats.runningModules.join(' / ')}
                </span>
              )}
            </div>
          </Card>

          {schemeRoundGroups.map(group => {
            const schemeId = group.schemeId;
            const schemeResult = schemeResults.find(result => result.simTypeId === schemeId);
            const schemeName = schemeLabelMap.get(schemeId) || `方案-${schemeId}`;
            return (
              <Card key={schemeId}>
                <SimTypeResultTable
                  schemeId={schemeId}
                  schemeName={schemeName}
                  condition={group.orderCondition}
                  resultSource={group.resultSource}
                  rounds={group.rounds}
                  paramDefs={paramDefs}
                  outputDefs={outputDefs}
                  bestRoundIndex={schemeResult?.bestRoundIndex}
                  loading={isResultsLoading}
                  height={Math.min(420, 96 + group.rounds.length * 40)}
                />
              </Card>
            );
          })}

          {schemeRoundGroups.length === 0 && !isResultsLoading && (
            <Card>
              <div className="h-32 flex items-center justify-center text-slate-500 eyecare:text-muted-foreground">
                暂无工况方案结果数据
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-6">
          <Card>
            <div className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="min-w-[220px]">
                  <Select
                    label={t('res.filters.metric')}
                    value={metric}
                    onChange={e => setMetric(e.target.value)}
                    options={metricOptions}
                  />
                </div>
                <div className="min-w-[140px]">
                  <Input
                    label={t('res.filters.min')}
                    type="number"
                    value={minValue}
                    onChange={e => setMinValue(e.target.value)}
                    placeholder={t('res.filters.unlimited')}
                  />
                </div>
                <div className="min-w-[140px]">
                  <Input
                    label={t('res.filters.max')}
                    type="number"
                    value={maxValue}
                    onChange={e => setMaxValue(e.target.value)}
                    placeholder={t('res.filters.unlimited')}
                  />
                </div>
                <div className="min-w-[140px]">
                  <Input
                    label={t('res.filters.iter_start')}
                    type="number"
                    value={minIteration}
                    onChange={e => setMinIteration(e.target.value)}
                    placeholder={t('res.filters.unlimited')}
                  />
                </div>
                <div className="min-w-[140px]">
                  <Input
                    label={t('res.filters.iter_end')}
                    type="number"
                    value={maxIteration}
                    onChange={e => setMaxIteration(e.target.value)}
                    placeholder={t('res.filters.unlimited')}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={handleReset}>
                    {t('res.filters.reset')}
                  </Button>
                  <Button variant="secondary" onClick={() => handleExport('csv')}>
                    {t('res.filters.export_csv')}
                  </Button>
                  <Button variant="secondary" onClick={() => handleExport('json')}>
                    {t('res.filters.export_json')}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-slate-500 eyecare:text-muted-foreground">
                  对比工况方案
                </span>
                {availableSchemes.map(simType => {
                  const active = selectedSchemeIds.includes(simType.id);
                  return (
                    <button
                      key={simType.id}
                      type="button"
                      onClick={() => toggleScheme(simType.id)}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        active
                          ? 'bg-brand-500 text-white border-brand-500'
                          : 'bg-white dark:bg-slate-800 eyecare:bg-card text-slate-600 eyecare:text-muted-foreground border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {simType.name}
                    </button>
                  );
                })}
                <Badge variant="default" size="sm">
                  {selectedLabel}
                </Badge>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="space-y-3">
                <h3 className="text-base font-semibold">{t('res.chart.trend')}</h3>
                <div className="h-[320px]">
                  <LineChart
                    data={trendData}
                    xField="iteration"
                    yField="value"
                    seriesField="schemeName"
                    showLegend
                    smooth
                    xAxisTitle={t('res.table.iteration')}
                    yAxisTitle={metricLabelMap.get(metric) || metric}
                    height={320}
                  />
                </div>
              </div>
            </Card>
            <Card>
              <div className="space-y-3">
                <h3 className="text-base font-semibold">{t('res.chart.avg')}</h3>
                <div className="h-[320px]">
                  <BarChart
                    data={avgByScheme}
                    xField="schemeName"
                    yField="value"
                    showLegend={false}
                    barWidth={32}
                    height={320}
                  />
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">工况方案指标明细</h3>
                <span className="text-sm text-slate-500 eyecare:text-muted-foreground">
                  {tableCountLabel}
                </span>
              </div>
              <VirtualTable
                data={filteredResults}
                columns={resultColumns}
                rowHeight={44}
                containerHeight={360}
                enableSorting={false}
                emptyText={t('res.table.empty')}
                loading={isResultsLoading}
                getRowId={record => `${record.schemeId}-${record.metricKey}-${record.iteration}`}
              />
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'process' && (
        <ProcessFlowView
          orderId={orderId}
          orderStatus={
            schemeResults.length > 0
              ? Math.max(...schemeResults.map(r => (r.status === 1 ? 1 : r.status)))
              : 0
          }
          orderProgress={
            schemeResults.length > 0
              ? Math.round(
                  schemeResults.reduce((sum, r) => sum + r.progress, 0) / schemeResults.length
                )
              : 0
          }
          schemeResults={schemeResults}
          schemeRoundGroups={schemeRoundGroups}
          schemeLabelMap={schemeLabelMap}
          workflowNodes={workflowNodes}
          loading={isResultsLoading}
        />
      )}
    </div>
  );
};

export default Results;
