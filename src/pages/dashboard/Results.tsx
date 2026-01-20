import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUIStore } from '@/stores';
import { RESOURCES } from '@/locales';
import { Card, Tabs, Badge, Button, Input, Select, Table } from '@/components/ui';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface ResultRecord {
  iteration: number;
  simType: string;
  metric: string;
  value: number;
  group: string;
}

const SIM_TYPE_OPTIONS = [
  { value: 'struct', labelKey: 'res.sim.struct' },
  { value: 'thermal', labelKey: 'res.sim.thermal' },
  { value: 'modal', labelKey: 'res.sim.modal' },
];

const METRIC_OPTIONS = [
  { value: 'stress', labelKey: 'res.metric.stress' },
  { value: 'displacement', labelKey: 'res.metric.displacement' },
  { value: 'mass', labelKey: 'res.metric.mass' },
];

const buildMockResults = () => {
  const data: ResultRecord[] = [];
  SIM_TYPE_OPTIONS.forEach((simType, simIndex) => {
    METRIC_OPTIONS.forEach((metric, metricIndex) => {
      for (let i = 1; i <= 30; i += 1) {
        const base = 80 + simIndex * 35 + metricIndex * 22;
        const wave = Math.sin(i / 4) * 8 + Math.cos(i / 7) * 6;
        data.push({
          iteration: i,
          simType: simType.value,
          metric: metric.value,
          value: Math.round((base + i * 3 + wave) * 100) / 100,
          group: `G-${metricIndex + 1}`,
        });
      }
    });
  });
  return data;
};

const Results: React.FC = () => {
  const { id } = useParams();
  const { language } = useUIStore();
  const t = (key: string) => RESOURCES[language][key] || key;
  const [activeTab, setActiveTab] = useState('overview');
  const [metric, setMetric] = useState(METRIC_OPTIONS[0].value);
  const [selectedSimTypes, setSelectedSimTypes] = useState<string[]>(
    SIM_TYPE_OPTIONS.map(opt => opt.value)
  );
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [minIteration, setMinIteration] = useState('');
  const [maxIteration, setMaxIteration] = useState('');

  const tabs = [
    { key: 'overview', label: t('res.tab.overview') },
    { key: 'analysis', label: t('res.tab.analysis') },
    { key: 'process', label: t('res.tab.process') },
  ];

  const results = useMemo(() => buildMockResults(), []);

  const simTypeLabelMap = useMemo(
    () => new Map(SIM_TYPE_OPTIONS.map(opt => [opt.value, t(opt.labelKey)])),
    [t]
  );

  const metricLabelMap = useMemo(
    () => new Map(METRIC_OPTIONS.map(opt => [opt.value, t(opt.labelKey)])),
    [t]
  );

  const metricOptions = useMemo(
    () => METRIC_OPTIONS.map(opt => ({ value: opt.value, label: t(opt.labelKey) })),
    [t]
  );

  const filteredResults = useMemo(() => {
    const minVal = minValue ? Number(minValue) : Number.NEGATIVE_INFINITY;
    const maxVal = maxValue ? Number(maxValue) : Number.POSITIVE_INFINITY;
    const minIter = minIteration ? Number(minIteration) : Number.NEGATIVE_INFINITY;
    const maxIter = maxIteration ? Number(maxIteration) : Number.POSITIVE_INFINITY;

    return results.filter(record => {
      if (record.metric !== metric) return false;
      if (!selectedSimTypes.includes(record.simType)) return false;
      if (record.value < minVal || record.value > maxVal) return false;
      if (record.iteration < minIter || record.iteration > maxIter) return false;
      return true;
    });
  }, [results, metric, selectedSimTypes, minValue, maxValue, minIteration, maxIteration]);

  const trendData = useMemo(
    () =>
      filteredResults.map(record => ({
        iteration: record.iteration,
        simType: simTypeLabelMap.get(record.simType) || record.simType,
        value: record.value,
      })),
    [filteredResults, simTypeLabelMap]
  );

  const avgBySimType = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    filteredResults.forEach(record => {
      const current = map.get(record.simType) || { total: 0, count: 0 };
      map.set(record.simType, { total: current.total + record.value, count: current.count + 1 });
    });
    return Array.from(map.entries()).map(([simTypeName, stats]) => ({
      simType: simTypeLabelMap.get(simTypeName) || simTypeName,
      value: stats.count ? Math.round((stats.total / stats.count) * 100) / 100 : 0,
    }));
  }, [filteredResults, simTypeLabelMap]);

  const toggleSimType = (value: string) => {
    setSelectedSimTypes(prev =>
      prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
    );
  };

  const handleReset = () => {
    setMetric(METRIC_OPTIONS[0].value);
    setSelectedSimTypes(SIM_TYPE_OPTIONS.map(opt => opt.value));
    setMinValue('');
    setMaxValue('');
    setMinIteration('');
    setMaxIteration('');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (format === 'json') {
      const payload = filteredResults.map(record => ({
        ...record,
        simType: simTypeLabelMap.get(record.simType) || record.simType,
        metric: metricLabelMap.get(record.metric) || record.metric,
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
      simTypeLabelMap.get(record.simType) || record.simType,
      metricLabelMap.get(record.metric) || record.metric,
      record.value,
      record.group,
    ]);
    const csvContent = [header, ...rows].map(row => row.join(',')).join('\n');
    downloadFile(csvContent, `results_${id || 'detail'}.csv`, 'text/csv');
  };

  const selectedLabel = t('res.filters.selected').replace(
    '{count}',
    String(selectedSimTypes.length)
  );
  const tableCountLabel = t('res.table.count').replace('{count}', String(filteredResults.length));

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
            {t('res.title')}: {id}
          </h1>
          <p className="text-slate-500 text-sm">{t('res.report')}</p>
        </div>
      </div>

      <Tabs items={tabs} activeKey={activeTab} onChange={setActiveTab} variant="pills" />

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
                {SIM_TYPE_OPTIONS.map(opt => {
                  const active = selectedSimTypes.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleSimType(opt.value)}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        active
                          ? 'bg-brand-500 text-white border-brand-500'
                          : 'bg-white dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {t(opt.labelKey)}
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
              <Table
                rowKey={record => `${record.simType}-${record.metric}-${record.iteration}`}
                data={filteredResults}
                columns={[
                  { key: 'iteration', title: t('res.table.iteration'), width: '100px' },
                  { key: 'simType', title: t('res.table.sim_type'), width: '140px' },
                  { key: 'metric', title: t('res.table.metric'), width: '160px' },
                  {
                    key: 'value',
                    title: t('res.table.value'),
                    align: 'right',
                    render: value => Number(value).toFixed(2),
                  },
                  { key: 'group', title: t('res.table.group') },
                ]}
                emptyText={t('res.table.empty')}
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
