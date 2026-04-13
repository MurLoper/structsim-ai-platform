import type { EChartsOption } from 'echarts';
import type { TranslationParams } from '@/locales';
import {
  buildGrid3DConfig,
  buildGridBins,
  createEmptyChartOption,
} from '../conditionAnalysis/conditionAnalysisChartConfig';
import type {
  ChartType,
  FlatRoundRow,
  ThreeDViewMode,
} from '../conditionAnalysis/conditionAnalysisTypes';
import {
  formatNumber,
  formatThreeDTooltip,
  getFiniteRange,
  getNumericValue,
  isFiniteNumber,
} from './caseResultAnalysisDataMappers';

type Translator = (key: string, params?: TranslationParams) => string;

interface CaseResultStylePreset {
  colors: string[];
  areaColor: string;
  splitLineColor: string;
}

interface BuildCaseResultChartOptionParams {
  chartTitle: string;
  chartType: ChartType;
  currentPreset: CaseResultStylePreset;
  currentXLabel: string;
  currentYLabel: string;
  currentZLabel: string;
  is3DChart: boolean;
  isEchartsGlReady: boolean;
  sampledRows: FlatRoundRow[];
  threeDViewMode: ThreeDViewMode;
  xField: string;
  yField: string;
  zField: string;
  t: Translator;
}

export const buildCaseResultChartOption = ({
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
}: BuildCaseResultChartOptionParams): EChartsOption => {
  const title = chartTitle.trim() || t('res.analysis.title_suffix', { label: currentYLabel });

  if (!sampledRows.length) {
    return createEmptyChartOption(t('res.analysis.empty.no_rows'));
  }
  if (is3DChart && !isEchartsGlReady) {
    return createEmptyChartOption(t('res.analysis.empty.loading_3d'));
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
    return createEmptyChartOption(t('res.analysis.empty.no_axis_data'));
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
      return createEmptyChartOption(t('res.analysis.empty.no_z'));
    }
    const zRange = getFiniteRange(threeDPoints.map(item => item.z));
    if (!zRange) {
      return createEmptyChartOption(t('res.analysis.empty.no_z'));
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
    return createEmptyChartOption(t('res.analysis.empty.no_grid'));
  }
  const gridRange = getFiniteRange(gridMatrix.map(item => item[2]));
  if (!gridRange) {
    return createEmptyChartOption(t('res.analysis.empty.empty_grid'));
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
};
