import React, { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { EChartsOption } from 'echarts';
import { BarChart3, Boxes, ChartColumnBig, ScanSearch, Sigma, Download } from 'lucide-react';
import { BaseChart } from '@/components/charts';
import { VirtualTable } from '@/components/tables/VirtualTable';
import { Badge, Card, Input, Select, Button } from '@/components/ui';
import type { OrderConditionSummary, RoundItem } from '@/api/results';
import { exportAoaToExcel, type ExcelCellValue, type ExcelMergeRange } from '@/utils/excel';

import {
  buildAxisOptions,
  buildFieldOptions,
  buildFlatRows,
  buildGrid3DConfig,
  buildGridBins,
  buildSummary,
  CHART_OPTIONS,
  ChartType,
  createEmptyChartOption,
  ensureEchartsGl,
  FlatRoundRow,
  formatNumber,
  getNumericValue,
  resolveConditionTitle,
  sampleRows,
  SAMPLE_OPTIONS,
  STATUS_LABELS,
  STYLE_OPTIONS,
  STYLE_PRESETS,
  StylePreset,
  THREE_D_VIEW_OPTIONS,
  ThreeDViewMode,
} from './conditionAnalysisUtils';
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
  const [isEchartsGlReady, setIsEchartsGlReady] = useState(false);

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

  const previewColumns = useMemo<ColumnDef<FlatRoundRow>[]>(() => {
    const columns: ColumnDef<FlatRoundRow>[] = [
      {
        header: '轮次',
        accessorKey: 'roundIndex',
        cell: ({ row }) => <span className="tabular-nums">{row.original.roundIndex}</span>,
      },
      {
        header: currentXLabel,
        id: 'xField',
        cell: ({ row }) => formatNumber(getNumericValue(row.original, xField), 4),
      },
      {
        header: currentYLabel,
        id: 'yField',
        cell: ({ row }) => (
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {formatNumber(getNumericValue(row.original, yField), 4)}
          </span>
        ),
      },
    ];

    if (is3DChart) {
      columns.push({
        header: currentZLabel,
        id: 'zField',
        cell: ({ row }) => formatNumber(getNumericValue(row.original, zField), 4),
      });
    }

    columns.push({
      header: '状态',
      accessorKey: 'status',
      cell: ({ row }) => STATUS_LABELS[row.original.status] || `状态${row.original.status}`,
    });

    return columns;
  }, [currentXLabel, currentYLabel, currentZLabel, is3DChart, xField, yField, zField]);

  const previewRows = useMemo(() => sampleRows(rows, 2000), [rows]);
  const deferredPreviewRows = useDeferredValue(previewRows);
  const previewExportColumns = useMemo(
    () => [
      { id: 'roundIndex', header: '轮次', group: 'basic' as const },
      { id: 'xField', header: currentXLabel, group: 'coords' as const },
      { id: 'yField', header: currentYLabel, group: 'coords' as const },
      ...(is3DChart ? [{ id: 'zField', header: currentZLabel, group: 'coords' as const }] : []),
      { id: 'status', header: '状态', group: 'meta' as const },
    ],
    [currentXLabel, currentYLabel, currentZLabel, is3DChart]
  );

  const handleExport = async () => {
    const aoa: ExcelCellValue[][] = [];

    const headerRow1: string[] = [];
    const headerRow2: string[] = [];
    const merges: ExcelMergeRange[] = [];

    previewExportColumns.forEach(col => {
      if (col.group === 'coords') {
        headerRow1.push('坐标数据');
      } else if (col.group === 'basic') {
        headerRow1.push('基本信息');
      } else {
        headerRow1.push('状态信息');
      }
      headerRow2.push(col.header);
    });

    const coordsStart = previewExportColumns.findIndex(col => col.group === 'coords');
    let coordsEnd = -1;
    for (let index = previewExportColumns.length - 1; index >= 0; index -= 1) {
      if (previewExportColumns[index].group === 'coords') {
        coordsEnd = index;
        break;
      }
    }
    if (coordsStart !== -1 && coordsEnd > coordsStart) {
      merges.push({ s: { r: 0, c: coordsStart }, e: { r: 0, c: coordsEnd } });
    }

    aoa.push(headerRow1);
    aoa.push(headerRow2);

    deferredPreviewRows.forEach(row => {
      const rowData = previewExportColumns.map(col => {
        if (col.id === 'xField') return getNumericValue(row, xField) ?? '-';
        if (col.id === 'yField') return getNumericValue(row, yField) ?? '-';
        if (col.id === 'zField') return getNumericValue(row, zField) ?? '-';
        if (col.id === 'roundIndex') return row.roundIndex;
        if (col.id === 'status') return STATUS_LABELS[row.status] || '未知';
        return '-';
      });
      aoa.push(rowData);
    });

    await exportAoaToExcel(aoa, `${resolvedConditionTitle}-绘图数据预览`, merges);
  };

  const narrative = useMemo(() => {
    const lines = [
      `当前以 ${currentYLabel} 作为分析目标，覆盖 ${total.toLocaleString()} 轮结果，绘图采样 ${sampledRows.length.toLocaleString()} 点。`,
      `最优轮次 #${summary.best?.roundIndex ?? '--'}，最差轮次 #${summary.worst?.roundIndex ?? '--'}，均值 ${formatNumber(summary.avg)}，波动跨度 ${formatNumber(summary.spread)}。`,
    ];

    if (summary.strongestParam) {
      lines.push(
        `${summary.strongestParam.label} 与 ${currentYLabel} 的线性相关性当前最强，|r|=${summary.strongestParam.score.toFixed(3)}。`
      );
    } else {
      lines.push('当前样本不足以给出稳定的参数敏感性判断。');
    }

    return lines;
  }, [
    currentYLabel,
    sampledRows.length,
    summary.avg,
    summary.best?.roundIndex,
    summary.spread,
    summary.strongestParam,
    summary.worst?.roundIndex,
    total,
  ]);

  const headerBadges = [
    condition?.conditionId ? `工况ID ${condition.conditionId}` : null,
    condition?.solverId ? `求解器 ${condition.solverId}` : null,
    `结果源 ${String(resultSource).toUpperCase()}`,
    sampled ? '当前数据已采样' : '当前数据为完整轮次',
  ].filter(Boolean);

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
      <Card className="shadow-none">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                <ScanSearch className="h-4 w-4 text-brand-500" />
                <span>工况分析工作台</span>
              </div>
              <div className="text-xl font-semibold text-slate-900 dark:text-white">
                {resolvedConditionTitle}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                分析页仅围绕当前工况展开，组合校验和来源信息统一收敛到下方信息区，避免页面信息重复堆叠。
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
              {headerBadges.map(item => (
                <span key={item} className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div
            className={`grid gap-4 md:grid-cols-2 ${
              is3DChart ? 'xl:grid-cols-7' : 'xl:grid-cols-5'
            }`}
          >
            <Select
              label="图形类型"
              value={chartType}
              options={CHART_OPTIONS}
              onChange={event =>
                startTransition(() => setChartType(event.target.value as ChartType))
              }
            />
            <Select
              label="X 轴"
              value={xField}
              options={axisOptions}
              onChange={event => startTransition(() => setXField(event.target.value))}
            />
            <Select
              label="Y 轴"
              value={yField}
              options={axisOptions}
              onChange={event => startTransition(() => setYField(event.target.value))}
            />
            {is3DChart ? (
              <Select
                label="Z 轴"
                value={zField}
                options={axisOptions}
                onChange={event => startTransition(() => setZField(event.target.value))}
              />
            ) : null}
            {is3DChart ? (
              <Select
                label="视图"
                value={threeDViewMode}
                options={THREE_D_VIEW_OPTIONS}
                onChange={event =>
                  startTransition(() => setThreeDViewMode(event.target.value as ThreeDViewMode))
                }
              />
            ) : null}
            <Select
              label="样式"
              value={stylePreset}
              options={STYLE_OPTIONS}
              onChange={event =>
                startTransition(() => setStylePreset(event.target.value as StylePreset))
              }
            />
            <Select
              label="点位上限"
              value={sampleLimit}
              options={SAMPLE_OPTIONS}
              onChange={event => startTransition(() => setSampleLimit(event.target.value))}
            />
          </div>

          <Input
            label="图表标题"
            value={chartTitle}
            onChange={event => setChartTitle(event.target.value)}
            placeholder={`${currentYLabel} 分析`}
          />
        </div>
      </Card>

      <OverviewAnalysisReport rounds={rounds} metricLabelMap={metricLabelMap} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_380px]">
        <Card className="shadow-none">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
              <ChartColumnBig className="h-4 w-4 text-brand-500" />
              <span>自定义图形</span>
            </div>
            <BaseChart
              key={chartInstanceKey}
              option={effectiveChartOption}
              height={520}
              loading={loading || (is3DChart && !isEchartsGlReady)}
              largeData
            />
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-none">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                <Sigma className="h-4 w-4 text-brand-500" />
                <span>图表分析结论</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-900/50">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Min</div>
                  <div className="mt-2 text-2xl font-semibold tabular-nums">
                    {formatNumber(summary.min)}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-900/50">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Avg</div>
                  <div className="mt-2 text-2xl font-semibold tabular-nums">
                    {formatNumber(summary.avg)}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-900/50">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Max</div>
                  <div className="mt-2 text-2xl font-semibold tabular-nums">
                    {formatNumber(summary.max)}
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {narrative.map(line => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="info" size="sm">
                  {condition.algorithmType || 'UNKNOWN'}
                </Badge>
                <Badge variant="success" size="sm">
                  最优轮次 #{summary.best?.roundIndex ?? '--'}
                </Badge>
                <Badge variant="warning" size="sm">
                  最差轮次 #{summary.worst?.roundIndex ?? '--'}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="shadow-none">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                <Boxes className="h-4 w-4 text-brand-500" />
                <span>分析范围</span>
              </div>
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/50">
                  <span>工况标题</span>
                  <span className="max-w-[220px] text-right font-medium">
                    {resolvedConditionTitle}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/50">
                  <span>工况 ID</span>
                  <span className="font-medium tabular-nums">{condition.conditionId}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/50">
                  <span>FoldType</span>
                  <span className="font-medium tabular-nums">{condition.foldTypeId ?? '-'}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/50">
                  <span>SimType</span>
                  <span className="font-medium tabular-nums">{condition.simTypeId ?? '-'}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/50">
                  <span>轮次覆盖</span>
                  <span className="font-medium tabular-nums">{total.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/50">
                  <span>绘图点数</span>
                  <span className="font-medium tabular-nums">
                    {sampledRows.length.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/50">
                  <span>结果源</span>
                  <Badge variant={resultSource === 'mock' ? 'warning' : 'success'} size="sm">
                    {String(resultSource).toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card className="shadow-none">
        <div className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
              <BarChart3 className="h-4 w-4 text-brand-500" />
              <span>绘图数据预览</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                预览行数 {deferredPreviewRows.length.toLocaleString()}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                当前图形 {CHART_OPTIONS.find(option => option.value === chartType)?.label}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="ml-2 h-7 px-3 text-xs"
                disabled={deferredPreviewRows.length === 0}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                导出 Excel
              </Button>
            </div>
          </div>

          <VirtualTable
            data={deferredPreviewRows}
            columns={previewColumns}
            rowHeight={40}
            containerHeight={360}
            striped
            enableSorting
            loading={loading}
            emptyText="当前工况暂无可预览数据"
            getRowId={row => row.id}
          />
        </div>
      </Card>
    </div>
  );
};

export default ConditionAnalysisWorkbench;
