import 'echarts-gl';

import React, { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { EChartsOption } from 'echarts';
import { BarChart3, Boxes, ChartColumnBig, ScanSearch, Sigma } from 'lucide-react';
import { BaseChart } from '@/components/charts';
import { VirtualTable } from '@/components/tables/VirtualTable';
import { Badge, Card, Input, Select } from '@/components/ui';
import type { OrderConditionSummary, RoundItem } from '@/api/results';

type ChartType = 'line2d' | 'scatter2d' | 'bar2d' | 'scatter3d' | 'bar3d' | 'surface3d';

type StylePreset = 'ocean' | 'ember' | 'graphite';

interface FlatRoundRow {
  id: string;
  roundIndex: number;
  status: number;
  process: number;
  finalResult: number | null;
  params: Record<string, number>;
  outputs: Record<string, number>;
}

interface NumericFieldOption {
  key: string;
  label: string;
  group: 'base' | 'param' | 'output';
}

interface AnalysisSummary {
  min: number | null;
  max: number | null;
  avg: number | null;
  spread: number | null;
  best: FlatRoundRow | null;
  worst: FlatRoundRow | null;
  strongestParam: { key: string; label: string; score: number } | null;
}

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

const STATUS_LABELS: Record<number, string> = {
  0: '待运行',
  1: '运行中',
  2: '已完成',
  3: '失败',
};

const STYLE_PRESETS: Record<
  StylePreset,
  {
    colors: string[];
    areaColor: string;
    splitLineColor: string;
  }
> = {
  ocean: {
    colors: ['#0f766e', '#0891b2', '#2563eb', '#22c55e'],
    areaColor: 'rgba(14, 116, 144, 0.12)',
    splitLineColor: 'rgba(148, 163, 184, 0.18)',
  },
  ember: {
    colors: ['#b45309', '#f97316', '#dc2626', '#f59e0b'],
    areaColor: 'rgba(249, 115, 22, 0.12)',
    splitLineColor: 'rgba(251, 146, 60, 0.18)',
  },
  graphite: {
    colors: ['#334155', '#475569', '#64748b', '#0f172a'],
    areaColor: 'rgba(100, 116, 139, 0.12)',
    splitLineColor: 'rgba(100, 116, 139, 0.18)',
  },
};

const CHART_OPTIONS: Array<{ value: ChartType; label: string }> = [
  { value: 'line2d', label: '二维折线' },
  { value: 'scatter2d', label: '二维散点' },
  { value: 'bar2d', label: '二维柱状' },
  { value: 'scatter3d', label: '3D 点云' },
  { value: 'bar3d', label: '3D 柱状' },
  { value: 'surface3d', label: '3D 响应面' },
];

const STYLE_OPTIONS = [
  { value: 'ocean', label: 'Ocean' },
  { value: 'ember', label: 'Ember' },
  { value: 'graphite', label: 'Graphite' },
] satisfies Array<{ value: StylePreset; label: string }>;

const SAMPLE_OPTIONS = [
  { value: '200', label: '200 点' },
  { value: '1000', label: '1000 点' },
  { value: '5000', label: '5000 点' },
  { value: '20000', label: '20000 点' },
];

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatNumber = (value: number | null, digits = 3) =>
  value === null || !Number.isFinite(value) ? '--' : value.toFixed(digits);

const resolveConditionTitle = (condition: OrderConditionSummary | null, fallbackTitle?: string) => {
  if (fallbackTitle) return fallbackTitle;
  if (!condition) return '工况分析';
  const fold = condition.foldTypeName || `目标姿态#${condition.foldTypeId ?? '-'}`;
  const sim = condition.simTypeName || `仿真类型#${condition.simTypeId ?? '-'}`;
  return `工况 / ${fold} / ${sim}`;
};

const buildFlatRows = (rounds: RoundItem[]): FlatRoundRow[] =>
  rounds.map(round => {
    const params = Object.entries(round.paramValues || {}).reduce<Record<string, number>>(
      (acc, [key, value]) => {
        const numeric = toNumber(value);
        if (numeric !== null) {
          acc[key] = numeric;
        }
        return acc;
      },
      {}
    );

    const outputs = Object.entries(round.outputResults || {}).reduce<Record<string, number>>(
      (acc, [key, value]) => {
        const numeric = toNumber(value);
        if (numeric !== null) {
          acc[key] = numeric;
        }
        return acc;
      },
      {}
    );

    return {
      id: String(round.id),
      roundIndex: round.roundIndex,
      status: round.status,
      process: Number(round.progress || 0),
      finalResult: toNumber(round.finalResult),
      params,
      outputs,
    };
  });

const sampleRows = (rows: FlatRoundRow[], maxPoints: number) => {
  if (rows.length <= maxPoints) return rows;
  const step = Math.ceil(rows.length / maxPoints);
  return rows.filter((_, index) => index % step === 0);
};

const buildFieldOptions = (
  rows: FlatRoundRow[],
  metricLabelMap: Map<string, string>
): NumericFieldOption[] => {
  const options: NumericFieldOption[] = [
    { key: 'roundIndex', label: '轮次', group: 'base' },
    { key: 'process', label: '进度', group: 'base' },
  ];

  if (rows.some(row => row.finalResult !== null)) {
    options.push({ key: 'finalResult', label: '综合结果', group: 'output' });
  }

  const paramKeys = new Set<string>();
  const outputKeys = new Set<string>();

  rows.forEach(row => {
    Object.keys(row.params).forEach(key => paramKeys.add(key));
    Object.keys(row.outputs).forEach(key => outputKeys.add(key));
  });

  Array.from(paramKeys)
    .sort()
    .forEach(key => {
      options.push({ key: `param:${key}`, label: `参数 / ${key}`, group: 'param' });
    });

  Array.from(outputKeys)
    .sort()
    .forEach(key => {
      options.push({
        key: `output:${key}`,
        label: `输出 / ${metricLabelMap.get(key) || key}`,
        group: 'output',
      });
    });

  return options;
};

const getNumericValue = (row: FlatRoundRow, key: string): number | null => {
  if (key === 'roundIndex') return row.roundIndex;
  if (key === 'process') return row.process;
  if (key === 'finalResult') return row.finalResult;
  if (key.startsWith('param:')) {
    return row.params[key.replace('param:', '')] ?? null;
  }
  if (key.startsWith('output:')) {
    return row.outputs[key.replace('output:', '')] ?? null;
  }
  return null;
};

const buildAxisOptions = (fields: NumericFieldOption[]) =>
  fields.map(field => ({
    value: field.key,
    label: field.label,
  }));

const calculateCorrelation = (pairs: Array<[number, number]>) => {
  if (pairs.length < 3) return 0;
  const xAvg = pairs.reduce((sum, item) => sum + item[0], 0) / pairs.length;
  const yAvg = pairs.reduce((sum, item) => sum + item[1], 0) / pairs.length;
  let numerator = 0;
  let xDenominator = 0;
  let yDenominator = 0;

  pairs.forEach(([x, y]) => {
    const xDiff = x - xAvg;
    const yDiff = y - yAvg;
    numerator += xDiff * yDiff;
    xDenominator += xDiff * xDiff;
    yDenominator += yDiff * yDiff;
  });

  if (xDenominator <= 0 || yDenominator <= 0) return 0;
  return numerator / Math.sqrt(xDenominator * yDenominator);
};

const buildSummary = (
  rows: FlatRoundRow[],
  yField: string,
  fieldOptions: NumericFieldOption[]
): AnalysisSummary => {
  const values = rows
    .map(row => ({ row, value: getNumericValue(row, yField) }))
    .filter((item): item is { row: FlatRoundRow; value: number } => item.value !== null);

  if (values.length === 0) {
    return {
      min: null,
      max: null,
      avg: null,
      spread: null,
      best: null,
      worst: null,
      strongestParam: null,
    };
  }

  let minEntry = values[0];
  let maxEntry = values[0];
  let total = 0;

  values.forEach(item => {
    if (item.value < minEntry.value) minEntry = item;
    if (item.value > maxEntry.value) maxEntry = item;
    total += item.value;
  });

  const paramFields = fieldOptions.filter(option => option.group === 'param');
  let strongestParam: AnalysisSummary['strongestParam'] = null;

  paramFields.forEach(field => {
    const pairs = rows
      .map(row => {
        const xValue = getNumericValue(row, field.key);
        const yValue = getNumericValue(row, yField);
        return xValue !== null && yValue !== null ? ([xValue, yValue] as [number, number]) : null;
      })
      .filter((item): item is [number, number] => Array.isArray(item));
    const score = Math.abs(calculateCorrelation(pairs));
    if (!strongestParam || score > strongestParam.score) {
      strongestParam = { key: field.key, label: field.label, score };
    }
  });

  return {
    min: minEntry.value,
    max: maxEntry.value,
    avg: total / values.length,
    spread: maxEntry.value - minEntry.value,
    best: minEntry.row,
    worst: maxEntry.row,
    strongestParam,
  };
};

const buildGridBins = (
  rows: FlatRoundRow[],
  xField: string,
  yField: string,
  zField: string,
  binSize = 16
) => {
  const points = rows
    .map(row => {
      const x = getNumericValue(row, xField);
      const y = getNumericValue(row, yField);
      const z = getNumericValue(row, zField);
      return x !== null && y !== null && z !== null ? { x, y, z } : null;
    })
    .filter((item): item is { x: number; y: number; z: number } => Boolean(item));

  if (!points.length) {
    return { xLabels: [] as string[], yLabels: [] as string[], matrix: [] as number[][] };
  }

  const xMin = Math.min(...points.map(point => point.x));
  const xMax = Math.max(...points.map(point => point.x));
  const yMin = Math.min(...points.map(point => point.y));
  const yMax = Math.max(...points.map(point => point.y));
  const xSpan = xMax - xMin || 1;
  const ySpan = yMax - yMin || 1;

  const buckets = new Map<
    string,
    { total: number; count: number; xIndex: number; yIndex: number }
  >();

  points.forEach(point => {
    const xIndex = Math.min(binSize - 1, Math.floor(((point.x - xMin) / xSpan) * binSize));
    const yIndex = Math.min(binSize - 1, Math.floor(((point.y - yMin) / ySpan) * binSize));
    const key = `${xIndex}-${yIndex}`;
    const bucket = buckets.get(key) || { total: 0, count: 0, xIndex, yIndex };
    bucket.total += point.z;
    bucket.count += 1;
    buckets.set(key, bucket);
  });

  const xLabels = Array.from(
    { length: binSize },
    (_, index) => `${(xMin + (xSpan / binSize) * index).toFixed(2)}`
  );
  const yLabels = Array.from(
    { length: binSize },
    (_, index) => `${(yMin + (ySpan / binSize) * index).toFixed(2)}`
  );
  const matrix = Array.from(buckets.values()).map(bucket => [
    bucket.xIndex,
    bucket.yIndex,
    Number((bucket.total / bucket.count).toFixed(4)),
  ]);

  return { xLabels, yLabels, matrix };
};

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

  const [chartType, setChartType] = useState<ChartType>('scatter2d');
  const [stylePreset, setStylePreset] = useState<StylePreset>('ocean');
  const [sampleLimit, setSampleLimit] = useState('2000');
  const [xField, setXField] = useState('roundIndex');
  const [yField, setYField] = useState('');
  const [zField, setZField] = useState('');
  const [chartTitle, setChartTitle] = useState('');

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

  const chartOption = useMemo<EChartsOption>(() => {
    const title = chartTitle.trim() || `${currentYLabel} 分析`;
    const points = sampledRows
      .map(row => {
        const x = getNumericValue(row, xField);
        const y = getNumericValue(row, yField);
        const z = is3DChart ? getNumericValue(row, zField) : null;
        return { x, y, z, row };
      })
      .filter(item => item.x !== null && item.y !== null);

    if (!points.length) {
      return {
        title: {
          text: '当前筛选下暂无可视化数据',
          left: 'center',
          top: 'middle',
          textStyle: { fontSize: 14, color: '#64748b' },
        },
      } as EChartsOption;
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
        grid3D: {
          boxWidth: 120,
          boxDepth: 80,
          light: { main: { intensity: 1.1 }, ambient: { intensity: 0.35 } },
          viewControl: { projection: 'perspective' },
        },
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
        grid3D: {
          boxWidth: 110,
          boxDepth: 90,
          light: { main: { intensity: 1.2 }, ambient: { intensity: 0.3 } },
          viewControl: { projection: 'perspective' },
        },
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
      grid3D: {
        boxWidth: 110,
        boxDepth: 90,
        light: { main: { intensity: 1.2 }, ambient: { intensity: 0.28 } },
        viewControl: { projection: 'perspective' },
      },
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
    sampledRows,
    xField,
    yField,
    zField,
  ]);

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
      cell: ({ row }) => STATUS_LABELS[row.original.status] || `状态 ${row.original.status}`,
    });

    return columns;
  }, [currentXLabel, currentYLabel, currentZLabel, is3DChart, xField, yField, zField]);

  const previewRows = useMemo(() => sampleRows(rows, 2000), [rows]);
  const deferredPreviewRows = useDeferredValue(previewRows);

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
                分析页以当前工况为唯一主体，不再重复堆叠见证文案；组合校验信息保留在下方范围信息中。
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
              is3DChart ? 'xl:grid-cols-6' : 'xl:grid-cols-5'
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_380px]">
        <Card className="shadow-none">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
              <ChartColumnBig className="h-4 w-4 text-brand-500" />
              <span>自定义图形</span>
            </div>
            <BaseChart option={chartOption} height={520} loading={loading} largeData />
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-none">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                <Sigma className="h-4 w-4 text-brand-500" />
                <span>自动结果报告</span>
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
                  <span>工况ID</span>
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
            <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                预览行数 {deferredPreviewRows.length.toLocaleString()}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                当前图形 {CHART_OPTIONS.find(option => option.value === chartType)?.label}
              </span>
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
