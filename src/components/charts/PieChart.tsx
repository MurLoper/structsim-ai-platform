/**
 * 饼图组件
 *
 * @example
 * ```tsx
 * <PieChart
 *   data={[
 *     { name: '类别A', value: 30 },
 *     { name: '类别B', value: 70 },
 *   ]}
 *   nameField="name"
 *   valueField="value"
 * />
 * ```
 */
import { useMemo } from 'react';
import { BaseChart, type BaseChartProps } from './BaseChart';
import type { EChartsOption, PieSeriesOption } from 'echarts';

export interface PieChartProps extends Omit<BaseChartProps, 'option'> {
  /** 数据源 */
  data: Record<string, unknown>[];
  /** 名称字段 */
  nameField: string;
  /** 数值字段 */
  valueField: string;
  /** 是否环形图 */
  donut?: boolean;
  /** 内半径 (环形图) */
  innerRadius?: string | number;
  /** 外半径 */
  outerRadius?: string | number;
  /** 是否显示图例 */
  showLegend?: boolean;
  /** 是否显示标签 */
  showLabel?: boolean;
  /** 标签位置 */
  labelPosition?: 'outside' | 'inside' | 'center';
  /** 是否玫瑰图 */
  roseType?: boolean | 'radius' | 'area';
  /** 自定义系列配置 */
  seriesConfig?: Partial<PieSeriesOption>;
}

export function PieChart({
  data,
  nameField,
  valueField,
  donut = false,
  innerRadius = '50%',
  outerRadius = '70%',
  showLegend = true,
  showLabel = true,
  labelPosition = 'outside',
  roseType = false,
  seriesConfig,
  ...props
}: PieChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const pieData = data.map(d => ({
      name: String(d[nameField]),
      value: d[valueField] as number,
    }));

    const series: PieSeriesOption[] = [
      {
        type: 'pie',
        radius: donut ? [innerRadius, outerRadius] : outerRadius,
        center: ['50%', '50%'],
        data: pieData,
        roseType: roseType === true ? 'radius' : roseType || undefined,
        label: {
          show: showLabel,
          position: labelPosition,
          formatter: labelPosition === 'inside' ? '{d}%' : '{b}: {d}%',
        },
        labelLine: {
          show: showLabel && labelPosition === 'outside',
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
          },
        },
        itemStyle: {
          borderRadius: 4,
          borderColor: 'transparent',
          borderWidth: 2,
        },
        ...seriesConfig,
      },
    ];

    return {
      legend: showLegend
        ? {
            show: true,
            orient: 'vertical',
            right: 10,
            top: 'center',
          }
        : { show: false },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      series,
    };
  }, [
    data,
    nameField,
    valueField,
    donut,
    innerRadius,
    outerRadius,
    showLegend,
    showLabel,
    labelPosition,
    roseType,
    seriesConfig,
  ]);

  return <BaseChart option={option} {...props} />;
}
