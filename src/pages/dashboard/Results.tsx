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
    filteredResults,
    trendData,
    avgBySimType,
    isResultsLoading,
    resultsError,
    retryResults,
    handleReset,
  } = useResultsData(resolvedOrderId);

  const [activeTab, setActiveTab] = useState('overview');
  const invalidOrderId = resolvedOrderId === null;
  const resultsErrorMessage = resultsError ? String(resultsError) : undefined;

  // 定义所有需要的函数和变量（在 early return 之前）
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
          simTypeId: record.simTypeId,
          simType: simTypeLabelMap.get(record.simTypeId) || String(record.simTypeId),
          metricId: record.metricId,
          metric: metricLabelMap.get(record.metricId) || String(record.metricId),
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
        simTypeLabelMap.get(record.simTypeId) || record.simTypeId,
        metricLabelMap.get(record.metricId) || record.metricId,
        record.value,
        record.group,
      ]);
      const csvContent = [header, ...rows].map(row => row.join(',')).join('\n');
      downloadFile(csvContent, `results_${id || 'detail'}.csv`, 'text/csv');
    },
    [filteredResults, simTypeLabelMap, metricLabelMap, t, id, downloadFile]
  );

  const selectedLabel = useMemo(
    () => t('res.filters.selected').replace('{count}', String(selectedSimTypes.length)),
    [t, selectedSimTypes.length]
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
        header: t('res.table.sim_type'),
        accessorKey: 'simTypeId',
        cell: ({ row }) =>
          simTypeLabelMap.get(row.original.simTypeId) || String(row.original.simTypeId),
      },
      {
        header: t('res.table.metric'),
        accessorKey: 'metricId',
        cell: ({ row }) =>
          metricLabelMap.get(row.original.metricId) || String(row.original.metricId),
      },
      {
        header: t('res.table.value'),
        accessorKey: 'value',
        cell: ({ row }) => row.original.value.toFixed(2),
      },
      {
        header: t('res.table.group'),
        accessorKey: 'group',
      },
    ],
    [metricLabelMap, simTypeLabelMap, t]
  );

  // Early return 必须在所有 hooks 之后
  if (invalidOrderId) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">订单不存在</h1>
            <p className="text-slate-500 text-sm">无效的订单ID，请返回订单列表</p>
          </div>
        </div>
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-slate-600">无法加载结果数据。</div>
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
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t('res.title')}: {displayOrderId}
          </h1>
          <p className="text-slate-500 text-sm">{t('res.report')}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-brand-600">30</div>
              <div className="text-sm text-slate-500">{t('res.iterations')}</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">#12</div>
              <div className="text-sm text-slate-500">{t('res.best')}</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <Badge variant="success" size="md">
                {t('res.status.success')}
              </Badge>
              <div className="text-sm text-slate-500 mt-2">{t('res.status')}</div>
            </div>
          </Card>
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
                <span className="text-sm text-slate-500">{t('res.filters.sim_compare')}</span>
                {availableSimTypes.map(simType => {
                  const active = selectedSimTypes.includes(simType.id);
                  return (
                    <button
                      key={simType.id}
                      type="button"
                      onClick={() => toggleSimType(simType.id)}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        active
                          ? 'bg-brand-500 text-white border-brand-500'
                          : 'bg-white dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-600'
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
                    seriesField="simType"
                    showLegend
                    smooth
                    xAxisTitle={t('res.table.iteration')}
                    yAxisTitle={metricLabelMap.get(Number(metric)) || metric}
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
                    data={avgBySimType}
                    xField="simType"
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
                <h3 className="text-base font-semibold">{t('res.table.title')}</h3>
                <span className="text-sm text-slate-500">{tableCountLabel}</span>
              </div>
              <VirtualTable
                data={filteredResults}
                columns={resultColumns}
                rowHeight={44}
                containerHeight={360}
                enableSorting={false}
                emptyText={t('res.table.empty')}
                loading={isResultsLoading}
                getRowId={record => `${record.simTypeId}-${record.metricId}-${record.iteration}`}
              />
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'process' && (
        <Card>
          <div className="h-64 flex items-center justify-center text-slate-500">
            Process workflow visualization will be displayed here
          </div>
        </Card>
      )}
    </div>
  );
};

export default Results;
