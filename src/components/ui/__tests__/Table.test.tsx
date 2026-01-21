/**
 * Table 组件测试
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Table } from '../Table';

interface RowData {
  id: number;
  name: string;
  value: number;
}

describe('Table', () => {
  const columns = [
    { key: 'name', title: '名称' },
    {
      key: 'value',
      title: '数值',
      align: 'right' as const,
      render: (value: unknown) => <span>值: {String(value)}</span>,
    },
  ];

  const data: RowData[] = [
    { id: 1, name: '项A', value: 10 },
    { id: 2, name: '项B', value: 20 },
  ];

  it('应该渲染表头与数据行', () => {
    render(<Table columns={columns} data={data} rowKey="id" />);

    expect(screen.getByText('名称')).toBeInTheDocument();
    expect(screen.getByText('数值')).toBeInTheDocument();
    expect(screen.getByText('项A')).toBeInTheDocument();
    expect(screen.getByText('项B')).toBeInTheDocument();
    expect(screen.getByText('值: 10')).toBeInTheDocument();
  });

  it('空数据时应显示空状态文本', () => {
    render(<Table columns={columns} data={[]} rowKey="id" emptyText="暂无数据" />);
    expect(screen.getByText('暂无数据')).toBeInTheDocument();
  });

  it('加载状态时显示加载指示', () => {
    const { container } = render(<Table columns={columns} data={[]} rowKey="id" loading />);
    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });

  it('点击行应触发回调并传递记录', () => {
    const handleRowClick = vi.fn();
    render(
      <Table columns={columns} data={data} rowKey="id" onRowClick={handleRowClick} />
    );

    fireEvent.click(screen.getByText('项A'));
    expect(handleRowClick).toHaveBeenCalledTimes(1);
    expect(handleRowClick).toHaveBeenCalledWith(data[0]);
  });

  it('支持使用函数作为 rowKey', () => {
    render(
      <Table
        columns={columns}
        data={data}
        rowKey={record => `row-${record.id}`}
      />
    );

    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(1);
  });
});
