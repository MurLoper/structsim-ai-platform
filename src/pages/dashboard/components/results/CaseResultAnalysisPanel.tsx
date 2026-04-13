import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Card, Input, Select } from '@/components/ui';
import { BaseChart } from '@/components/charts';
import { useI18n } from '@/hooks/useI18n';
import { ensureEchartsGl } from '../conditionAnalysis/conditionAnalysisChartConfig';
import type {
  ChartType,
  StylePreset,
  ThreeDViewMode,
} from '../conditionAnalysis/conditionAnalysisTypes';
import type { ConditionRoundsGroup } from '../../hooks/resultsAnalysisTypes';
import { buildCaseResultChartOption } from './caseResultAnalysisChartBuilder';
import {
  buildAxisOptions,
  flattenCaseResultRows,
  sampleRows,
} from './caseResultAnalysisDataMappers';
import {
  getCaseResultChartOptions,
  getCaseResultSampleOptions,
  getCaseResultViewOptions,
  STYLE_OPTIONS,
  STYLE_PRESETS,
} from './caseResultAnalysisOptions';

interface CaseResultAnalysisPanelProps {
  roundGroups: ConditionRoundsGroup[];
  loading?: boolean;
}

export const CaseResultAnalysisPanel: React.FC<CaseResultAnalysisPanelProps> = ({
  roundGroups,
  loading = false,
}) => {
  const { t } = useI18n();
  const [chartType, setChartType] = useState<ChartType>('line2d');
  const [stylePreset, setStylePreset] = useState<StylePreset>('ocean');
  const [sampleLimit, setSampleLimit] = useState('1000');
  const [xField, setXField] = useState('roundIndex');
  const [yField, setYField] = useState('finalResult');
  const [zField, setZField] = useState('process');
  const [chartTitle, setChartTitle] = useState('');
  const [threeDViewMode, setThreeDViewMode] = useState<ThreeDViewMode>('perspective');
  const [isEchartsGlReady, setIsEchartsGlReady] = useState(false);

  const rows = useMemo(() => flattenCaseResultRows(roundGroups), [roundGroups]);

  const chartOptions = useMemo(() => getCaseResultChartOptions(t), [t]);
  const sampleOptions = useMemo(() => getCaseResultSampleOptions(t), [t]);
  const viewOptions = useMemo(() => getCaseResultViewOptions(t), [t]);
  const axisOptions = useMemo(() => buildAxisOptions(rows, t), [rows, t]);
  const currentPreset = STYLE_PRESETS[stylePreset];
  const currentXLabel = axisOptions.find(option => option.value === xField)?.label || xField;
  const currentYLabel = axisOptions.find(option => option.value === yField)?.label || yField;
  const currentZLabel = axisOptions.find(option => option.value === zField)?.label || zField;
  const is3DChart = chartType === 'scatter3d' || chartType === 'bar3d' || chartType === 'surface3d';

  useEffect(() => {
    if (!axisOptions.length) return;
    const firstOutput = axisOptions.find(option => option.group === 'output')?.value;
    const firstParam = axisOptions.find(option => option.group === 'param')?.value;

    if (!axisOptions.some(option => option.value === xField)) {
      setXField(firstParam || 'roundIndex');
    }
    if (!axisOptions.some(option => option.value === yField)) {
      setYField(firstOutput || 'process');
    }
    if (!axisOptions.some(option => option.value === zField)) {
      setZField(firstParam || firstOutput || 'process');
    }
  }, [axisOptions, xField, yField, zField]);

  useEffect(() => {
    let cancelled = false;

    if (!is3DChart) {
      setIsEchartsGlReady(true);
      return () => {
        cancelled = true;
      };
    }

    setIsEchartsGlReady(false);
    void ensureEchartsGl()
      .then(() => {
        if (!cancelled) setIsEchartsGlReady(true);
      })
      .catch(() => {
        if (!cancelled) setIsEchartsGlReady(false);
      });

    return () => {
      cancelled = true;
    };
  }, [is3DChart]);

  const deferredRows = useDeferredValue(rows);
  const sampledRows = useMemo(
    () => sampleRows(deferredRows, Math.max(Number(sampleLimit) || 1000, 1)),
    [deferredRows, sampleLimit]
  );

  const chartOption = useMemo(
    () =>
      buildCaseResultChartOption({
        chartTitle,
        chartType,
        currentPreset,
        currentXLabel,
        currentYLabel,
        currentZLabel,
        is3DChart,
        isEchartsGlReady,
        sampledRows,
        threeDViewMode,
        xField,
        yField,
        zField,
        t,
      }),
    [
      chartTitle,
      chartType,
      currentPreset,
      currentXLabel,
      currentYLabel,
      currentZLabel,
      is3DChart,
      isEchartsGlReady,
      sampledRows,
      t,
      threeDViewMode,
      xField,
      yField,
      zField,
    ]
  );

  if (!roundGroups.length) {
    return (
      <Card className="shadow-none">
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          {t('res.analysis.empty.no_case_data')}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-none">
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="text-sm font-semibold text-foreground">
              {t('res.analysis.panel.title')}
            </div>
            <div className="text-xs text-muted-foreground">{t('res.analysis.panel.desc')}</div>
          </div>

          <div
            className={`grid gap-4 md:grid-cols-2 ${is3DChart ? 'xl:grid-cols-7' : 'xl:grid-cols-5'}`}
          >
            <Select
              label={t('res.analysis.form.chart_type')}
              value={chartType}
              options={chartOptions}
              onChange={event =>
                startTransition(() => setChartType(event.target.value as ChartType))
              }
            />
            <Select
              label={t('res.analysis.form.x_axis')}
              value={xField}
              options={axisOptions}
              onChange={event => startTransition(() => setXField(event.target.value))}
            />
            <Select
              label={t('res.analysis.form.y_axis')}
              value={yField}
              options={axisOptions}
              onChange={event => startTransition(() => setYField(event.target.value))}
            />
            {is3DChart ? (
              <Select
                label={t('res.analysis.form.z_axis')}
                value={zField}
                options={axisOptions}
                onChange={event => startTransition(() => setZField(event.target.value))}
              />
            ) : null}
            {is3DChart ? (
              <Select
                label={t('res.analysis.form.view')}
                value={threeDViewMode}
                options={viewOptions}
                onChange={event =>
                  startTransition(() => setThreeDViewMode(event.target.value as ThreeDViewMode))
                }
              />
            ) : null}
            <Select
              label={t('res.analysis.form.style')}
              value={stylePreset}
              options={STYLE_OPTIONS}
              onChange={event =>
                startTransition(() => setStylePreset(event.target.value as StylePreset))
              }
            />
            <Select
              label={t('res.analysis.form.sample_limit')}
              value={sampleLimit}
              options={sampleOptions}
              onChange={event => startTransition(() => setSampleLimit(event.target.value))}
            />
          </div>

          <Input
            label={t('res.analysis.form.chart_title')}
            value={chartTitle}
            onChange={event => setChartTitle(event.target.value)}
            placeholder={t('res.analysis.title_suffix', { label: currentYLabel })}
          />
        </div>
      </Card>

      <Card className="shadow-none">
        <BaseChart
          option={chartOption}
          height={520}
          loading={loading || (is3DChart && !isEchartsGlReady)}
          largeData={sampledRows.length > 3000}
        />
      </Card>
    </div>
  );
};
