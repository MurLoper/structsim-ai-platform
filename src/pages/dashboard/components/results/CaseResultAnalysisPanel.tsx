import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { EChartsOption } from 'echarts';
import { Card, Input, Select } from '@/components/ui';
import { BaseChart } from '@/components/charts';
import {
  buildGrid3DConfig,
  buildGridBins,
  createEmptyChartOption,
  ensureEchartsGl,
} from '../conditionAnalysis/conditionAnalysisChartConfig';
import type {
  ChartType,
  FlatRoundRow,
  StylePreset,
  ThreeDViewMode,
} from '../conditionAnalysis/conditionAnalysisTypes';
import type { ConditionRoundsGroup } from '../../hooks/resultsAnalysisTypes';

interface CaseResultAnalysisPanelProps {
  roundGroups: ConditionRoundsGroup[];
  loading?: boolean;
}

type FieldOption = { value: string; label: string; group: 'base' | 'param' | 'output' };

const CHART_OPTIONS = [
  { value: 'line2d', label: '二维折线' },
  { value: 'scatter2d', label: '二维散点' },
  { value: 'bar2d', label: '二维柱状' },
  { value: 'scatter3d', label: '3D 点云' },
  { value: 'bar3d', label: '3D 柱状' },
  { value: 'surface3d', label: '3D 响应面' },
] satisfies Array<{ value: ChartType; label: string }>;

const STYLE_PRESETS: Record<
  StylePreset,
  { colors: string[]; areaColor: string; splitLineColor: string }
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

const THREE_D_VIEW_OPTIONS = [
  { value: 'perspective', label: '3D 透视' },
  { value: 'orthographic', label: '正交视图' },
] satisfies Array<{ value: ThreeDViewMode; label: string }>;

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const getFiniteRange = (values: number[]) => {
  const finiteValues = values.filter(value => Number.isFinite(value));
  if (!finiteValues.length) return null;
  const min = Math.min(...finiteValues);
  const max = Math.max(...finiteValues);
  if (min === max) {
    const padding = Math.max(Math.abs(min) * 0.05, 1);
    return { min: min - padding, max: max + padding };
  }
  return { min, max };
};

const formatNumber = (value: number | null) =>
  value === null || !Number.isFinite(value) ? '--' : Number(value.toFixed(4));

const sampleRows = (rows: FlatRoundRow[], maxPoints: number) => {
  if (rows.length <= maxPoints) return rows;
  const step = Math.ceil(rows.length / maxPoints);
  return rows.filter((_, index) => index % step === 0);
};

const getNumericValue = (row: FlatRoundRow, key: string): number | null => {
  if (key === 'roundIndex') return row.roundIndex;
  if (key === 'process') return row.process;
  if (key === 'finalResult') return row.finalResult;
  if (key.startsWith('param:')) return row.params[key.replace('param:', '')] ?? null;
  if (key.startsWith('output:')) return row.outputs[key.replace('output:', '')] ?? null;
  return null;
};

const formatThreeDTooltip = (params: unknown, xLabel: string, yLabel: string, zLabel: string) => {
  const value = (params as { value?: unknown })?.value;
  const tuple = Array.isArray(value) ? value : [];
  return `${xLabel}: ${formatNumber(toNumber(tuple[0]))}<br/>${yLabel}: ${formatNumber(
    toNumber(tuple[1])
  )}<br/>${zLabel}: ${formatNumber(toNumber(tuple[2]))}`;
};

const buildAxisOptions = (rows: FlatRoundRow[]): FieldOption[] => {
  const options: FieldOption[] = [
    { value: 'roundIndex', label: '轮次', group: 'base' },
    { value: 'process', label: '进度', group: 'base' },
  ];

  if (rows.some(row => row.finalResult !== null)) {
    options.push({ value: 'finalResult', label: '最终结果', group: 'output' });
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
      options.push({ value: `param:${key}`, label: `参数 / ${key}`, group: 'param' });
    });

  Array.from(outputKeys)
    .sort()
    .forEach(key => {
      options.push({ value: `output:${key}`, label: `输出 / ${key}`, group: 'output' });
    });

  return options;
};

export const CaseResultAnalysisPanel: React.FC<CaseResultAnalysisPanelProps> = ({
  roundGroups,
  loading = false,
}) => {
  const [chartType, setChartType] = useState<ChartType>('scatter3d');
  const [stylePreset, setStylePreset] = useState<StylePreset>('ocean');
  const [sampleLimit, setSampleLimit] = useState('1000');
  const [xField, setXField] = useState('roundIndex');
  const [yField, setYField] = useState('finalResult');
  const [zField, setZField] = useState('process');
  const [chartTitle, setChartTitle] = useState('');
  const [threeDViewMode, setThreeDViewMode] = useState<ThreeDViewMode>('perspective');
  const [isEchartsGlReady, setIsEchartsGlReady] = useState(false);

  const rows = useMemo<FlatRoundRow[]>(
    () =>
      roundGroups.flatMap(group => {
        return group.rounds.map(round => {
          const params = Object.entries(round.paramValues || {}).reduce<Record<string, number>>(
            (acc, [key, value]) => {
              const numeric = toNumber(value);
              if (numeric !== null) acc[key] = numeric;
              return acc;
            },
            {}
          );
          const outputs = Object.entries(round.outputResults || {}).reduce<Record<string, number>>(
            (acc, [key, value]) => {
              const numeric = toNumber(value);
              if (numeric !== null) acc[key] = numeric;
              return acc;
            },
            {}
          );

          return {
            id: `${group.conditionId}-${round.id}`,
            roundIndex: Number(round.roundIndex || 0),
            status: Number(round.status || 0),
            process: Number(round.progress || 0),
            finalResult: toNumber(round.finalResult),
            params,
            outputs,
          };
        });
      }),
    [roundGroups]
  );

  const axisOptions = useMemo(() => buildAxisOptions(rows), [rows]);
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

  const chartOption = useMemo<EChartsOption>(() => {
    const title = chartTitle.trim() || `${currentYLabel} 分析`;

    if (!sampledRows.length) {
      return createEmptyChartOption('当前方案暂无可绘制的数据');
    }
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
      .filter(
        (item): item is { x: number; y: number; z: number | null; row: FlatRoundRow } =>
          isFiniteNumber(item.x) && isFiniteNumber(item.y)
      );

    if (!points.length) {
      return createEmptyChartOption('当前坐标轴组合暂无可视化数据');
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
      };
    }

    if (chartType === 'bar2d') {
      const barData = points
        .slice(0, 240)
        .map((item, index) => [`${formatNumber(item.x)}-${index + 1}`, item.y as number]);
      return {
        color: currentPreset.colors,
        title: { text: title, left: 20, top: 12, textStyle: { fontSize: 14 } },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', name: currentXLabel, data: barData.map(item => item[0]) },
        yAxis: { type: 'value', name: currentYLabel },
        grid: { left: 60, right: 24, top: 54, bottom: 72 },
        series: [
          { type: 'bar', name: currentYLabel, barMaxWidth: 22, data: barData.map(item => item[1]) },
        ],
      };
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
      };
    }

    if (chartType === 'scatter3d') {
      const threeDPoints = points.filter(
        (item): item is { x: number; y: number; z: number; row: FlatRoundRow } =>
          isFiniteNumber(item.x) && isFiniteNumber(item.y) && isFiniteNumber(item.z)
      );
      if (!threeDPoints.length) {
        return createEmptyChartOption('当前 Z 轴没有有效数值，无法绘制 3D 点云');
      }
      const zRange = getFiniteRange(threeDPoints.map(item => item.z));
      if (!zRange) {
        return createEmptyChartOption('当前 Z 轴没有有效数值，无法绘制 3D 点云');
      }
      const threeDData = threeDPoints.map(item => [item.x, item.y, item.z]);
      return {
        color: currentPreset.colors,
        title: { text: title, left: 20, top: 12, textStyle: { fontSize: 14 } },
        tooltip: {
          formatter: params =>
            formatThreeDTooltip(params, currentXLabel, currentYLabel, currentZLabel),
        },
        xAxis3D: { type: 'value', name: currentXLabel },
        yAxis3D: { type: 'value', name: currentYLabel },
        zAxis3D: { type: 'value', name: currentZLabel },
        grid3D: buildGrid3DConfig(threeDViewMode, 120, 80, 0.35),
        visualMap: {
          min: zRange.min,
          max: zRange.max,
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
            data: threeDData,
          } as unknown,
        ],
      } as EChartsOption;
    }

    const gridBins = buildGridBins(sampledRows, xField, yField, zField);
    const gridMatrix = gridBins.matrix.filter(
      item => item.length >= 3 && item.every(Number.isFinite)
    );
    if (!gridMatrix.length) {
      return createEmptyChartOption('当前坐标轴组合没有足够的 3D 网格数据');
    }
    const gridRange = getFiniteRange(gridMatrix.map(item => item[2]));
    if (!gridRange) {
      return createEmptyChartOption('当前 3D 网格结果为空');
    }
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
          min: gridRange.min,
          max: gridRange.max,
          calculable: true,
          inRange: { color: currentPreset.colors },
          right: 16,
          top: 60,
        },
        series: [{ type: 'bar3D', shading: 'lambert', data: gridMatrix } as unknown],
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
        min: gridRange.min,
        max: gridRange.max,
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
          data: gridMatrix,
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

  if (!roundGroups.length) {
    return (
      <Card className="shadow-none">
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          当前方案暂无可分析的结果数据
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-none">
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="text-sm font-semibold text-foreground">方案级数据分析</div>
            <div className="text-xs text-muted-foreground">
              可自定义图形类型和坐标轴；3D 图基于当前方案已加载结果动态渲染，不额外请求外部数据库。
            </div>
          </div>

          <div
            className={`grid gap-4 md:grid-cols-2 ${is3DChart ? 'xl:grid-cols-7' : 'xl:grid-cols-5'}`}
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
