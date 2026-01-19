/**
 * 柱状图组件
 *
 * @example
 * ```tsx
 * <BarChart
 *   data={[
 *     { name: '产品A', value: 100 },
 *     { name: '产品B', value: 200 },
 *   ]}
 *   xField="name"
 *   yField="value"
 * />
 * ```
 */
import { useMemo } from 'react';
import { BaseChart, type BaseChartProps } from './BaseChart';
import type { EChartsOption, BarSeriesOption } from 'echarts';

export interface BarChartProps extends Omit<BaseChartProps, 'option'> {
  /** 数据源 */
  data: Record<string, unknown>[];
  /** X 轴字段 */
  xField: string;
  /** Y 轴字段 */
  yField: string;
  /** 系列分组字段 */
  seriesField?: string;
  /** 是否水平方向 */
  horizontal?: boolean;
  /** 是否堆叠 */
  stacked?: boolean;
  /** X 轴标题 */
  xAxisTitle?: string;
  /** Y 轴标题 */
  yAxisTitle?: string;
  /** 是否显示图例 */
  showLegend?: boolean;
  /** 柱子圆角 */
  barRadius?: number;
  /** 柱子宽度 */
  barWidth?: number | string;
  /** 自定义系列配置 */
  seriesConfig?: Partial<BarSeriesOption>;
}

export function BarChart({
  data,
  xField,
  yField,
  seriesField,
  horizontal = false,
  stacked = false,
  xAxisTitle,
  yAxisTitle,
  showLegend = true,
  barRadius = 4,
  barWidth,
  seriesConfig,
  ...props
}: BarChartProps) {
  const option = useMemo<EChartsOption>(() => {
    // 提取类别数据
    const categoryData = [...new Set(data.map(d => String(d[xField])))];

    // 构建系列数据
    let series: BarSeriesOption[];

    if (seriesField) {
      // 多系列
      const seriesNames = [...new Set(data.map(d => String(d[seriesField])))];
      series = seriesNames.map(name => {
        const seriesData = categoryData.map(x => {
          const item = data.find(d => String(d[xField]) === x && String(d[seriesField]) === name);
          return item ? (item[yField] as number) : 0;
        });
        return {
          name,
          type: 'bar' as const,
          data: seriesData,
          stack: stacked ? 'total' : undefined,
          barWidth,
          itemStyle: {
            borderRadius: horizontal ? [0, barRadius, barRadius, 0] : [barRadius, barRadius, 0, 0],
          },
          ...seriesConfig,
        };
      });
    } else {
      // 单系列
      const seriesData = categoryData.map(x => {
        const item = data.find(d => String(d[xField]) === x);
        return item ? (item[yField] as number) : 0;
      });
      series = [
        {
          type: 'bar' as const,
          data: seriesData,
          barWidth,
          itemStyle: {
            borderRadius: horizontal ? [0, barRadius, barRadius, 0] : [barRadius, barRadius, 0, 0],
          },
          ...seriesConfig,
        },
      ];
    }

    // 轴配置
    const categoryAxis = {
      type: 'category' as const,
      data: categoryData,
      name: horizontal ? yAxisTitle : xAxisTitle,
    };
    const valueAxis = {
      type: 'value' as const,
      name: horizontal ? xAxisTitle : yAxisTitle,
    };

    return {
      legend: showLegend ? { show: true } : { show: false },
      xAxis: horizontal ? valueAxis : categoryAxis,
      yAxis: horizontal ? categoryAxis : valueAxis,
      series,
    };
  }, [
    data,
    xField,
    yField,
    seriesField,
    horizontal,
    stacked,
    xAxisTitle,
    yAxisTitle,
    showLegend,
    barRadius,
    barWidth,
    seriesConfig,
  ]);

  return <BaseChart option={option} {...props} />;
}
