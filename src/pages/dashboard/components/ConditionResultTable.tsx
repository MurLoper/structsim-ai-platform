import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Badge, Button, Select } from '@/components/ui';
import { VirtualTable } from '@/components/tables/VirtualTable';
import type { OrderConditionRoundColumn, OrderConditionSummary, RoundItem } from '@/api/results';
import { ConditionResultSummaryCards } from './results/ConditionResultSummaryCards';
import { CONDITION_RESULT_PAGE_SIZE_OPTIONS } from './results/conditionResultConfig';
import { createConditionResultColumns } from './results/createConditionResultColumns';
import { exportConditionResultTable } from './results/exportConditionResultTable';

export interface ConditionResultTableProps {
  conditionId: number;
  conditionName: string;
  condition?: OrderConditionSummary;
  resultSource?: string;
  rounds: RoundItem[];
  columns?: OrderConditionRoundColumn[];
  bestRoundIndex?: number | null;
  loading?: boolean;
  height?: number;
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export const ConditionResultTable: React.FC<ConditionResultTableProps> = ({
  conditionId,
  conditionName,
  condition,
  resultSource = 'mock',
  rounds,
  columns = [],
  bestRoundIndex,
  loading = false,
  height = 420,
  page = 1,
  pageSize = 500,
  total = 0,
  totalPages = 0,
  onPageChange,
  onPageSizeChange,
}) => {
  const tableColumns = useMemo(
    () => createConditionResultColumns({ columns, bestRoundIndex }),
    [bestRoundIndex, columns]
  );

  const finalResultStats = useMemo(() => {
    const values = rounds
      .map(item => item.finalResult)
      .filter((item): item is number => typeof item === 'number' && Number.isFinite(item));

    if (values.length === 0) {
      return null;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, item) => sum + item, 0) / values.length;

    return { min, max, avg };
  }, [rounds]);

  const safePage = Math.max(page, 1);
  const safePageSize = Math.max(pageSize, 1);
  const rangeStart = total === 0 ? 0 : (safePage - 1) * safePageSize + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(safePage * safePageSize, total);

  const metaItems = [
    condition?.conditionId ? `工况 ID ${condition.conditionId}` : null,
    condition?.foldTypeId ? `FoldType ${condition.foldTypeId}` : null,
    condition?.simTypeId ? `SimType ${condition.simTypeId}` : null,
    condition?.algorithmType ? `算法 ${condition.algorithmType}` : null,
    condition?.solverId ? `求解器 ${condition.solverId}` : null,
    total > 0 ? `结果规模 ${total.toLocaleString()} 条` : null,
    `结果源 ${String(resultSource).toUpperCase()}`,
  ].filter(Boolean);

  const handleExport = async () => {
    await exportConditionResultTable({
      conditionName,
      rounds,
      tableColumns,
      bestRoundIndex,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {conditionName}
            </h3>
            <Badge variant={resultSource === 'mock' ? 'warning' : 'success'} size="sm">
              {String(resultSource).toUpperCase()}
            </Badge>
            {bestRoundIndex !== null && bestRoundIndex !== undefined ? (
              <Badge variant="success" size="sm">
                最优轮次 #{bestRoundIndex}
              </Badge>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="ml-2"
              disabled={rounds.length === 0}
            >
              <Download className="mr-1.5 h-4 w-4" />
              导出 Excel
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
            {metaItems.map(item => (
              <span key={item} className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
                {item}
              </span>
            ))}
          </div>
        </div>

        <ConditionResultSummaryCards
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          total={total}
          finalResultStats={finalResultStats}
        />
      </div>

      <VirtualTable
        data={rounds}
        columns={tableColumns}
        rowHeight={40}
        containerHeight={height}
        loading={loading}
        striped
        enableSorting
        emptyText="暂无轮次结果数据"
        getRowId={row => `${conditionId}-${row.id}`}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          共 {total.toLocaleString()} 条，当前第 {safePage} / {Math.max(totalPages, 1)} 页
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-[140px]">
            <Select
              label="每页条数"
              value={String(safePageSize)}
              options={CONDITION_RESULT_PAGE_SIZE_OPTIONS}
              onChange={event => onPageSizeChange?.(Number(event.target.value))}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              disabled={safePage <= 1}
              onClick={() => onPageChange?.(safePage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              上一页
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              disabled={totalPages === 0 || safePage >= totalPages}
              onClick={() => onPageChange?.(safePage + 1)}
            >
              下一页
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConditionResultTable;
