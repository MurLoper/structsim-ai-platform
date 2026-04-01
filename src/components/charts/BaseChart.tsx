import { useEffect, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import type { ECharts, EChartsOption } from 'echarts';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { CHART_COLOR_PALETTE, CHART_LOADING_ACCENT, CHART_THEME_TOKENS } from './chartThemeTokens';

export interface BaseChartProps {
  option: EChartsOption;
  height?: number | string;
  width?: number | string;
  loading?: boolean;
  loadingText?: string;
  onEvents?: Record<string, (params: unknown) => void>;
  onChartReady?: (chart: ECharts) => void;
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
  const chartRef = useRef<ReactECharts>(null);
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
    if (chartRef.current && onChartReady) {
      const chartInstance = chartRef.current.getEchartsInstance();
      onChartReady(chartInstance);
    }
  }, [onChartReady]);

  return (
    <div className={cn('w-full', className)} style={{ width, height }}>
      <ReactECharts
        ref={chartRef}
        option={mergedOption}
        style={{ width: '100%', height: '100%' }}
        showLoading={loading}
        loadingOption={loadingOption}
        onEvents={onEvents}
        opts={{
          renderer,
          width: 'auto',
          height: 'auto',
        }}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
}

export function useChartInstance(chartRef: React.RefObject<ReactECharts>) {
  return useMemo(() => {
    if (chartRef.current) {
      return chartRef.current.getEchartsInstance();
    }
    return null;
  }, [chartRef]);
}
