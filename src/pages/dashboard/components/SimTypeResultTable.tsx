/**
 * 历史文件名沿用 SimTypeResultTable，当前实际展示的是工况方案结果表。
 */
import { useMemo } from 'react';
import { VirtualTable } from '@/components/tables/VirtualTable';
import { Badge } from '@/components/ui';
import type { ColumnDef } from '@tanstack/react-table';
import type { OrderConditionSummary, RoundItem } from '@/api/results';
import type { ParamDef, OutputDef } from '@/types/config';

const STATUS_MAP: Record<
  number,
  { label: string; variant: 'default' | 'success' | 'warning' | 'error' }
> = {
  0: { label: '待运行', variant: 'default' },
  1: { label: '运行中', variant: 'warning' },
  2: { label: '已完成', variant: 'success' },
  3: { label: '失败', variant: 'error' },
};

export interface SimTypeResultTableProps {
  schemeId: number;
  schemeName: string;
  condition?: OrderConditionSummary;
  resultSource?: string;
  rounds: RoundItem[];
  paramDefs: ParamDef[];
  outputDefs: OutputDef[];
  bestRoundIndex?: number | null;
  loading?: boolean;
  height?: number;
}

export const SimTypeResultTable: React.FC<SimTypeResultTableProps> = ({
  schemeId,
  schemeName,
  condition,
  resultSource = 'mock',
  rounds,
  paramDefs,
  outputDefs,
  bestRoundIndex,
  loading = false,
  height = 400,
}) => {
  const { usedParamKeys, usedOutputKeys } = useMemo(() => {
    const paramKeys = new Set<string>();
    const outputKeys = new Set<string>();

    rounds.forEach(round => {
      if (round.paramValues) {
        Object.keys(round.paramValues).forEach(key => paramKeys.add(key));
      }
      if (round.outputResults) {
        Object.keys(round.outputResults).forEach(key => outputKeys.add(key));
      }
    });

    return {
      usedParamKeys: Array.from(paramKeys),
      usedOutputKeys: Array.from(outputKeys),
    };
  }, [rounds]);

  const paramDefMap = useMemo(
    () => new Map(paramDefs.map(item => [String(item.id), item])),
    [paramDefs]
  );
  const outputDefMap = useMemo(
    () => new Map(outputDefs.map(item => [String(item.id), item])),
    [outputDefs]
  );

  const columns = useMemo<ColumnDef<RoundItem>[]>(() => {
    const cols: ColumnDef<RoundItem>[] = [
      {
        id: 'roundIndex',
        header: '轮次',
        accessorKey: 'roundIndex',
        size: 70,
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">{row.original.roundIndex}</span>
        ),
      },
    ];

    usedParamKeys.forEach(key => {
      const def = paramDefMap.get(key);
      const headerName = def?.name || def?.key || (/^\d+$/.test(key) ? `P${key}` : key);
      const unit = def?.unit;

      cols.push({
        id: `param_${key}`,
        header: unit ? `${headerName} (${unit})` : headerName,
        size: 100,
        cell: ({ row }) => {
          const value = row.original.paramValues?.[key];
          if (value === undefined || value === null) return '-';
          const numberValue = typeof value === 'number' ? value : Number(value);
          return (
            <span className="tabular-nums">
              {Number.isFinite(numberValue) ? numberValue.toFixed(2) : String(value)}
            </span>
          );
        },
      });
    });

    usedOutputKeys.forEach(key => {
      const def = outputDefMap.get(key);
      const headerName = def?.name || def?.code || (/^\d+$/.test(key) ? `O${key}` : key);
      const unit = def?.unit;

      cols.push({
        id: `output_${key}`,
        header: unit ? `${headerName} (${unit})` : headerName,
        size: 100,
        cell: ({ row }) => {
          const value = row.original.outputResults?.[key];
          if (value === undefined || value === null) return '-';
          const numberValue = typeof value === 'number' ? value : Number(value);
          return (
            <span className="tabular-nums text-blue-600 dark:text-blue-400">
              {Number.isFinite(numberValue) ? numberValue.toFixed(4) : String(value)}
            </span>
          );
        },
      });
    });

    cols.push({
      id: 'status',
      header: '状态',
      size: 90,
      cell: ({ row }) => {
        const config = STATUS_MAP[row.original.status] || STATUS_MAP[0];
        return (
          <Badge variant={config.variant} size="sm">
            {config.label}
          </Badge>
        );
      },
    });

    cols.push({
      id: 'isBest',
      header: '最优',
      size: 80,
      cell: ({ row }) => {
        const isBest = bestRoundIndex === row.original.roundIndex;
        return isBest ? (
          <Badge variant="success" size="sm">
            最优
          </Badge>
        ) : null;
      },
    });

    return cols;
  }, [bestRoundIndex, outputDefMap, paramDefMap, usedOutputKeys, usedParamKeys]);

  const metaItems = [
    condition?.conditionId ? `Condition #${condition.conditionId}` : null,
    condition?.algorithmType ? `算法 ${condition.algorithmType}` : null,
    condition?.solverId ? `求解器 ${condition.solverId}` : null,
    condition?.roundTotal ? `计划轮次 ${condition.roundTotal}` : null,
    condition?.runningModule ? `当前模块 ${condition.runningModule}` : null,
    `数据源 ${String(resultSource).toUpperCase()}`,
  ].filter(Boolean);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white eyecare:text-foreground">
              {schemeName}
            </h3>
            <Badge variant={resultSource === 'mock' ? 'warning' : 'success'} size="sm">
              {String(resultSource).toUpperCase()}
            </Badge>
            {bestRoundIndex ? (
              <Badge variant="success" size="sm">
                最优轮次 #{bestRoundIndex}
              </Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {metaItems.map(item => (
              <span key={item} className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
                {item}
              </span>
            ))}
          </div>
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          共 {rounds.length} 条轮次
        </span>
      </div>

      <VirtualTable
        data={rounds}
        columns={columns}
        rowHeight={40}
        containerHeight={height}
        loading={loading}
        striped
        enableSorting
        emptyText="暂无轮次数据"
        getRowId={row => `${schemeId}-${row.id}`}
      />
    </div>
  );
};

export default SimTypeResultTable;
