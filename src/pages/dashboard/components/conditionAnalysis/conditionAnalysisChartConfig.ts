import type { EChartsOption } from 'echarts';
import type { FlatRoundRow, ThreeDViewMode } from './conditionAnalysisTypes';
import { getNumericValue } from './conditionAnalysisFields';

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
