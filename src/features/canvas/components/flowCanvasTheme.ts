import type { Theme } from '@/hooks/useTheme';

export type FlowCanvasThemeToken = {
  background: string;
  edge: string;
  miniMapMask: string;
  miniMapNode: string;
  backgroundDot: string;
};

export const FLOW_CANVAS_THEME_TOKENS: Record<Theme, FlowCanvasThemeToken> = {
  light: {
    background: '#ffffff',
    edge: '#94a3b8',
    miniMapMask: 'rgba(255, 255, 255, 0.8)',
    miniMapNode: '#94a3b8',
    backgroundDot: '#e2e8f0',
  },
  dark: {
    background: '#0f172a',
    edge: '#64748b',
    miniMapMask: 'rgba(15, 23, 42, 0.8)',
    miniMapNode: '#475569',
    backgroundDot: '#334155',
  },
  'eyecare-green': {
    background: '#fdf6e3',
    edge: '#93a1a1',
    miniMapMask: 'rgba(253, 246, 227, 0.8)',
    miniMapNode: '#93a1a1',
    backgroundDot: '#d4c4a8',
  },
  'eyecare-warm': {
    background: '#fdf6e3',
    edge: '#93a1a1',
    miniMapMask: 'rgba(253, 246, 227, 0.8)',
    miniMapNode: '#93a1a1',
    backgroundDot: '#d4c4a8',
  },
};
