import type { ChartType, StylePreset, ThreeDViewMode } from './conditionAnalysisTypes';

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
