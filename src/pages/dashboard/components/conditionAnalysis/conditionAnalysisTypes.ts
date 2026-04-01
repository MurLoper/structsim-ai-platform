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
