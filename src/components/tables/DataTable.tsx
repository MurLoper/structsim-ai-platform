/**
 * 数据表格组件
 *
 * 基于 VirtualTable 的高级封装，添加搜索、工具栏等功能
 *
 * @example
 * ```tsx
 * <DataTable
 *   data={projects}
 *   columns={projectColumns}
 *   searchable
 *   searchPlaceholder="搜索项目..."
 *   toolbar={<Button>新增</Button>}
 * />
 * ```
 */
import { useState, useMemo, useCallback } from 'react';
import { VirtualTable, type VirtualTableProps } from './VirtualTable';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';

export interface DataTableProps<TData> extends VirtualTableProps<TData> {
  /** 是否显示搜索框 */
  searchable?: boolean;
  /** 搜索框占位符 */
  searchPlaceholder?: string;
  /** 搜索字段 (用于过滤的字段名) */
  searchFields?: (keyof TData)[];
  /** 工具栏内容 */
  toolbar?: React.ReactNode;
  /** 表格标题 */
  title?: string;
  /** 显示数据统计 */
  showCount?: boolean;
  /** 外层容器类名 */
  wrapperClassName?: string;
}

export function DataTable<TData extends object>({
  data,
  columns,
  searchable = false,
  searchPlaceholder = '搜索...',
  searchFields,
  toolbar,
  title,
  showCount = true,
  wrapperClassName,
  className,
  ...tableProps
}: DataTableProps<TData>) {
  const [searchValue, setSearchValue] = useState('');

  // 过滤数据
  const filteredData = useMemo(() => {
    if (!searchValue.trim() || !searchable) {
      return data;
    }

    const lowerSearch = searchValue.toLowerCase();
    return data.filter(row => {
      // 如果指定了搜索字段，只搜索这些字段
      if (searchFields && searchFields.length > 0) {
        return searchFields.some(field => {
          const value = row[field];
          if (value == null) return false;
          return String(value).toLowerCase().includes(lowerSearch);
        });
      }
      // 否则搜索所有字段
      return Object.values(row).some(value => {
        if (value == null) return false;
        return String(value).toLowerCase().includes(lowerSearch);
      });
    });
  }, [data, searchValue, searchable, searchFields]);

  const handleClearSearch = useCallback(() => {
    setSearchValue('');
  }, []);

  const hasToolbar = searchable || toolbar || title;

  return (
    <div className={cn('flex flex-col gap-4', wrapperClassName)}>
      {hasToolbar && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}
            {showCount && (
              <span className="text-sm text-muted-foreground">
                共 {filteredData.length} 条
                {searchValue && data.length !== filteredData.length && (
                  <span> (已筛选，原 {data.length} 条)</span>
                )}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value)}
                  placeholder={searchPlaceholder}
                  className={cn(
                    'h-9 w-64 rounded-lg border border-input bg-background',
                    'pl-9 pr-9 text-sm',
                    'placeholder:text-muted-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1'
                  )}
                />
                {searchValue && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
            {toolbar}
          </div>
        </div>
      )}
      <VirtualTable data={filteredData} columns={columns} className={className} {...tableProps} />
    </div>
  );
}
