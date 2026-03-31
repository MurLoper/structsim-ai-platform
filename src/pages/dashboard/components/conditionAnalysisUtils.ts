import type { EChartsOption } from 'echarts';
import type { OrderConditionSummary, RoundItem } from '@/api/results';

export type ChartType =
  | 'none'
  | 'line2d'
  | 'scatter2d'
  | 'bar2d'
  | 'scatter3d'
  | 'bar3d'
  | 'surface3d';

export type StylePreset = 'ocean' | 'ember' | 'graphite';
export type ThreeDViewMode = 'perspective' | 'orthographic';

export interface FlatRoundRow {
  id: string;
  roundIndex: number;
  status: number;
  process: number;
  finalResult: number | null;
  params: Record<string, number>;
  outputs: Record<string, number>;
}

export interface NumericFieldOption {
  key: string;
  label: string;
  group: 'base' | 'param' | 'output';
}

export interface AnalysisSummary {
  min: number | null;
  max: number | null;
  avg: number | null;
  spread: number | null;
  best: FlatRoundRow | null;
  worst: FlatRoundRow | null;
  strongestParam: { key: string; label: string; score: number } | null;
}

export const STATUS_LABELS: Record<number, string> = {
  0: '待运行',
  1: '运行中',
  2: '已完成',
  3: '失败',
};

export const STYLE_PRESETS: Record<
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

export const CHART_OPTIONS: Array<{ value: ChartType; label: string }> = [
  { value: 'none', label: '暂无图表（请选择）' },
  { value: 'line2d', label: '二维折线' },
  { value: 'scatter2d', label: '二维散点' },
  { value: 'bar2d', label: '二维柱状' },
  { value: 'scatter3d', label: '3D 点云' },
  { value: 'bar3d', label: '3D 柱状' },
  { value: 'surface3d', label: '3D 响应面' },
];

export const STYLE_OPTIONS = [
  { value: 'ocean', label: 'Ocean' },
  { value: 'ember', label: 'Ember' },
  { value: 'graphite', label: 'Graphite' },
] satisfies Array<{ value: StylePreset; label: string }>;

export const SAMPLE_OPTIONS = [
  { value: '200', label: '200 点' },
  { value: '1000', label: '1000 点' },
  { value: '5000', label: '5000 点' },
  { value: '20000', label: '20000 点' },
];

export const THREE_D_VIEW_OPTIONS = [
  { value: 'perspective', label: '3D 透视' },
  { value: 'orthographic', label: '正交平面' },
] satisfies Array<{ value: ThreeDViewMode; label: string }>;

type EchartsGlWindow = Window &
  typeof globalThis & {
    __structsimEchartsGlPromise__?: Promise<unknown>;
    __structsimEchartsGlLoaded__?: boolean;
  };

export const ensureEchartsGl = async () => {
  const scopedWindow = window as EchartsGlWindow;
  if (scopedWindow.__structsimEchartsGlLoaded__) {
    return;
  }

  if (!scopedWindow.__structsimEchartsGlPromise__) {
    scopedWindow.__structsimEchartsGlPromise__ = import('echarts-gl')
      .then(module => {
        scopedWindow.__structsimEchartsGlLoaded__ = true;
        return module;
      })
      .catch(error => {
        scopedWindow.__structsimEchartsGlPromise__ = undefined;
        throw error;
      });
  }

  await scopedWindow.__structsimEchartsGlPromise__;
};

export const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const formatNumber = (value: number | null, digits = 3) =>
  value === null || !Number.isFinite(value) ? '--' : value.toFixed(digits);

export const resolveConditionTitle = (
  condition: OrderConditionSummary | null,
  fallbackTitle?: string
) => {
  if (fallbackTitle) return fallbackTitle;
  if (!condition) return '工况分析';
  const fold = condition.foldTypeName || `目标姿态#${condition.foldTypeId ?? '-'}`;
  const sim = condition.simTypeName || `仿真类型#${condition.simTypeId ?? '-'}`;
  return `工况 / ${fold} / ${sim}`;
};

export const buildFlatRows = (rounds: RoundItem[]): FlatRoundRow[] =>
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

export const sampleRows = (rows: FlatRoundRow[], maxPoints: number) => {
  if (rows.length <= maxPoints) return rows;
  const step = Math.ceil(rows.length / maxPoints);
  return rows.filter((_, index) => index % step === 0);
};

export const buildFieldOptions = (
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

export const getNumericValue = (row: FlatRoundRow, key: string): number | null => {
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

export const buildAxisOptions = (fields: NumericFieldOption[]) =>
  fields.map(field => ({
    value: field.key,
    label: field.label,
  }));

export const calculateCorrelation = (pairs: Array<[number, number]>) => {
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

export const buildSummary = (
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

export const buildGridBins = (
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

export const buildGrid3DConfig = (
  mode: ThreeDViewMode,
  boxWidth = 110,
  boxDepth = 90,
  ambientIntensity = 0.3
) => ({
  boxWidth,
  boxDepth,
  light: { main: { intensity: 1.2 }, ambient: { intensity: ambientIntensity } },
  viewControl:
    mode === 'orthographic'
      ? {
          projection: 'orthographic' as const,
          alpha: 18,
          beta: 28,
          distance: 180,
          panSensitivity: 1,
          rotateSensitivity: 1,
          zoomSensitivity: 1,
        }
      : {
          projection: 'perspective' as const,
          alpha: 18,
          beta: 32,
          distance: 180,
          panSensitivity: 1,
          rotateSensitivity: 1,
          zoomSensitivity: 1,
        },
});

export const createEmptyChartOption = (text: string): EChartsOption =>
  ({
    title: {
      text,
      left: 'center',
      top: 'middle',
      textStyle: { fontSize: 14, color: '#64748b', fontWeight: 'normal' },
    },
  }) as EChartsOption;
