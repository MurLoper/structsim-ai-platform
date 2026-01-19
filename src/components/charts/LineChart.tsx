/**
 * 折线图组件
 *
 * @example
 * ```tsx
 * <LineChart
 *   data={[
 *     { name: '1月', value: 100, category: '销售' },
 *     { name: '2月', value: 150, category: '销售' },
 *   ]}
 *   xField="name"
 *   yField="value"
 *   seriesField="category"
 * />
 * ```
 */
import { useMemo } from 'react';
import { BaseChart, type BaseChartProps } from './BaseChart';
import type { EChartsOption, LineSeriesOption } from 'echarts';

export interface LineChartProps extends Omit<BaseChartProps, 'option'> {
  /** 数据源 */
  data: Record<string, unknown>[];
  /** X 轴字段 */
  xField: string;
  /** Y 轴字段 */
  yField: string;
  /** 系列分组字段 */
  seriesField?: string;
  /** 是否平滑曲线 */
  smooth?: boolean;
  /** 是否显示面积 */
  showArea?: boolean;
  /** 是否显示数据点 */
  showSymbol?: boolean;
  /** X 轴标题 */
  xAxisTitle?: string;
  /** Y 轴标题 */
  yAxisTitle?: string;
  /** 是否显示图例 */
  showLegend?: boolean;
  /** 自定义系列配置 */
  seriesConfig?: Partial<LineSeriesOption>;
}

export function LineChart({
  data,
  xField,
  yField,
  seriesField,
  smooth = true,
  showArea = false,
  showSymbol = true,
  xAxisTitle,
  yAxisTitle,
  showLegend = true,
  seriesConfig,
  ...props
}: LineChartProps) {
  const option = useMemo<EChartsOption>(() => {
    // 提取 X 轴数据
    const xAxisData = [...new Set(data.map(d => String(d[xField])))];

    // 构建系列数据
    let series: LineSeriesOption[];

    if (seriesField) {
      // 多系列
      const seriesNames = [...new Set(data.map(d => String(d[seriesField])))];
      series = seriesNames.map(name => {
        const seriesData = xAxisData.map(x => {
          const item = data.find(d => String(d[xField]) === x && String(d[seriesField]) === name);
          return item ? (item[yField] as number) : null;
        });
        return {
          name,
          type: 'line' as const,
          data: seriesData,
          smooth,
          showSymbol,
          areaStyle: showArea ? { opacity: 0.3 } : undefined,
          ...seriesConfig,
        };
      });
    } else {
      // 单系列
      const seriesData = xAxisData.map(x => {
        const item = data.find(d => String(d[xField]) === x);
        return item ? (item[yField] as number) : null;
      });
      series = [
        {
          type: 'line' as const,
          data: seriesData,
          smooth,
          showSymbol,
          areaStyle: showArea ? { opacity: 0.3 } : undefined,
          ...seriesConfig,
        },
      ];
    }

    return {
      legend: showLegend ? { show: true } : { show: false },
      xAxis: {
        type: 'category',
        data: xAxisData,
        name: xAxisTitle,
      },
      yAxis: {
        type: 'value',
        name: yAxisTitle,
      },
      series,
    };
  }, [
    data,
    xField,
    yField,
    seriesField,
    smooth,
    showArea,
    showSymbol,
    xAxisTitle,
    yAxisTitle,
    showLegend,
    seriesConfig,
  ]);

  return <BaseChart option={option} {...props} />;
}
