import type { Theme } from '@/hooks/useTheme';

export type ChartThemeToken = {
  textColor: string;
  axisLineColor: string;
  splitLineColor: string;
  tooltipBackground: string;
  tooltipBorder: string;
  loadingMaskColor: string;
  backgroundColor: string;
};

export const CHART_COLOR_PALETTE = [
  '#0ea5e9',
  '#22c55e',
  '#f59e0b',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
];

export const CHART_LOADING_ACCENT = '#0ea5e9';

export const CHART_THEME_TOKENS: Record<Theme, ChartThemeToken> = {
  light: {
    textColor: '#374151',
    axisLineColor: '#e5e7eb',
    splitLineColor: '#f3f4f6',
    tooltipBackground: '#ffffff',
    tooltipBorder: '#e5e7eb',
    loadingMaskColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'transparent',
  },
  dark: {
    textColor: '#e5e7eb',
    axisLineColor: '#374151',
    splitLineColor: '#1f2937',
    tooltipBackground: '#1f2937',
    tooltipBorder: '#374151',
    loadingMaskColor: 'rgba(0, 0, 0, 0.5)',
    backgroundColor: 'transparent',
  },
  'eyecare-green': {
    textColor: '#1F3D2B',
    axisLineColor: '#C1DEC9',
    splitLineColor: '#DDF2E3',
    tooltipBackground: '#ffffff',
    tooltipBorder: '#C1DEC9',
    loadingMaskColor: 'rgba(255, 255, 255, 0.82)',
    backgroundColor: 'transparent',
  },
  'eyecare-warm': {
    textColor: '#4A3B32',
    axisLineColor: '#EBE3D5',
    splitLineColor: '#FAF7F2',
    tooltipBackground: '#ffffff',
    tooltipBorder: '#EBE3D5',
    loadingMaskColor: 'rgba(255, 255, 255, 0.82)',
    backgroundColor: 'transparent',
  },
};
