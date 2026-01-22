/**
 * 虚拟滚动表格性能测试页面
 *
 * 测试目标：验证 VirtualTable 组件在 2万+ 行数据下的性能
 * 验收标准：滚动流畅，FPS > 30
 */
import { useState, useMemo } from 'react';
import { VirtualTable } from '@/components/tables/VirtualTable';
import { Button } from '@/components/ui/Button';
import { type ColumnDef } from '@tanstack/react-table';

interface TestData {
  id: number;
  name: string;
  value: number;
  status: string;
  timestamp: string;
  description: string;
}

function VirtualTableTest() {
  const [dataSize, setDataSize] = useState(1000);
  const [loading, setLoading] = useState(false);

  // 生成测试数据
  const generateData = (size: number): TestData[] => {
    const statuses = ['success', 'pending', 'failed', 'running'];
    return Array.from({ length: size }, (_, i) => ({
      id: i + 1,
      name: `测试项目 ${i + 1}`,
      value: Math.random() * 1000,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      timestamp: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      description: `这是第 ${i + 1} 条测试数据的描述信息`,
    }));
  };

  const data = useMemo(() => generateData(dataSize), [dataSize]);

  // 列定义
  const columns = useMemo<ColumnDef<TestData>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 80,
      },
      {
        accessorKey: 'name',
        header: '名称',
        size: 200,
      },
      {
        accessorKey: 'value',
        header: '数值',
        size: 120,
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return value.toFixed(2);
        },
      },
      {
        accessorKey: 'status',
        header: '状态',
        size: 100,
        cell: ({ getValue }) => {
          const status = getValue() as string;
          const colorMap: Record<string, string> = {
            success: 'text-green-600',
            pending: 'text-yellow-600',
            failed: 'text-red-600',
            running: 'text-blue-600',
          };
          return <span className={colorMap[status] || ''}>{status}</span>;
        },
      },
      {
        accessorKey: 'timestamp',
        header: '时间戳',
        size: 180,
        cell: ({ getValue }) => {
          const timestamp = getValue() as string;
          return new Date(timestamp).toLocaleString('zh-CN');
        },
      },
      {
        accessorKey: 'description',
        header: '描述',
        size: 300,
      },
    ],
    []
  );

  const handleLoadData = (size: number) => {
    setLoading(true);
    setDataSize(size);
    setTimeout(() => setLoading(false), 100);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">虚拟滚动表格性能测试</h1>
          <p className="text-muted-foreground mt-1">当前数据量: {dataSize.toLocaleString()} 行</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleLoadData(1000)} variant="outline">
            1千行
          </Button>
          <Button onClick={() => handleLoadData(5000)} variant="outline">
            5千行
          </Button>
          <Button onClick={() => handleLoadData(10000)} variant="outline">
            1万行
          </Button>
          <Button onClick={() => handleLoadData(20000)} variant="primary">
            2万行
          </Button>
          <Button onClick={() => handleLoadData(50000)} variant="danger">
            5万行
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-4">性能指标</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{dataSize.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">总行数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">48px</div>
            <div className="text-sm text-muted-foreground">行高</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">600px</div>
            <div className="text-sm text-muted-foreground">容器高度</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">~13</div>
            <div className="text-sm text-muted-foreground">可见行数</div>
          </div>
        </div>
      </div>

      <VirtualTable
        data={data}
        columns={columns}
        rowHeight={48}
        containerHeight={600}
        loading={loading}
        striped
        enableSorting
        onRowClick={row => console.log('点击行:', row)}
      />
    </div>
  );
}

export default VirtualTableTest;
