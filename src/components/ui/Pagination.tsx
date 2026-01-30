import React, { memo, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showTotal?: boolean;
  showPageSize?: boolean;
  disabled?: boolean;
}

const Pagination: React.FC<PaginationProps> = memo(
  ({
    page,
    pageSize,
    total,
    totalPages,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50, 100],
    showTotal = true,
    showPageSize = true,
    disabled = false,
  }) => {
    // 计算显示的页码
    const pageNumbers = useMemo(() => {
      const pages: (number | 'ellipsis')[] = [];
      const maxVisible = 5;

      if (totalPages <= maxVisible + 2) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);

        if (page > 3) pages.push('ellipsis');

        const start = Math.max(2, page - 1);
        const end = Math.min(totalPages - 1, page + 1);

        for (let i = start; i <= end; i++) pages.push(i);

        if (page < totalPages - 2) pages.push('ellipsis');

        pages.push(totalPages);
      }

      return pages;
    }, [page, totalPages]);

    const btnClass = `px-3 py-1.5 text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed`;
    const activeBtnClass = `bg-brand-500 text-white`;
    const normalBtnClass = `bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200
    hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600`;

    if (totalPages <= 0) return null;

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
        {/* 左侧：总数和每页条数 */}
        <div className="flex items-center gap-4">
          {showTotal && (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              共 <span className="font-medium text-slate-700 dark:text-slate-200">{total}</span> 条
            </span>
          )}
          {showPageSize && onPageSizeChange && (
            <select
              value={pageSize}
              onChange={e => onPageSizeChange(Number(e.target.value))}
              disabled={disabled}
              className="px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded-md
              bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200
              focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size} 条/页
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 右侧：分页按钮 */}
        <div className="flex items-center gap-1">
          {/* 首页 */}
          <button
            onClick={() => onPageChange(1)}
            disabled={disabled || page <= 1}
            className={`${btnClass} ${normalBtnClass}`}
            title="首页"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* 上一页 */}
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={disabled || page <= 1}
            className={`${btnClass} ${normalBtnClass}`}
            title="上一页"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* 页码 */}
          {pageNumbers.map((num, idx) =>
            num === 'ellipsis' ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">
                ...
              </span>
            ) : (
              <button
                key={num}
                onClick={() => onPageChange(num)}
                disabled={disabled}
                className={`${btnClass} ${num === page ? activeBtnClass : normalBtnClass}`}
              >
                {num}
              </button>
            )
          )}

          {/* 下一页 */}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={disabled || page >= totalPages}
            className={`${btnClass} ${normalBtnClass}`}
            title="下一页"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* 末页 */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={disabled || page >= totalPages}
            className={`${btnClass} ${normalBtnClass}`}
            title="末页"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }
);

Pagination.displayName = 'Pagination';

export default Pagination;
