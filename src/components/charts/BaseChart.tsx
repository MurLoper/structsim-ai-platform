/**
 * ECharts 基础图表组件
 *
 * 封装 echarts-for-react，提供主题适配和性能优化
 *
 * @example
 * ```tsx
 * <BaseChart
 *   option={{
 *     xAxis: { type: 'category', data: ['A', 'B', 'C'] },
 *     yAxis: { type: 'value' },
 *     series: [{ type: 'bar', data: [10, 20, 30] }]
 *   }}
 *   height={400}
 * />
 * ```
 */
import { useMemo, useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption, ECharts } from 'echarts';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

export interface BaseChartProps {
  /** ECharts 配置项 */
  option: EChartsOption;
  /** 图表高度 */
  height?: number | string;
  /** 图表宽度 */
  width?: number | string;
  /** 加载状态 */
  loading?: boolean;
  /** 加载文字 */
  loadingText?: string;
  /** 事件监听器 */
  onEvents?: Record<string, (params: unknown) => void>;
  /** 图表实例回调 */
  onChartReady?: (chart: ECharts) => void;
  /** 自定义类名 */
  className?: string;
  /** 是否自动调整大小 */
  autoResize?: boolean;
  /** 渲染器类型 */
  renderer?: 'canvas' | 'svg';
  /** 是否启用大数据优化 */
  largeData?: boolean;
}

/** 主题色板 */
const THEME_COLORS = {
  light: {
    textColor: '#374151',
    axisLineColor: '#e5e7eb',
    splitLineColor: '#f3f4f6',
    backgroundColor: 'transparent',
  },
  dark: {
    textColor: '#e5e7eb',
    axisLineColor: '#374151',
    splitLineColor: '#1f2937',
    backgroundColor: 'transparent',
  },
  eyecare: {
    textColor: '#5c534b',
    axisLineColor: '#d4c4a8',
    splitLineColor: '#eee8d5',
    backgroundColor: 'transparent',
  },
};

/** 默认颜色系列 */
const COLOR_PALETTE = [
  '#0ea5e9', // primary
  '#22c55e', // success
  '#f59e0b', // warning
  '#8b5cf6', // purple
  '#ef4444', // destructive
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
];

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
  const themeColors = THEME_COLORS[theme];

  // 合并主题配置
  const mergedOption = useMemo<EChartsOption>(() => {
    const baseOption: EChartsOption = {
      backgroundColor: themeColors.backgroundColor,
      textStyle: {
        color: themeColors.textColor,
      },
      color: COLOR_PALETTE,
      grid: {
        top: 40,
        right: 20,
        bottom: 40,
        left: 50,
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
        textStyle: {
          color: themeColors.textColor,
        },
      },
      legend: {
        textStyle: {
          color: themeColors.textColor,
        },
      },
      xAxis: {
        axisLine: {
          lineStyle: { color: themeColors.axisLineColor },
        },
        axisTick: {
          lineStyle: { color: themeColors.axisLineColor },
        },
        axisLabel: {
          color: themeColors.textColor,
        },
        splitLine: {
          lineStyle: { color: themeColors.splitLineColor },
        },
      },
      yAxis: {
        axisLine: {
          lineStyle: { color: themeColors.axisLineColor },
        },
        axisTick: {
          lineStyle: { color: themeColors.axisLineColor },
        },
        axisLabel: {
          color: themeColors.textColor,
        },
        splitLine: {
          lineStyle: { color: themeColors.splitLineColor },
        },
      },
    };

    // 大数据优化
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
  }, [option, theme, themeColors, largeData]);

  // 加载配置
  const loadingOption = useMemo(
    () => ({
      text: loadingText,
      color: '#0ea5e9',
      textColor: themeColors.textColor,
      maskColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.8)',
    }),
    [loadingText, theme, themeColors]
  );

  // 图表就绪回调
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

/**
 * 获取图表实例的 Hook
 */
export function useChartInstance(chartRef: React.RefObject<ReactECharts>) {
  return useMemo(() => {
    if (chartRef.current) {
      return chartRef.current.getEchartsInstance();
    }
    return null;
  }, [chartRef]);
}
