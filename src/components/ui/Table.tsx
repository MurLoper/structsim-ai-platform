import React from 'react';
import clsx from 'clsx';

interface Column<T> {
  key: string;
  title: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: keyof T | ((record: T) => string);
  loading?: boolean;
  emptyText?: string;
  onRowClick?: (record: T) => void;
  className?: string;
}

export function Table<T extends object>({
  columns,
  data,
  rowKey,
  loading = false,
  emptyText = 'No data available',
  onRowClick,
  className,
}: TableProps<T>) {
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return String(record[rowKey] ?? index);
  };

  const alignStyles = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <div className={clsx('overflow-x-auto', className)}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-secondary border-b border-border">
            {columns.map(col => (
              <th
                key={col.key}
                className={clsx(
                  'px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider',
                  alignStyles[col.align || 'left']
                )}
                style={{ width: col.width }}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center">
                <div className="flex justify-center">
                  <div className="spinner w-6 h-6" />
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-muted-foreground">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((record, index) => (
              <tr
                key={getRowKey(record, index)}
                onClick={() => onRowClick?.(record)}
                className={clsx(
                  'hover:bg-secondary/50 transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {columns.map(col => (
                  <td key={col.key} className={clsx('px-6 py-4', alignStyles[col.align || 'left'])}>
                    {col.render
                      ? col.render((record as Record<string, unknown>)[col.key], record, index)
                      : String((record as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
