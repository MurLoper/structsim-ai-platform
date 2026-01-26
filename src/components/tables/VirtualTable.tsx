/**
 * 虚拟滚动表格组件
 *
 * 基于 TanStack Table + TanStack Virtual 实现
 * 支持 2万+ 行数据流畅渲染
 *
 * @example
 * ```tsx
 * <VirtualTable
 *   data={largeDataset}
 *   columns={columns}
 *   onRowClick={(row) => console.log(row)}
 * />
 * ```
 */
import { useRef, useState, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type Row,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface VirtualTableProps<TData> {
  /** 表格数据 */
  data: TData[];
  /** 列定义 */
  columns: ColumnDef<TData, unknown>[];
  /** 行高度 (像素) */
  rowHeight?: number;
  /** 容器高度 (像素) */
  containerHeight?: number;
  /** 行点击回调 */
  onRowClick?: (row: TData) => void;
  /** 行双击回调 */
  onRowDoubleClick?: (row: TData) => void;
  /** 是否显示边框 */
  bordered?: boolean;
  /** 是否显示斑马纹 */
  striped?: boolean;
  /** 是否启用排序 */
  enableSorting?: boolean;
  /** 是否启用筛选 */
  enableFiltering?: boolean;
  /** 加载状态 */
  loading?: boolean;
  /** 空数据提示 */
  emptyText?: string;
  /** 自定义类名 */
  className?: string;
  /** 获取行 ID */
  getRowId?: (row: TData) => string;
  /** 选中的行 ID */
  selectedRowId?: string | null;
}

export function VirtualTable<TData>({
  data,
  columns,
  rowHeight = 48,
  containerHeight = 500,
  onRowClick,
  onRowDoubleClick,
  bordered = true,
  striped = false,
  enableSorting = true,
  enableFiltering = false,
  loading = false,
  emptyText = '暂无数据',
  className,
  getRowId,
  selectedRowId,
}: VirtualTableProps<TData>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getRowId: getRowId ? row => getRowId(row) : undefined,
  });

  const { rows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0 ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0) : 0;

  const handleRowClick = useCallback(
    (row: Row<TData>) => {
      onRowClick?.(row.original);
    },
    [onRowClick]
  );

  const handleRowDoubleClick = useCallback(
    (row: Row<TData>) => {
      onRowDoubleClick?.(row.original);
    },
    [onRowDoubleClick]
  );

  // 渲染排序图标
  const renderSortIcon = (isSorted: false | 'asc' | 'desc') => {
    if (isSorted === 'asc') {
      return <ChevronUp className="h-4 w-4" />;
    }
    if (isSorted === 'desc') {
      return <ChevronDown className="h-4 w-4" />;
    }
    return <ChevronsUpDown className="h-4 w-4 opacity-50" />;
  };

  if (loading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-card',
          bordered && 'border rounded-lg',
          className
        )}
        style={{ height: containerHeight }}
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <Spinner size="sm" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={cn('overflow-auto bg-card', bordered && 'border rounded-lg', className)}
      style={{ height: containerHeight }}
    >
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => {
                const canSort = header.column.getCanSort();
                return (
                  <th
                    key={header.id}
                    className={cn(
                      'px-4 py-3 text-left text-sm font-medium text-foreground',
                      'border-b border-border',
                      canSort && 'cursor-pointer select-none hover:bg-muted'
                    )}
                    style={{ width: header.getSize() }}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  >
                    <div className="flex items-center gap-1">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {canSort && renderSortIcon(header.column.getIsSorted())}
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {paddingTop > 0 && (
            <tr>
              <td style={{ height: paddingTop }} colSpan={columns.length} />
            </tr>
          )}
          {virtualRows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                {emptyText}
              </td>
            </tr>
          ) : (
            virtualRows.map(virtualRow => {
              const row = rows[virtualRow.index];
              const isSelected = selectedRowId ? row.id === selectedRowId : false;
              return (
                <tr
                  key={row.id}
                  data-index={virtualRow.index}
                  className={cn(
                    'border-b border-border transition-colors',
                    onRowClick && 'cursor-pointer',
                    striped && virtualRow.index % 2 === 1 && 'bg-muted/30',
                    isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                  )}
                  style={{ height: rowHeight }}
                  onClick={() => handleRowClick(row)}
                  onDoubleClick={() => handleRowDoubleClick(row)}
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className="px-4 py-2 text-sm"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
          {paddingBottom > 0 && (
            <tr>
              <td style={{ height: paddingBottom }} colSpan={columns.length} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
