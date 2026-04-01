import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui';
import type { OrderConditionRoundColumn, RoundItem } from '@/api/results';
import {
  CONDITION_RESULT_STATUS_MAP,
  formatConditionResultNumber,
  getConditionResultColumnLabel,
} from './conditionResultConfig';

type CreateConditionResultColumnsOptions = {
  columns: OrderConditionRoundColumn[];
  bestRoundIndex?: number | null;
};

export const createConditionResultColumns = ({
  columns,
  bestRoundIndex,
}: CreateConditionResultColumnsOptions): ColumnDef<RoundItem>[] => {
  const resolvedColumns =
    columns.length > 0
      ? columns
      : [
          { key: 'roundIndex', label: '轮次', type: 'base' },
          { key: 'process', label: '进度', type: 'progress' },
        ];

  const tableColumns = resolvedColumns.map(column => {
    if (column.key === 'roundIndex') {
      return {
        id: 'roundIndex',
        header: getConditionResultColumnLabel(column),
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
        header: getConditionResultColumnLabel(column),
        size: 120,
        cell: ({ row }: { row: { original: RoundItem } }) => row.original.runningModule || '-',
      } satisfies ColumnDef<RoundItem>;
    }

    if (column.key === 'process') {
      return {
        id: 'process',
        header: getConditionResultColumnLabel(column),
        size: 100,
        cell: ({ row }: { row: { original: RoundItem } }) => (
          <span className="tabular-nums">{row.original.progress}%</span>
        ),
      } satisfies ColumnDef<RoundItem>;
    }

    if (column.key === 'finalResult') {
      return {
        id: 'finalResult',
        header: getConditionResultColumnLabel(column),
        size: 128,
        cell: ({ row }: { row: { original: RoundItem } }) => (
          <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatConditionResultNumber(row.original.finalResult, 4)}
          </span>
        ),
      } satisfies ColumnDef<RoundItem>;
    }

    if (column.key.startsWith('params.')) {
      const key = column.key.replace('params.', '');
      return {
        id: `param_${key}`,
        header: getConditionResultColumnLabel(column),
        size: 120,
        cell: ({ row }: { row: { original: RoundItem } }) => (
          <span className="tabular-nums">
            {formatConditionResultNumber(row.original.paramValues?.[key], 2)}
          </span>
        ),
      } satisfies ColumnDef<RoundItem>;
    }

    if (column.key.startsWith('outputs.')) {
      const key = column.key.replace('outputs.', '');
      const isWeighted = column.type === 'output_weighted';
      return {
        id: `output_${key}`,
        header: getConditionResultColumnLabel(column),
        size: 132,
        cell: ({ row }: { row: { original: RoundItem } }) => (
          <span
            className={`tabular-nums ${
              isWeighted
                ? 'font-medium text-emerald-600 dark:text-emerald-400'
                : 'text-blue-600 dark:text-blue-400'
            }`}
          >
            {formatConditionResultNumber(row.original.outputResults?.[key], 4)}
          </span>
        ),
      } satisfies ColumnDef<RoundItem>;
    }

    return {
      id: column.key,
      header: getConditionResultColumnLabel(column),
      size: 120,
      cell: () => '-',
    } satisfies ColumnDef<RoundItem>;
  });

  tableColumns.push({
    id: 'status',
    header: '状态',
    size: 96,
    cell: ({ row }) => {
      const statusConfig =
        CONDITION_RESULT_STATUS_MAP[row.original.status] || CONDITION_RESULT_STATUS_MAP[0];
      return (
        <Badge variant={statusConfig.variant} size="sm">
          {statusConfig.label}
        </Badge>
      );
    },
  });

  tableColumns.push({
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

  return tableColumns;
};
