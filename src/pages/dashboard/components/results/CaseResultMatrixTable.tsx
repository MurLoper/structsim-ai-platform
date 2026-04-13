import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, Card } from '@/components/ui';
import { VirtualTable } from '@/components/tables/VirtualTable';
import type { ConditionRoundsGroup } from '../../hooks/resultsAnalysisTypes';
import type { ResultsConditionCard } from './types';

type MatrixRow = Record<string, string | number | null>;

interface CaseResultMatrixTableProps {
  caseLabel: string;
  conditionCards: ResultsConditionCard[];
  roundGroups: ConditionRoundsGroup[];
  loading?: boolean;
}

const normalizeCellValue = (value: unknown): string | number | null => {
  if (typeof value === 'number' || typeof value === 'string') return value;
  if (value === null || value === undefined) return null;
  return String(value);
};

const renderStatus = (value: number | null) => {
  if (value === 2) return <Badge variant="success">完成</Badge>;
  if (value === 1) return <Badge variant="warning">运行中</Badge>;
  if (value === 3) return <Badge variant="error">失败</Badge>;
  return <span className="text-muted-foreground">-</span>;
};

export const CaseResultMatrixTable: React.FC<CaseResultMatrixTableProps> = ({
  caseLabel,
  conditionCards,
  roundGroups,
  loading = false,
}) => {
  const conditionLabelMap = useMemo(
    () => new Map(conditionCards.map(item => [item.id, item.label])),
    [conditionCards]
  );

  const outputKeys = useMemo(() => {
    const keysByCondition = new Map<number, string[]>();
    roundGroups.forEach(group => {
      const seen = new Set<string>();
      group.rounds.forEach(round => {
        Object.keys(round.outputResults || {}).forEach(key => seen.add(key));
      });
      keysByCondition.set(group.conditionId, Array.from(seen));
    });
    return keysByCondition;
  }, [roundGroups]);

  const rows = useMemo<MatrixRow[]>(() => {
    const maxRound = Math.max(
      0,
      ...roundGroups.flatMap(group => group.rounds.map(round => Number(round.roundIndex || 0)))
    );
    return Array.from({ length: maxRound }, (_, index) => {
      const roundIndex = index + 1;
      const row: MatrixRow = { roundIndex };
      roundGroups.forEach(group => {
        const round = group.rounds.find(item => Number(item.roundIndex) === roundIndex);
        row[`condition_${group.conditionId}_status`] = round?.status ?? null;
        Object.keys(round?.outputResults || {}).forEach(key => {
          row[`condition_${group.conditionId}_${key}`] = normalizeCellValue(
            round?.outputResults?.[key]
          );
        });
      });
      return row;
    });
  }, [roundGroups]);

  const columns = useMemo<ColumnDef<MatrixRow, unknown>[]>(() => {
    const result: ColumnDef<MatrixRow, unknown>[] = [
      {
        accessorKey: 'roundIndex',
        header: '轮次',
        cell: info => `#${info.getValue<number>()}`,
      },
    ];

    roundGroups.forEach(group => {
      const label = conditionLabelMap.get(group.conditionId) || `工况 ${group.conditionId}`;
      result.push({
        accessorKey: `condition_${group.conditionId}_status`,
        header: `${label} / 状态`,
        cell: info => renderStatus(info.getValue<number | null>()),
      });
      (outputKeys.get(group.conditionId) || []).forEach(outputKey => {
        result.push({
          accessorKey: `condition_${group.conditionId}_${outputKey}`,
          header: `${label} / ${outputKey}`,
          cell: info => {
            const value = info.getValue<string | number | null>();
            return value ?? <span className="text-muted-foreground">-</span>;
          },
        });
      });
    });

    return result;
  }, [conditionLabelMap, outputKeys, roundGroups]);

  return (
    <Card className="shadow-none">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">{caseLabel}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            同一方案下所有工况按输出列展开，未出结果的位置保留为空位。
          </p>
        </div>
        <Badge variant="default">{rows.length} 轮</Badge>
      </div>
      <VirtualTable
        data={rows}
        columns={columns}
        rowHeight={40}
        containerHeight={620}
        loading={loading}
        striped
        enableSorting
        emptyText="当前方案暂无结果明细"
        getRowId={row => String(row.roundIndex)}
      />
    </Card>
  );
};
