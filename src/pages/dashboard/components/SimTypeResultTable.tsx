/**
 * 仿真类型结果表格组件
 *
 * 展示单个仿真类型的轮次数据矩阵
 * 列结构: 轮次 | param1...param8 | output1...output6 | 状态 | 最优结果
 */
import { useMemo } from 'react';
import { VirtualTable } from '@/components/tables/VirtualTable';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';
import type { RoundItem } from '@/api/results';
import type { ParamDef, OutputDef } from '@/types/config';

/** 状态映射 */
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
  /** 仿真类型ID */
  simTypeId: number;
  /** 仿真类型名称 */
  simTypeName: string;
  /** 轮次数据 */
  rounds: RoundItem[];
  /** 参数定义列表 */
  paramDefs: ParamDef[];
  /** 输出定义列表 */
  outputDefs: OutputDef[];
  /** 最优轮次索引 */
  bestRoundIndex?: number | null;
  /** 是否加载中 */
  loading?: boolean;
  /** 表格高度 */
  height?: number;
}

export const SimTypeResultTable: React.FC<SimTypeResultTableProps> = ({
  simTypeId,
  simTypeName,
  rounds,
  paramDefs,
  outputDefs,
  bestRoundIndex,
  loading = false,
  height = 400,
}) => {
  // 从轮次数据中提取实际使用的参数和输出 key
  const { usedParamKeys, usedOutputKeys } = useMemo(() => {
    const paramKeys = new Set<string>();
    const outputKeys = new Set<string>();

    rounds.forEach(round => {
      if (round.paramValues) {
        Object.keys(round.paramValues).forEach(k => paramKeys.add(k));
      }
      if (round.outputResults) {
        Object.keys(round.outputResults).forEach(k => outputKeys.add(k));
      }
    });

    return {
      usedParamKeys: Array.from(paramKeys),
      usedOutputKeys: Array.from(outputKeys),
    };
  }, [rounds]);

  // 构建参数和输出的 ID -> 定义映射
  const paramDefMap = useMemo(() => new Map(paramDefs.map(p => [String(p.id), p])), [paramDefs]);

  const outputDefMap = useMemo(() => new Map(outputDefs.map(o => [String(o.id), o])), [outputDefs]);

  // 动态生成列定义
  const columns = useMemo<ColumnDef<RoundItem>[]>(() => {
    const cols: ColumnDef<RoundItem>[] = [];

    // 1. 轮次列
    cols.push({
      id: 'roundIndex',
      header: '轮次',
      accessorKey: 'roundIndex',
      size: 70,
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">{row.original.roundIndex}</span>
      ),
    });

    // 2. 参数列 (动态)
    usedParamKeys.forEach(key => {
      const def = paramDefMap.get(key);
      const headerName = def?.name || def?.key || `P${key}`;
      const unit = def?.unit;

      cols.push({
        id: `param_${key}`,
        header: unit ? `${headerName} (${unit})` : headerName,
        size: 100,
        cell: ({ row }) => {
          const val = row.original.paramValues?.[key];
          if (val === undefined || val === null) return '-';
          const num = typeof val === 'number' ? val : Number(val);
          return (
            <span className="tabular-nums">
              {Number.isFinite(num) ? num.toFixed(2) : String(val)}
            </span>
          );
        },
      });
    });

    // 3. 输出列 (动态)
    usedOutputKeys.forEach(key => {
      const def = outputDefMap.get(key);
      const headerName = def?.name || def?.code || `O${key}`;
      const unit = def?.unit;

      cols.push({
        id: `output_${key}`,
        header: unit ? `${headerName} (${unit})` : headerName,
        size: 100,
        cell: ({ row }) => {
          const val = row.original.outputResults?.[key];
          if (val === undefined || val === null) return '-';
          const num = typeof val === 'number' ? val : Number(val);
          return (
            <span className="tabular-nums text-blue-600 dark:text-blue-400">
              {Number.isFinite(num) ? num.toFixed(4) : String(val)}
            </span>
          );
        },
      });
    });

    // 4. 状态列
    cols.push({
      id: 'status',
      header: '状态',
      size: 90,
      cell: ({ row }) => {
        const status = row.original.status;
        const config = STATUS_MAP[status] || STATUS_MAP[0];
        return (
          <Badge variant={config.variant} size="sm">
            {config.label}
          </Badge>
        );
      },
    });

    // 5. 最优结果列
    cols.push({
      id: 'isBest',
      header: '最优',
      size: 70,
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
  }, [usedParamKeys, usedOutputKeys, paramDefMap, outputDefMap, bestRoundIndex]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          {simTypeName}
          <span className="ml-2 text-sm font-normal text-slate-500">(共 {rounds.length} 轮)</span>
        </h3>
        {bestRoundIndex && (
          <Badge variant="success" size="sm">
            最优轮次: #{bestRoundIndex}
          </Badge>
        )}
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
        getRowId={row => `${simTypeId}-${row.id}`}
      />
    </div>
  );
};

export default SimTypeResultTable;
