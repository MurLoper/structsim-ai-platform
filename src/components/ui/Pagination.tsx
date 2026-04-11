import { memo, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

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

const Pagination = memo(
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
  }: PaginationProps) => {
    const { t } = useI18n();
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

    const btnClass =
      'rounded-md px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50';
    const activeBtnClass = 'bg-brand-500 text-white';
    const normalBtnClass =
      'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600';

    if (totalPages <= 0) return null;

    return (
      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-700">
        <div className="flex items-center gap-4">
          {showTotal && (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {t('pagination.total', { total })}
            </span>
          )}
          {showPageSize && onPageSizeChange && (
            <select
              value={pageSize}
              onChange={event => onPageSizeChange(Number(event.target.value))}
              disabled={disabled}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {t('pagination.page_size', { size })}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={disabled || page <= 1}
            className={`${btnClass} ${normalBtnClass}`}
            title={t('pagination.first')}
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>

          <button
            onClick={() => onPageChange(page - 1)}
            disabled={disabled || page <= 1}
            className={`${btnClass} ${normalBtnClass}`}
            title={t('pagination.previous')}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pageNumbers.map((num, index) =>
            num === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
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

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={disabled || page >= totalPages}
            className={`${btnClass} ${normalBtnClass}`}
            title={t('pagination.next')}
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            onClick={() => onPageChange(totalPages)}
            disabled={disabled || page >= totalPages}
            className={`${btnClass} ${normalBtnClass}`}
            title={t('pagination.last')}
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }
);

Pagination.displayName = 'Pagination';

export default Pagination;
