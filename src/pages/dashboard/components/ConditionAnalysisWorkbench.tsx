import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { EChartsOption } from 'echarts';
import { Card } from '@/components/ui';
import type { OrderConditionSummary, RoundItem } from '@/api/results';
import { exportAoaToExcel } from '@/utils/excel';
import {
  buildAxisOptions,
  buildFieldOptions,
  buildFlatRows,
  formatNumber,
  getNumericValue,
  resolveConditionTitle,
  sampleRows,
} from './conditionAnalysis/conditionAnalysisFields';
import {
  buildGrid3DConfig,
  buildGridBins,
  createEmptyChartOption,
  ensureEchartsGl,
} from './conditionAnalysis/conditionAnalysisChartConfig';
import {
  CHART_OPTIONS,
  SAMPLE_OPTIONS,
  STYLE_OPTIONS,
  STYLE_PRESETS,
  THREE_D_VIEW_OPTIONS,
} from './conditionAnalysis/conditionAnalysisOptions';
import {
  ChartType,
  FlatRoundRow,
  StylePreset,
  ThreeDViewMode,
} from './conditionAnalysis/conditionAnalysisTypes';
import { buildSummary } from './conditionAnalysis/conditionAnalysisSummary';
import {
  buildConditionAnalysisNarrative,
  buildConditionHeaderBadges,
} from './conditionAnalysis/conditionAnalysisNarrative';
import {
  buildConditionPreviewColumns,
  buildConditionPreviewExportColumns,
  buildConditionPreviewExportData,
} from './conditionAnalysis/conditionAnalysisPreview';
import { ConditionAnalysisChartCard } from './conditionAnalysis/ConditionAnalysisChartCard';
import { ConditionAnalysisHeaderCard } from './conditionAnalysis/ConditionAnalysisHeaderCard';
import { ConditionAnalysisInsightsPanel } from './conditionAnalysis/ConditionAnalysisInsightsPanel';
import { ConditionAnalysisPreviewCard } from './conditionAnalysis/ConditionAnalysisPreviewCard';
import { OverviewAnalysisReport } from './OverviewAnalysisReport';

export interface ConditionAnalysisWorkbenchProps {
  condition: OrderConditionSummary | null;
  conditionTitle?: string;
  rounds: RoundItem[];
  resultSource?: string;
  total?: number;
  loading?: boolean;
  sampled?: boolean;
  metricLabelMap: Map<string, string>;
}

export const ConditionAnalysisWorkbench: React.FC<ConditionAnalysisWorkbenchProps> = ({
  condition,
  conditionTitle,
  rounds,
  resultSource = 'mock',
  total = 0,
  loading = false,
  sampled = false,
  metricLabelMap,
}) => {
  const rows = useMemo(() => buildFlatRows(rounds), [rounds]);
  const fieldOptions = useMemo(
    () => buildFieldOptions(rows, metricLabelMap),
    [metricLabelMap, rows]
  );
  const axisOptions = useMemo(() => buildAxisOptions(fieldOptions), [fieldOptions]);

  const [chartType, setChartType] = useState<ChartType>('none');
  const [stylePreset, setStylePreset] = useState<StylePreset>('ocean');
  const [sampleLimit, setSampleLimit] = useState('2000');
  const [xField, setXField] = useState('roundIndex');
  const [yField, setYField] = useState('');
  const [zField, setZField] = useState('');
  const [chartTitle, setChartTitle] = useState('');
  const [threeDViewMode, setThreeDViewMode] = useState<ThreeDViewMode>('perspective');
  const [isEchartsGlReady, setIsEchartsGlReady] = useState(false);

  useEffect(() => {
    if (!fieldOptions.length) return;
    const outputField = fieldOptions.find(option => option.group === 'output')?.key;
    const paramField = fieldOptions.find(option => option.group === 'param')?.key;

    if (!yField || !fieldOptions.some(option => option.key === yField)) {
      setYField(outputField || 'process');
    }
    if (!zField || !fieldOptions.some(option => option.key === zField)) {
      setZField(outputField || paramField || 'process');
    }
    if (!fieldOptions.some(option => option.key === xField)) {
      setXField(paramField || 'roundIndex');
    }
  }, [fieldOptions, xField, yField, zField]);

  const is3DChart = useMemo(
    () => chartType === 'scatter3d' || chartType === 'bar3d' || chartType === 'surface3d',
    [chartType]
  );

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
        if (!cancelled) {
          setIsEchartsGlReady(true);
        }
      })
      .catch(error => {
        console.error('echarts-gl load failed', error);
        if (!cancelled) {
          setIsEchartsGlReady(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [is3DChart]);

  const deferredRows = useDeferredValue(rows);
  const sampledRows = useMemo(
    () => sampleRows(deferredRows, Math.max(Number(sampleLimit) || 2000, 1)),
    [deferredRows, sampleLimit]
  );

  const summary = useMemo(
    () => buildSummary(rows, yField, fieldOptions),
    [fieldOptions, rows, yField]
  );

  const currentPreset = STYLE_PRESETS[stylePreset];
  const currentXLabel = axisOptions.find(option => option.value === xField)?.label || xField;
  const currentYLabel = axisOptions.find(option => option.value === yField)?.label || yField;
  const currentZLabel = axisOptions.find(option => option.value === zField)?.label || zField;
  const resolvedConditionTitle = resolveConditionTitle(condition, conditionTitle);
  const chartInstanceKey = `${chartType}-${is3DChart ? threeDViewMode : '2d'}-${isEchartsGlReady ? 'ready' : 'loading'}`;

  const chartOption = useMemo<EChartsOption>(() => {
    const title = chartTitle.trim() || `${currentYLabel} 分析`;
    if (is3DChart && !isEchartsGlReady) {
      return createEmptyChartOption('3D 图形组件加载中...');
    }

    const points = sampledRows
      .map(row => {
        const x = getNumericValue(row, xField);
        const y = getNumericValue(row, yField);
        const z = is3DChart ? getNumericValue(row, zField) : null;
        return { x, y, z, row };
      })
      .filter(item => item.x !== null && item.y !== null);

    if (chartType === 'none') {
      return createEmptyChartOption(
        '当前未生成图表，请在上方选择需要的图形类型、数据轴和样式后再分析。'
      );
    }

    if (!points.length) {
      return createEmptyChartOption('当前筛选下暂无可视化数据');
    }

    if (chartType === 'line2d') {
      const lineData = points
        .map(item => [item.x as number, item.y as number])
        .sort((a, b) => a[0] - b[0]);

      return {
        color: currentPreset.colors,
        title: { text: title, left: 20, top: 12, textStyle: { fontSize: 14 } },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'value', name: currentXLabel },
        yAxis: { type: 'value', name: currentYLabel },
        grid: { left: 60, right: 24, top: 54, bottom: 56 },
        series: [
          {
            type: 'line',
            name: currentYLabel,
            smooth: true,
            showSymbol: false,
            areaStyle: { color: currentPreset.areaColor },
            lineStyle: { width: 2 },
            data: lineData,
          },
        ],
      } as EChartsOption;
    }

    if (chartType === 'bar2d') {
      const barData = points
        .slice(0, 240)
        .map(item => [String((item.x as number).toFixed(2)), item.y as number]);

      return {
        color: currentPreset.colors,
        title: { text: title, left: 20, top: 12, textStyle: { fontSize: 14 } },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', name: currentXLabel, data: barData.map(item => item[0]) },
        yAxis: { type: 'value', name: currentYLabel },
        grid: { left: 60, right: 24, top: 54, bottom: 72 },
        series: [
          {
            type: 'bar',
            name: currentYLabel,
            barMaxWidth: 22,
            data: barData.map(item => item[1]),
          },
        ],
      } as EChartsOption;
    }

    if (chartType === 'scatter2d') {
      return {
        color: currentPreset.colors,
        title: { text: title, left: 20, top: 12, textStyle: { fontSize: 14 } },
        tooltip: { trigger: 'item' },
        xAxis: {
          type: 'value',
          name: currentXLabel,
          splitLine: { lineStyle: { color: currentPreset.splitLineColor } },
        },
        yAxis: {
          type: 'value',
          name: currentYLabel,
          splitLine: { lineStyle: { color: currentPreset.splitLineColor } },
        },
        grid: { left: 60, right: 24, top: 54, bottom: 56 },
        series: [
          {
            type: 'scatter',
            large: points.length > 4000,
            largeThreshold: 2000,
            symbolSize: 9,
            itemStyle: { opacity: 0.72 },
            data: points.map(item => [item.x as number, item.y as number]),
          },
        ],
      } as EChartsOption;
    }

    if (chartType === 'scatter3d') {
      const threeDPoints = points.filter(
        (item): item is { x: number; y: number; z: number; row: FlatRoundRow } => item.z !== null
      );

      return {
        color: currentPreset.colors,
        title: { text: title, left: 20, top: 12, textStyle: { fontSize: 14 } },
        tooltip: {
          formatter: (params: { value?: [number, number, number] }) =>
            `${currentXLabel}: ${formatNumber(params.value?.[0] ?? null)}<br/>${currentYLabel}: ${formatNumber(params.value?.[1] ?? null)}<br/>${currentZLabel}: ${formatNumber(params.value?.[2] ?? null)}`,
        },
        xAxis3D: { type: 'value', name: currentXLabel },
        yAxis3D: { type: 'value', name: currentYLabel },
        zAxis3D: { type: 'value', name: currentZLabel },
        grid3D: buildGrid3DConfig(threeDViewMode, 120, 80, 0.35),
        visualMap: {
          min: Math.min(...threeDPoints.map(item => item.z), 0),
          max: Math.max(...threeDPoints.map(item => item.z), 1),
          dimension: 2,
          calculable: true,
          inRange: { color: currentPreset.colors },
          right: 16,
          top: 60,
        },
        series: [
          {
            type: 'scatter3D',
            symbolSize: 8,
            data: threeDPoints.map(item => [item.x, item.y, item.z]),
          } as unknown,
        ],
      } as EChartsOption;
    }

    const gridBins = buildGridBins(sampledRows, xField, yField, zField);

    if (chartType === 'bar3d') {
      return {
        color: currentPreset.colors,
        title: { text: title, left: 20, top: 12, textStyle: { fontSize: 14 } },
        tooltip: {},
        xAxis3D: { type: 'category', name: currentXLabel, data: gridBins.xLabels },
        yAxis3D: { type: 'category', name: currentYLabel, data: gridBins.yLabels },
        zAxis3D: { type: 'value', name: currentZLabel },
        grid3D: buildGrid3DConfig(threeDViewMode, 110, 90, 0.3),
        visualMap: {
          max: Math.max(...gridBins.matrix.map(item => item[2]), 1),
          calculable: true,
          inRange: { color: currentPreset.colors },
          right: 16,
          top: 60,
        },
        series: [
          {
            type: 'bar3D',
            shading: 'lambert',
            data: gridBins.matrix,
          } as unknown,
        ],
      } as EChartsOption;
    }

    return {
      color: currentPreset.colors,
      title: { text: title, left: 20, top: 12, textStyle: { fontSize: 14 } },
      tooltip: {},
      xAxis3D: { type: 'category', name: currentXLabel, data: gridBins.xLabels },
      yAxis3D: { type: 'category', name: currentYLabel, data: gridBins.yLabels },
      zAxis3D: { type: 'value', name: currentZLabel },
      grid3D: buildGrid3DConfig(threeDViewMode, 110, 90, 0.28),
      visualMap: {
        max: Math.max(...gridBins.matrix.map(item => item[2]), 1),
        calculable: true,
        inRange: { color: currentPreset.colors },
        right: 16,
        top: 60,
      },
      series: [
        {
          type: 'surface',
          wireframe: { show: false },
          shading: 'realistic',
          realisticMaterial: { roughness: 0.35, metalness: 0.08 },
          data: gridBins.matrix,
        } as unknown,
      ],
    } as EChartsOption;
  }, [
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
  ]);

  const effectiveChartOption = useMemo<EChartsOption>(() => {
    if (!is3DChart || isEchartsGlReady) {
      return chartOption;
    }
    return createEmptyChartOption('3D 图形组件加载中...');
  }, [chartOption, is3DChart, isEchartsGlReady]);

  const previewColumns = useMemo<ColumnDef<FlatRoundRow>[]>(
    () =>
      buildConditionPreviewColumns({
        currentXLabel,
        currentYLabel,
        currentZLabel,
        is3DChart,
        xField,
        yField,
        zField,
      }),
    [currentXLabel, currentYLabel, currentZLabel, is3DChart, xField, yField, zField]
  );

  const previewRows = useMemo(() => sampleRows(rows, 2000), [rows]);
  const deferredPreviewRows = useDeferredValue(previewRows);
  const previewExportColumns = useMemo(
    () =>
      buildConditionPreviewExportColumns({
        currentXLabel,
        currentYLabel,
        currentZLabel,
        is3DChart,
      }),
    [currentXLabel, currentYLabel, currentZLabel, is3DChart]
  );

  const handleExport = async () => {
    const { aoa, merges } = buildConditionPreviewExportData({
      rows: deferredPreviewRows,
      columns: previewExportColumns,
      xField,
      yField,
      zField,
    });

    await exportAoaToExcel(aoa, `${resolvedConditionTitle}-绘图数据预览`, merges);
  };

  const narrative = useMemo(
    () =>
      buildConditionAnalysisNarrative({
        currentYLabel,
        total,
        sampledRowCount: sampledRows.length,
        summary,
      }),
    [currentYLabel, sampledRows.length, summary, total]
  );

  const headerBadges = useMemo(
    () => buildConditionHeaderBadges({ condition, resultSource, sampled }),
    [condition, resultSource, sampled]
  );

  if (!condition) {
    return (
      <Card className="shadow-none">
        <div className="flex h-64 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
          暂无可分析的工况数据
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ConditionAnalysisHeaderCard
        resolvedConditionTitle={resolvedConditionTitle}
        headerBadges={headerBadges}
        is3DChart={is3DChart}
        chartType={chartType}
        stylePreset={stylePreset}
        sampleLimit={sampleLimit}
        xField={xField}
        yField={yField}
        zField={zField}
        chartTitle={chartTitle}
        currentYLabel={currentYLabel}
        threeDViewMode={threeDViewMode}
        axisOptions={axisOptions}
        chartOptions={CHART_OPTIONS}
        styleOptions={STYLE_OPTIONS}
        sampleOptions={SAMPLE_OPTIONS}
        threeDViewOptions={THREE_D_VIEW_OPTIONS}
        onChartTypeChange={setChartType}
        onStylePresetChange={setStylePreset}
        onSampleLimitChange={setSampleLimit}
        onXFieldChange={setXField}
        onYFieldChange={setYField}
        onZFieldChange={setZField}
        onChartTitleChange={setChartTitle}
        onThreeDViewModeChange={setThreeDViewMode}
      />

      <OverviewAnalysisReport rounds={rounds} metricLabelMap={metricLabelMap} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_380px]">
        <ConditionAnalysisChartCard
          chartInstanceKey={chartInstanceKey}
          option={effectiveChartOption}
          loading={loading || (is3DChart && !isEchartsGlReady)}
        />

        <ConditionAnalysisInsightsPanel
          summary={summary}
          narrative={narrative}
          algorithmType={condition.algorithmType}
          resolvedConditionTitle={resolvedConditionTitle}
          conditionId={condition.conditionId}
          foldTypeId={condition.foldTypeId}
          simTypeId={condition.simTypeId}
          total={total}
          sampledRowCount={sampledRows.length}
          resultSource={resultSource}
        />
      </div>

      <ConditionAnalysisPreviewCard
        rows={deferredPreviewRows}
        columns={previewColumns}
        loading={loading}
        chartLabel={CHART_OPTIONS.find(option => option.value === chartType)?.label}
        onExport={handleExport}
      />
    </div>
  );
};

export default ConditionAnalysisWorkbench;
