/**
 * 散点图组件
 *
 * 支持大数据量渲染，适合结果可视化
 *
 * @example
 * ```tsx
 * <ScatterChart
 *   data={[
 *     { x: 10, y: 20, category: 'A' },
 *     { x: 15, y: 25, category: 'B' },
 *   ]}
 *   xField="x"
 *   yField="y"
 *   seriesField="category"
 * />
 * ```
 */
import { useMemo } from 'react';
import { BaseChart, type BaseChartProps } from './BaseChart';
import type { EChartsOption, ScatterSeriesOption } from 'echarts';

export interface ScatterChartProps extends Omit<BaseChartProps, 'option'> {
  /** 数据源 */
  data: Record<string, unknown>[];
  /** X 轴字段 */
  xField: string;
  /** Y 轴字段 */
  yField: string;
  /** 系列分组字段 */
  seriesField?: string;
  /** 点大小字段 */
  sizeField?: string;
  /** 点大小范围 [min, max] */
  sizeRange?: [number, number];
  /** X 轴标题 */
  xAxisTitle?: string;
  /** Y 轴标题 */
  yAxisTitle?: string;
  /** 是否显示图例 */
  showLegend?: boolean;
  /** 默认点大小 */
  symbolSize?: number;
  /** 自定义系列配置 */
  seriesConfig?: Partial<ScatterSeriesOption>;
}

export function ScatterChart({
  data,
  xField,
  yField,
  seriesField,
  sizeField,
  sizeRange = [5, 30],
  xAxisTitle,
  yAxisTitle,
  showLegend = true,
  symbolSize = 10,
  seriesConfig,
  largeData,
  ...props
}: ScatterChartProps) {
  const option = useMemo<EChartsOption>(() => {
    // 计算大小映射
    let minSize = Infinity;
    let maxSize = -Infinity;
    if (sizeField) {
      data.forEach(d => {
        const size = d[sizeField] as number;
        if (size < minSize) minSize = size;
        if (size > maxSize) maxSize = size;
      });
    }

    const getSymbolSize = (item: Record<string, unknown>) => {
      if (!sizeField) return symbolSize;
      const size = item[sizeField] as number;
      if (maxSize === minSize) return (sizeRange[0] + sizeRange[1]) / 2;
      return (
        sizeRange[0] + ((size - minSize) / (maxSize - minSize)) * (sizeRange[1] - sizeRange[0])
      );
    };

    // 构建系列数据
    let series: ScatterSeriesOption[];

    if (seriesField) {
      // 多系列
      const seriesNames = [...new Set(data.map(d => String(d[seriesField])))];
      series = seriesNames.map(name => {
        const seriesData = data
          .filter(d => String(d[seriesField]) === name)
          .map(d => ({
            value: [d[xField] as number, d[yField] as number],
            symbolSize: getSymbolSize(d),
          }));
        return {
          name,
          type: 'scatter' as const,
          data: seriesData,
          ...seriesConfig,
        };
      });
    } else {
      // 单系列
      const seriesData = data.map(d => ({
        value: [d[xField] as number, d[yField] as number],
        symbolSize: getSymbolSize(d),
      }));
      series = [
        {
          type: 'scatter' as const,
          data: seriesData,
          symbolSize: sizeField ? undefined : symbolSize,
          ...seriesConfig,
        },
      ];
    }

    return {
      legend: showLegend ? { show: true } : { show: false },
      xAxis: {
        type: 'value',
        name: xAxisTitle,
        scale: true,
      },
      yAxis: {
        type: 'value',
        name: yAxisTitle,
        scale: true,
      },
      series,
    };
  }, [
    data,
    xField,
    yField,
    seriesField,
    sizeField,
    sizeRange,
    xAxisTitle,
    yAxisTitle,
    showLegend,
    symbolSize,
    seriesConfig,
  ]);

  // 自动检测是否为大数据
  const isLargeData = largeData ?? data.length > 5000;

  return <BaseChart option={option} largeData={isLargeData} {...props} />;
}
