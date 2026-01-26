/**
 * 表格列定义工具函数
 *
 * 提供常用列类型的快速定义
 */
import { type ColumnDef, type CellContext } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

/**
 * 创建文本列
 */
export function createTextColumn<TData>(
  accessorKey: keyof TData & string,
  header: string,
  options?: {
    size?: number;
    enableSorting?: boolean;
    className?: string;
  }
): ColumnDef<TData> {
  return {
    accessorKey,
    header,
    size: options?.size,
    enableSorting: options?.enableSorting ?? true,
    cell: ({ getValue }) => (
      <span className={cn('truncate', options?.className)}>{getValue() as string}</span>
    ),
  };
}

/**
 * 创建数字列
 */
export function createNumberColumn<TData>(
  accessorKey: keyof TData & string,
  header: string,
  options?: {
    size?: number;
    precision?: number;
    suffix?: string;
    enableSorting?: boolean;
  }
): ColumnDef<TData> {
  return {
    accessorKey,
    header,
    size: options?.size ?? 100,
    enableSorting: options?.enableSorting ?? true,
    cell: ({ getValue }) => {
      const value = getValue() as number;
      if (value == null) return '-';
      const formatted =
        options?.precision != null ? value.toFixed(options.precision) : String(value);
      return (
        <span className="tabular-nums">
          {formatted}
          {options?.suffix}
        </span>
      );
    },
  };
}

/**
 * 创建状态列 (布尔值)
 */
export function createBooleanColumn<TData>(
  accessorKey: keyof TData & string,
  header: string,
  options?: {
    size?: number;
    trueText?: string;
    falseText?: string;
    useIcon?: boolean;
  }
): ColumnDef<TData> {
  return {
    accessorKey,
    header,
    size: options?.size ?? 80,
    enableSorting: false,
    cell: ({ getValue }) => {
      const value = getValue() as boolean | number;
      const isTrue = value === true || value === 1;

      if (options?.useIcon !== false) {
        return isTrue ? (
          <Check className="h-4 w-4 text-success" />
        ) : (
          <X className="h-4 w-4 text-muted-foreground" />
        );
      }

      return (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
            isTrue ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
          )}
        >
          {isTrue ? (options?.trueText ?? '启用') : (options?.falseText ?? '禁用')}
        </span>
      );
    },
  };
}

/**
 * 创建日期列
 */
export function createDateColumn<TData>(
  accessorKey: keyof TData & string,
  header: string,
  options?: {
    size?: number;
    format?: 'date' | 'datetime' | 'time';
    enableSorting?: boolean;
  }
): ColumnDef<TData> {
  return {
    accessorKey,
    header,
    size: options?.size ?? 150,
    enableSorting: options?.enableSorting ?? true,
    cell: ({ getValue }) => {
      const value = getValue() as number | string | Date;
      if (!value) return '-';

      const date =
        typeof value === 'number'
          ? new Date(value * 1000) // Unix timestamp
          : new Date(value);

      if (isNaN(date.getTime())) return '-';

      const formatType = options?.format ?? 'datetime';

      if (formatType === 'date') {
        return date.toLocaleDateString('zh-CN');
      }
      if (formatType === 'time') {
        return date.toLocaleTimeString('zh-CN');
      }
      return date.toLocaleString('zh-CN');
    },
  };
}

/**
 * 创建标签/徽章列
 */
export function createBadgeColumn<TData>(
  accessorKey: keyof TData & string,
  header: string,
  colorMap: Record<string, string>,
  options?: {
    size?: number;
  }
): ColumnDef<TData> {
  return {
    accessorKey,
    header,
    size: options?.size ?? 100,
    enableSorting: false,
    cell: ({ getValue }) => {
      const value = String(getValue() ?? '');
      const colorClass = colorMap[value] ?? 'bg-muted text-muted-foreground';

      return (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            colorClass
          )}
        >
          {value}
        </span>
      );
    },
  };
}

/**
 * 创建操作列
 */
export function createActionsColumn<TData>(
  renderActions: (row: TData, context: CellContext<TData, unknown>) => React.ReactNode,
  options?: {
    size?: number;
    header?: string;
  }
): ColumnDef<TData> {
  return {
    id: 'actions',
    header: options?.header ?? '操作',
    size: options?.size ?? 100,
    enableSorting: false,
    cell: context => renderActions(context.row.original, context),
  };
}

/**
 * 创建索引列 (行号)
 */
export function createIndexColumn<TData>(options?: {
  size?: number;
  header?: string;
}): ColumnDef<TData> {
  return {
    id: 'index',
    header: options?.header ?? '#',
    size: options?.size ?? 60,
    enableSorting: false,
    cell: ({ row }) => <span className="text-muted-foreground">{row.index + 1}</span>,
  };
}
