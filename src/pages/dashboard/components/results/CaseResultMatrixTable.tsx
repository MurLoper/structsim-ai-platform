import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, Button, Card, Modal } from '@/components/ui';
import { VirtualTable } from '@/components/tables/VirtualTable';
import type { ResultOutputAttachment } from '@/api/results';
import type { ConditionRoundsGroup } from '../../hooks/resultsAnalysisTypes';
import type { ResultsCaseCard, ResultsConditionCard } from './types';

type MatrixValue = string | number | null;
type MatrixAttachment = ResultOutputAttachment & { label: string; value: MatrixValue };

interface MatrixRow {
  roundIndex: number;
  __attachments: Record<string, MatrixAttachment>;
  [key: string]: MatrixValue | Record<string, MatrixAttachment>;
}

interface CaseResultMatrixTableProps {
  caseLabel: string;
  caseCards: ResultsCaseCard[];
  activeCaseId: number | null;
  activeCaseStats: ResultsCaseCard | null;
  conditionCards: ResultsConditionCard[];
  roundGroups: ConditionRoundsGroup[];
  loading?: boolean;
  onSelectCase: (caseId: number) => void;
}

const emptyCell = <span className="text-muted-foreground">-</span>;

const normalizeCellValue = (value: unknown): MatrixValue => {
  if (typeof value === 'number' || typeof value === 'string') return value;
  if (value === null || value === undefined) return null;
  return String(value);
};

const renderStatus = (value: MatrixValue) => {
  if (value === 2 || value === '2') return <Badge variant="success">完成</Badge>;
  if (value === 1 || value === '1') return <Badge variant="warning">运行中</Badge>;
  if (value === 3 || value === '3') return <Badge variant="error">失败</Badge>;
  return emptyCell;
};

const getFirstPresent = (...values: unknown[]): MatrixValue => {
  const value = values.find(item => item !== undefined && item !== null && item !== '');
  return normalizeCellValue(value);
};

const collectSortedKeys = (
  roundGroups: ConditionRoundsGroup[],
  selector: (group: ConditionRoundsGroup) => Array<Record<string, unknown> | null | undefined>
) => {
  const seen = new Set<string>();
  roundGroups.forEach(group => {
    selector(group).forEach(record => {
      Object.keys(record || {}).forEach(key => seen.add(key));
    });
  });
  return Array.from(seen);
};

const getConditionLabel = (
  conditionLabelMap: Map<number, string>,
  group: ConditionRoundsGroup,
  index: number
) => conditionLabelMap.get(group.conditionId) || `工况 ${index + 1}`;

export const CaseResultMatrixTable: React.FC<CaseResultMatrixTableProps> = ({
  caseLabel,
  caseCards,
  activeCaseId,
  activeCaseStats,
  conditionCards,
  roundGroups,
  loading = false,
  onSelectCase,
}) => {
  const [previewAttachment, setPreviewAttachment] = useState<MatrixAttachment | null>(null);

  const conditionLabelMap = useMemo(
    () => new Map(conditionCards.map(item => [item.id, item.label])),
    [conditionCards]
  );

  const paramKeys = useMemo(
    () => collectSortedKeys(roundGroups, group => group.rounds.map(round => round.paramValues)),
    [roundGroups]
  );

  const outputKeysByCondition = useMemo(() => {
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
      const row: MatrixRow = { roundIndex, __attachments: {} };

      roundGroups.forEach(group => {
        const round = group.rounds.find(item => Number(item.roundIndex) === roundIndex);
        if (!round) return;

        row[`condition_${group.conditionId}_status`] = normalizeCellValue(round.status);
        row.optDataId = getFirstPresent(row.optDataId, round.optDataId);
        row.taskId = getFirstPresent(row.taskId, round.taskId);
        row.workDir = getFirstPresent(row.workDir, round.dataDir, round.jobDir, round.baseDir);
        row.runningModule = getFirstPresent(row.runningModule, round.runningModule);
        row.progress = getFirstPresent(row.progress, `${round.progress ?? 0}%`);
        row.finalResult = getFirstPresent(row.finalResult, round.finalResult);

        Object.entries(round.paramValues || {}).forEach(([key, value]) => {
          row[`param_${key}`] = getFirstPresent(row[`param_${key}`], value);
        });

        Object.entries(round.outputResults || {}).forEach(([key, value]) => {
          const cellKey = `condition_${group.conditionId}_${key}`;
          const cellValue = normalizeCellValue(value);
          row[cellKey] = cellValue;
          const attachment = round.outputAttachments?.[key];
          if (attachment) {
            row.__attachments[cellKey] = {
              ...attachment,
              label: `${conditionLabelMap.get(group.conditionId) || `工况 ${group.conditionId}`} / ${key}`,
              value: cellValue,
            };
          }
        });
      });

      return row;
    });
  }, [conditionLabelMap, roundGroups]);

  const columns = useMemo<ColumnDef<MatrixRow, unknown>[]>(() => {
    const result: ColumnDef<MatrixRow, unknown>[] = [
      {
        id: 'roundIndex',
        accessorFn: row => row.roundIndex,
        header: '轮次',
        cell: info => info.getValue<number>(),
        size: 72,
      },
    ];

    if (paramKeys.length) {
      result.push({
        id: 'params',
        header: '参数',
        columns: paramKeys.map(key => ({
          id: `param_${key}`,
          accessorFn: row => row[`param_${key}`],
          header: key,
          cell: info => info.getValue<MatrixValue>() ?? emptyCell,
          size: 110,
        })),
      });
    }

    roundGroups.forEach((group, index) => {
      const label = getConditionLabel(conditionLabelMap, group, index);
      const outputKeys = outputKeysByCondition.get(group.conditionId) || [];
      result.push({
        id: `condition_${group.conditionId}`,
        header: label,
        columns: [
          {
            id: `condition_${group.conditionId}_status`,
            accessorFn: row => row[`condition_${group.conditionId}_status`],
            header: '状态',
            cell: info => renderStatus(info.getValue<MatrixValue>()),
            size: 110,
          },
          ...outputKeys.map(outputKey => {
            const cellKey = `condition_${group.conditionId}_${outputKey}`;
            return {
              id: cellKey,
              accessorFn: (row: MatrixRow) => row[cellKey],
              header: outputKey,
              cell: info => {
                const value = info.getValue() as MatrixValue;
                const attachment = info.row.original.__attachments[cellKey];
                if (value === null || value === undefined || value === '') return emptyCell;
                if (!attachment) return value;
                return (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto px-0 py-0 font-mono text-brand-700 hover:bg-transparent hover:text-brand-800"
                    onClick={() => setPreviewAttachment(attachment)}
                  >
                    {value}
                  </Button>
                );
              },
              size: 150,
            } satisfies ColumnDef<MatrixRow, unknown>;
          }),
        ],
      });
    });

    result.push({
      id: 'task',
      header: '任务信息',
      columns: [
        {
          id: 'optDataId',
          accessorFn: row => row.optDataId,
          header: '优化ID',
          cell: info => info.getValue<MatrixValue>() ?? emptyCell,
          size: 120,
        },
        {
          id: 'taskId',
          accessorFn: row => row.taskId,
          header: '任务ID',
          cell: info => info.getValue<MatrixValue>() ?? emptyCell,
          size: 120,
        },
        {
          id: 'workDir',
          accessorFn: row => row.workDir,
          header: '工作目录',
          cell: info => info.getValue<MatrixValue>() ?? emptyCell,
          size: 220,
        },
        {
          id: 'runningModule',
          accessorFn: row => row.runningModule,
          header: '当前模块',
          cell: info => info.getValue<MatrixValue>() ?? emptyCell,
          size: 120,
        },
        {
          id: 'progress',
          accessorFn: row => row.progress,
          header: '计算进度',
          cell: info => info.getValue<MatrixValue>() ?? emptyCell,
          size: 120,
        },
        {
          id: 'finalResult',
          accessorFn: row => row.finalResult,
          header: '最终结果',
          cell: info => info.getValue<MatrixValue>() ?? emptyCell,
          size: 120,
        },
      ],
    });

    return result;
  }, [conditionLabelMap, outputKeysByCondition, paramKeys, roundGroups]);

  const previewItems = useMemo(() => {
    if (!previewAttachment) return [];
    return [
      ...(previewAttachment.imagePaths || []).map(path => ({ type: 'image' as const, path })),
      ...(previewAttachment.aviPaths || []).map(path => ({ type: 'video' as const, path })),
    ];
  }, [previewAttachment]);

  return (
    <>
      <Card className="shadow-none">
        <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-base font-semibold text-foreground">{caseLabel}</h3>
              <Badge variant="default">{rows.length} 轮</Badge>
              {activeCaseStats && (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>工况 {activeCaseStats.conditionCount}</span>
                  <span>完成 {activeCaseStats.completedRounds}</span>
                  <span>失败 {activeCaseStats.failedRounds}</span>
                  <span>进度 {activeCaseStats.progress}%</span>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              当前方案下所有工况在同一张矩阵中展开；未出结果的位置保留为空位，点击结果值可查看对应图片和动画。
            </p>
          </div>

          <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-muted/30 p-2">
            {caseCards.map(caseItem => (
              <Button
                key={caseItem.id}
                type="button"
                variant={caseItem.id === activeCaseId ? 'primary' : 'outline'}
                size="sm"
                onClick={() => onSelectCase(caseItem.id)}
              >
                {caseItem.label}
              </Button>
            ))}
          </div>
        </div>

        <VirtualTable
          data={rows}
          columns={columns}
          rowHeight={42}
          containerHeight={620}
          loading={loading}
          striped
          enableSorting
          emptyText="当前方案暂无结果明细"
          getRowId={row => String(row.roundIndex)}
        />
      </Card>

      <Modal
        isOpen={Boolean(previewAttachment)}
        onClose={() => setPreviewAttachment(null)}
        title={
          previewAttachment
            ? `${previewAttachment.label}: ${previewAttachment.value ?? '-'}`
            : undefined
        }
        size="xl"
      >
        {previewItems.length ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {previewItems.map((item, index) => (
              <div
                key={`${item.path}-${index}`}
                className="min-w-[520px] rounded-xl border border-border bg-muted/30 p-3"
              >
                <div className="mb-2 text-xs text-muted-foreground">{item.path}</div>
                {item.type === 'image' ? (
                  <img
                    src={item.path}
                    alt={`结果预览 ${index + 1}`}
                    className="max-h-[520px] w-full rounded-lg object-contain"
                  />
                ) : (
                  <video src={item.path} controls className="max-h-[520px] w-full rounded-lg" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            当前结果没有可预览的图片或动画路径。
          </div>
        )}
      </Modal>
    </>
  );
};
