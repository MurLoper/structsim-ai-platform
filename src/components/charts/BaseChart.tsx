import { useEffect, useMemo, useRef } from 'react';
import { BarChart, LineChart, PieChart, ScatterChart } from 'echarts/charts';
import {
  DataZoomComponent,
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  TransformComponent,
  VisualMapComponent,
} from 'echarts/components';
import { init, use as registerEchartsModules, type EChartsType } from 'echarts/core';
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { CHART_COLOR_PALETTE, CHART_LOADING_ACCENT, CHART_THEME_TOKENS } from './chartThemeTokens';

registerEchartsModules([
  BarChart,
  CanvasRenderer,
  DataZoomComponent,
  DatasetComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  PieChart,
  ScatterChart,
  SVGRenderer,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  TransformComponent,
  VisualMapComponent,
]);

export interface BaseChartProps {
  option: EChartsOption;
  height?: number | string;
  width?: number | string;
  loading?: boolean;
  loadingText?: string;
  onEvents?: Record<string, (params: unknown) => void>;
  onChartReady?: (chart: EChartsType) => void;
  className?: string;
  autoResize?: boolean;
  renderer?: 'canvas' | 'svg';
  largeData?: boolean;
}

export function BaseChart({
  option,
  height = 400,
  width = '100%',
  loading = false,
  loadingText = '加载中...',
  onEvents,
  onChartReady,
  className,
  autoResize: _autoResize = true,
  renderer = 'canvas',
  largeData = false,
}: BaseChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsType | null>(null);
  const { theme } = useTheme();
  const themeTokens = CHART_THEME_TOKENS[theme] || CHART_THEME_TOKENS.light;

  const mergedOption = useMemo<EChartsOption>(() => {
    const baseOption: EChartsOption = {
      backgroundColor: themeTokens.backgroundColor,
      textStyle: {
        color: themeTokens.textColor,
      },
      color: CHART_COLOR_PALETTE,
      grid: {
        top: 40,
        right: 20,
        bottom: 40,
        left: 50,
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: themeTokens.tooltipBackground,
        borderColor: themeTokens.tooltipBorder,
        textStyle: {
          color: themeTokens.textColor,
        },
      },
      legend: {
        textStyle: {
          color: themeTokens.textColor,
        },
      },
      xAxis: {
        axisLine: {
          lineStyle: { color: themeTokens.axisLineColor },
        },
        axisTick: {
          lineStyle: { color: themeTokens.axisLineColor },
        },
        axisLabel: {
          color: themeTokens.textColor,
        },
        splitLine: {
          lineStyle: { color: themeTokens.splitLineColor },
        },
      },
      yAxis: {
        axisLine: {
          lineStyle: { color: themeTokens.axisLineColor },
        },
        axisTick: {
          lineStyle: { color: themeTokens.axisLineColor },
        },
        axisLabel: {
          color: themeTokens.textColor,
        },
        splitLine: {
          lineStyle: { color: themeTokens.splitLineColor },
        },
      },
    };

    if (largeData) {
      return {
        ...baseOption,
        ...option,
        animation: false,
        large: true,
        largeThreshold: 2000,
        progressive: 1000,
        progressiveThreshold: 3000,
      };
    }

    return { ...baseOption, ...option };
  }, [largeData, option, themeTokens]);

  const loadingOption = useMemo(
    () => ({
      text: loadingText,
      color: CHART_LOADING_ACCENT,
      textColor: themeTokens.textColor,
      maskColor: themeTokens.loadingMaskColor,
    }),
    [loadingText, themeTokens]
  );

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const chart = init(containerRef.current, undefined, {
      renderer,
      width: 'auto',
      height: 'auto',
    });
    chartRef.current = chart;
    onChartReady?.(chart);

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, [onChartReady, renderer]);

  useEffect(() => {
    chartRef.current?.setOption(mergedOption, {
      notMerge: true,
      lazyUpdate: true,
    });
  }, [mergedOption]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) {
      return;
    }

    if (loading) {
      chart.showLoading('default', loadingOption);
    } else {
      chart.hideLoading();
    }
  }, [loading, loadingOption]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !onEvents) {
      return;
    }

    Object.entries(onEvents).forEach(([eventName, handler]) => {
      chart.on(eventName, handler);
    });

    return () => {
      Object.entries(onEvents).forEach(([eventName, handler]) => {
        chart.off(eventName, handler);
      });
    };
  }, [onEvents]);

  return <div ref={containerRef} className={cn('w-full', className)} style={{ width, height }} />;
}

export function useChartInstance(chartRef: React.RefObject<EChartsType | null>) {
  return useMemo(() => {
    return chartRef.current;
  }, [chartRef]);
}
