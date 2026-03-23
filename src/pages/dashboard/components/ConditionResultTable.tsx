import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Sigma } from 'lucide-react';
import { Badge, Select } from '@/components/ui';
import { VirtualTable } from '@/components/tables/VirtualTable';
import type { OrderConditionRoundColumn, OrderConditionSummary, RoundItem } from '@/api/results';

const STATUS_MAP: Record<
  number,
  { label: string; variant: 'default' | 'success' | 'warning' | 'error' }
> = {
  0: { label: '待运行', variant: 'default' },
  1: { label: '运行中', variant: 'warning' },
  2: { label: '已完成', variant: 'success' },
  3: { label: '失败', variant: 'error' },
};

const PAGE_SIZE_OPTIONS = [
  { value: '500', label: '500 / 页' },
  { value: '2000', label: '2000 / 页' },
  { value: '5000', label: '5000 / 页' },
  { value: '20000', label: '20000 / 页' },
];

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

const getColumnLabel = (column: OrderConditionRoundColumn) => {
  if (column.label) return column.label;
  const fallback = column.key.split('.').pop();
  return fallback || column.key;
};

const formatNumeric = (value: unknown, digits = 4) => {
  if (value === undefined || value === null) return '-';
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue.toFixed(digits) : String(value);
};

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
  const tableColumns = useMemo<ColumnDef<RoundItem>[]>(() => {
    const resolvedColumns =
      columns.length > 0
        ? columns
        : [
            { key: 'roundIndex', label: '轮次', type: 'base' },
            { key: 'process', label: '进度', type: 'progress' },
          ];

    const schemaDefs = resolvedColumns.map(column => {
      if (column.key === 'roundIndex') {
        return {
          id: 'roundIndex',
          header: getColumnLabel(column),
          accessorKey: 'roundIndex',
          size: 88,
          cell: ({ row }: { row: { original: RoundItem } }) => (
            <span className="font-medium tabular-nums">{row.original.roundIndex}</span>
          ),
        } satisfies ColumnDef<RoundItem>;
      }

      if (column.key === 'runningModule') {
        return {
          id: 'runningModule',
          header: getColumnLabel(column),
          size: 120,
          cell: ({ row }: { row: { original: RoundItem } }) => row.original.runningModule || '-',
        } satisfies ColumnDef<RoundItem>;
      }

      if (column.key === 'process') {
        return {
          id: 'process',
          header: getColumnLabel(column),
          size: 100,
          cell: ({ row }: { row: { original: RoundItem } }) => (
            <span className="tabular-nums">{row.original.progress}%</span>
          ),
        } satisfies ColumnDef<RoundItem>;
      }

      if (column.key === 'finalResult') {
        return {
          id: 'finalResult',
          header: getColumnLabel(column),
          size: 128,
          cell: ({ row }: { row: { original: RoundItem } }) => (
            <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatNumeric(row.original.finalResult, 4)}
            </span>
          ),
        } satisfies ColumnDef<RoundItem>;
      }

      if (column.key.startsWith('params.')) {
        const key = column.key.replace('params.', '');
        return {
          id: `param_${key}`,
          header: getColumnLabel(column),
          size: 120,
          cell: ({ row }: { row: { original: RoundItem } }) => (
            <span className="tabular-nums">
              {formatNumeric(row.original.paramValues?.[key], 2)}
            </span>
          ),
        } satisfies ColumnDef<RoundItem>;
      }

      if (column.key.startsWith('outputs.')) {
        const key = column.key.replace('outputs.', '');
        const isWeighted = column.type === 'output_weighted';
        return {
          id: `output_${key}`,
          header: getColumnLabel(column),
          size: 132,
          cell: ({ row }: { row: { original: RoundItem } }) => (
            <span
              className={`tabular-nums ${
                isWeighted
                  ? 'font-medium text-emerald-600 dark:text-emerald-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`}
            >
              {formatNumeric(row.original.outputResults?.[key], 4)}
            </span>
          ),
        } satisfies ColumnDef<RoundItem>;
      }

      return {
        id: column.key,
        header: getColumnLabel(column),
        size: 120,
        cell: () => '-',
      } satisfies ColumnDef<RoundItem>;
    });

    schemaDefs.push({
      id: 'status',
      header: '状态',
      size: 96,
      cell: ({ row }) => {
        const config = STATUS_MAP[row.original.status] || STATUS_MAP[0];
        return (
          <Badge variant={config.variant} size="sm">
            {config.label}
          </Badge>
        );
      },
    });

    schemaDefs.push({
      id: 'isBest',
      header: '最优',
      size: 80,
      cell: ({ row }) =>
        bestRoundIndex === row.original.roundIndex ? (
          <Badge variant="success" size="sm">
            最优
          </Badge>
        ) : (
          <span />
        ),
    });

    return schemaDefs;
  }, [bestRoundIndex, columns]);

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
    condition?.conditionId ? `工况ID ${condition.conditionId}` : null,
    condition?.foldTypeId ? `FoldType ${condition.foldTypeId}` : null,
    condition?.simTypeId ? `SimType ${condition.simTypeId}` : null,
    condition?.algorithmType ? `算法 ${condition.algorithmType}` : null,
    condition?.solverId ? `求解器 ${condition.solverId}` : null,
    total > 0 ? `结果规模 ${total.toLocaleString()} 条` : null,
    `结果源 ${String(resultSource).toUpperCase()}`,
  ].filter(Boolean);

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
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
            {metaItems.map(item => (
              <span key={item} className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-900/50">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-500">当前页</div>
            <div className="mt-2 font-medium tabular-nums">
              {rangeStart}-{rangeEnd}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-900/50">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-500">总轮次</div>
            <div className="mt-2 font-medium tabular-nums">{total.toLocaleString()}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-900/50">
            <div className="flex items-center gap-1 text-xs uppercase tracking-[0.16em] text-slate-500">
              <Sigma className="h-3.5 w-3.5" />
              <span>综合结果</span>
            </div>
            <div className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
              {finalResultStats ? (
                <>
                  Min {finalResultStats.min.toFixed(3)} / Avg {finalResultStats.avg.toFixed(3)} /
                  Max {finalResultStats.max.toFixed(3)}
                </>
              ) : (
                '当前没有综合结果列'
              )}
            </div>
          </div>
        </div>
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
              options={PAGE_SIZE_OPTIONS}
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
