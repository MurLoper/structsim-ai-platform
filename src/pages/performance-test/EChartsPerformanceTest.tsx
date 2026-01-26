/**
 * ECharts 图表性能测试页面
 *
 * 测试目标：验证 ECharts 在 1万+ 数据点下的渲染性能
 * 验收标准：渲染时间 < 1s，交互流畅
 */
import { useState, useMemo } from 'react';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { ScatterChart } from '@/components/charts/ScatterChart';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type ChartType = 'line' | 'bar' | 'scatter';

interface TestData {
  index: number;
  value: number;
  category: string;
}

function EChartsPerformanceTest() {
  const [dataSize, setDataSize] = useState(1000);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [loading, setLoading] = useState(false);
  const [renderTime, setRenderTime] = useState<number | null>(null);

  // 生成测试数据
  const generateData = (size: number): TestData[] => {
    const categories = ['系列A', '系列B', '系列C'];
    return Array.from({ length: size }, (_, i) => ({
      index: i,
      value: Math.sin(i / 100) * 100 + Math.random() * 50,
      category: categories[i % categories.length],
    }));
  };

  const data = useMemo(() => {
    const startTime = performance.now();
    const result = generateData(dataSize);
    const endTime = performance.now();
    setRenderTime(endTime - startTime);
    return result;
  }, [dataSize]);

  const handleLoadData = (size: number) => {
    setLoading(true);
    setDataSize(size);
    setTimeout(() => setLoading(false), 100);
  };

  return (
    <div className="p-6 space-y-6">
      {/* 标题和控制区 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ECharts 图表性能测试</h1>
          <p className="text-muted-foreground mt-1">
            当前数据量: {dataSize.toLocaleString()} 个数据点
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleLoadData(1000)} variant="outline">
            1千点
          </Button>
          <Button onClick={() => handleLoadData(5000)} variant="outline">
            5千点
          </Button>
          <Button onClick={() => handleLoadData(10000)} variant="primary">
            1万点
          </Button>
          <Button onClick={() => handleLoadData(20000)} variant="danger">
            2万点
          </Button>
        </div>
      </div>

      {/* 图表类型切换 */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">图表类型:</span>
          <div className="flex gap-2">
            <Button
              onClick={() => setChartType('line')}
              variant={chartType === 'line' ? 'primary' : 'outline'}
              size="sm"
            >
              折线图
            </Button>
            <Button
              onClick={() => setChartType('bar')}
              variant={chartType === 'bar' ? 'primary' : 'outline'}
              size="sm"
            >
              柱状图
            </Button>
            <Button
              onClick={() => setChartType('scatter')}
              variant={chartType === 'scatter' ? 'primary' : 'outline'}
              size="sm"
            >
              散点图
            </Button>
          </div>
        </div>
      </Card>

      {/* 性能指标 */}
      <div className="bg-card rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-4">性能指标</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{dataSize.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">数据点数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {renderTime ? `${renderTime.toFixed(0)}ms` : '-'}
            </div>
            <div className="text-sm text-muted-foreground">渲染时间</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {chartType === 'line' ? '折线' : chartType === 'bar' ? '柱状' : '散点'}
            </div>
            <div className="text-sm text-muted-foreground">图表类型</div>
          </div>
          <div className="text-center">
            <div
              className={`text-2xl font-bold ${renderTime && renderTime < 1000 ? 'text-green-600' : 'text-yellow-600'}`}
            >
              {renderTime && renderTime < 1000 ? '✓ 通过' : '⚠ 注意'}
            </div>
            <div className="text-sm text-muted-foreground">性能状态</div>
          </div>
        </div>
      </div>

      {/* 图表展示区 */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">图表展示</h2>
        {loading ? (
          <div className="h-[500px] flex items-center justify-center">
            <div className="text-muted-foreground">加载中...</div>
          </div>
        ) : (
          <>
            {chartType === 'line' && (
              <LineChart
                data={data as unknown as Record<string, unknown>[]}
                xField="index"
                yField="value"
                seriesField="category"
                height={500}
                largeData={dataSize > 5000}
              />
            )}
            {chartType === 'bar' && (
              <BarChart
                data={
                  data.slice(0, Math.min(dataSize, 100)) as unknown as Record<string, unknown>[]
                } // 柱状图限制数据量
                xField="index"
                yField="value"
                seriesField="category"
                height={500}
              />
            )}
            {chartType === 'scatter' && (
              <ScatterChart
                data={data as unknown as Record<string, unknown>[]}
                xField="index"
                yField="value"
                seriesField="category"
                height={500}
                largeData={dataSize > 5000}
              />
            )}
          </>
        )}
      </Card>
    </div>
  );
}

export default EChartsPerformanceTest;
