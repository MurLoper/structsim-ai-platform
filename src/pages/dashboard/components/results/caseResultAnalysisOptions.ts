import type {
  ChartType,
  StylePreset,
  ThreeDViewMode,
} from '../conditionAnalysis/conditionAnalysisTypes';
import type { TranslationParams } from '@/locales';

type Translator = (key: string, params?: TranslationParams) => string;

export type FieldOption = { value: string; label: string; group: 'base' | 'param' | 'output' };

export const getCaseResultChartOptions = (t: Translator) =>
  [
    { value: 'line2d', label: t('res.analysis.chart.line2d') },
    { value: 'scatter2d', label: t('res.analysis.chart.scatter2d') },
    { value: 'bar2d', label: t('res.analysis.chart.bar2d') },
    { value: 'scatter3d', label: t('res.analysis.chart.scatter3d') },
    { value: 'bar3d', label: t('res.analysis.chart.bar3d') },
    { value: 'surface3d', label: t('res.analysis.chart.surface3d') },
  ] satisfies Array<{ value: ChartType; label: string }>;

export const getCaseResultSampleOptions = (t: Translator) =>
  [
    { value: '200', label: t('res.analysis.sample.200') },
    { value: '1000', label: t('res.analysis.sample.1000') },
    { value: '5000', label: t('res.analysis.sample.5000') },
    { value: '20000', label: t('res.analysis.sample.20000') },
  ] satisfies Array<{ value: string; label: string }>;

export const getCaseResultViewOptions = (t: Translator) =>
  [
    { value: 'perspective', label: t('res.analysis.view.perspective') },
    { value: 'orthographic', label: t('res.analysis.view.orthographic') },
  ] satisfies Array<{ value: ThreeDViewMode; label: string }>;

export const STYLE_PRESETS: Record<
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

export const STYLE_OPTIONS = [
  { value: 'ocean', label: 'Ocean' },
  { value: 'ember', label: 'Ember' },
  { value: 'graphite', label: 'Graphite' },
] satisfies Array<{ value: StylePreset; label: string }>;

export const getBaseAxisOptions = (t: Translator): FieldOption[] => [
  { value: 'roundIndex', label: t('res.analysis.axis.round'), group: 'base' },
  { value: 'process', label: t('res.analysis.axis.progress'), group: 'base' },
];
