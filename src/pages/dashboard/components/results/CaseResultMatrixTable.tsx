import { useCallback, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, Button, Card, useToast } from '@/components/ui';
import { VirtualTable } from '@/components/tables/VirtualTable';
import { useI18n } from '@/hooks/useI18n';
import type { ConditionRoundsGroup } from '../../hooks/resultsAnalysisTypes';
import { CaseResultAnalysisPanel } from './CaseResultAnalysisPanel';
import { CaseResultPreviewModal } from './CaseResultPreviewModal';
import { copyText } from './caseResultClipboard';
import {
  buildOutputKeysByCondition,
  collectSortedKeys,
  getFirstPresent,
  normalizeCellValue,
} from './caseResultMatrixMappers';
import type {
  CaseResultViewMode,
  MatrixAttachment,
  MatrixRow,
  MatrixValue,
  ResultsTranslator,
} from './caseResultMatrixTypes';
import type { ResultsCaseCard, ResultsConditionCard } from './types';

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

const getConditionLabel = (
  conditionLabelMap: Map<number, string>,
  group: ConditionRoundsGroup,
  index: number,
  t: ResultsTranslator
) =>
  conditionLabelMap.get(group.conditionId) ||
  t('res.case.condition_fallback', { index: index + 1 });

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
  const { t } = useI18n();
  const { showToast } = useToast();
  const [previewAttachment, setPreviewAttachment] = useState<MatrixAttachment | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [viewMode, setViewMode] = useState<CaseResultViewMode>('matrix');

  const conditionLabelMap = useMemo(
    () => new Map(conditionCards.map(item => [item.id, item.label])),
    [conditionCards]
  );

  const paramKeys = useMemo(
    () => collectSortedKeys(roundGroups, group => group.rounds.map(round => round.paramValues)),
    [roundGroups]
  );

  const outputKeysByCondition = useMemo(
    () => buildOutputKeysByCondition(roundGroups),
    [roundGroups]
  );

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
              label: `${
                conditionLabelMap.get(group.conditionId) ||
                t('res.case.condition_id_fallback', { id: group.conditionId })
              } / ${key}`,
              value: cellValue,
            };
          }
        });
      });

      return row;
    });
  }, [conditionLabelMap, roundGroups, t]);

  const openAttachmentPreview = useCallback((attachment: MatrixAttachment) => {
    setPreviewAttachment(attachment);
    setPreviewIndex(0);
  }, []);

  const renderStatus = useCallback(
    (value: MatrixValue) => {
      if (value === 2 || value === '2')
        return <Badge variant="success">{t('res.status.completed')}</Badge>;
      if (value === 1 || value === '1')
        return <Badge variant="warning">{t('res.status.running')}</Badge>;
      if (value === 3 || value === '3')
        return <Badge variant="error">{t('res.status.failed')}</Badge>;
      return emptyCell;
    },
    [t]
  );

  const handleCopyWorkDir = useCallback(
    async (value: MatrixValue) => {
      const text = String(value || '').trim();
      if (!text) return;

      try {
        await copyText(text);
        showToast('success', t('res.matrix.copy.success'));
      } catch {
        showToast('error', t('res.matrix.copy.failure'));
      }
    },
    [showToast, t]
  );

  const renderWorkDir = useCallback(
    (value: MatrixValue) => {
      const text = String(value || '').trim();
      if (!text) return emptyCell;
      return (
        <button
          type="button"
          title={t('res.matrix.copy.title', { path: text })}
          className="block max-w-[360px] truncate text-left font-mono text-xs text-brand-700 underline-offset-2 hover:underline"
          onClick={() => void handleCopyWorkDir(text)}
        >
          {text}
        </button>
      );
    },
    [handleCopyWorkDir, t]
  );

  const columns = useMemo<ColumnDef<MatrixRow, unknown>[]>(() => {
    const result: ColumnDef<MatrixRow, unknown>[] = [
      {
        id: 'roundIndex',
        accessorFn: row => row.roundIndex,
        header: t('res.matrix.col.round'),
        cell: info => info.getValue<number>(),
        size: 72,
      },
    ];

    if (paramKeys.length) {
      result.push({
        id: 'params',
        header: t('res.matrix.col.params'),
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
      const label = getConditionLabel(conditionLabelMap, group, index, t);
      const outputKeys = outputKeysByCondition.get(group.conditionId) || [];
      result.push({
        id: `condition_${group.conditionId}`,
        header: label,
        columns: [
          {
            id: `condition_${group.conditionId}_status`,
            accessorFn: row => row[`condition_${group.conditionId}_status`],
            header: t('res.matrix.col.status'),
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
                    onClick={() => openAttachmentPreview(attachment)}
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
      header: t('res.matrix.col.task'),
      columns: [
        {
          id: 'optDataId',
          accessorFn: row => row.optDataId,
          header: t('res.matrix.col.opt_data_id'),
          cell: info => info.getValue<MatrixValue>() ?? emptyCell,
          size: 140,
        },
        {
          id: 'taskId',
          accessorFn: row => row.taskId,
          header: t('res.matrix.col.task_id'),
          cell: info => info.getValue<MatrixValue>() ?? emptyCell,
          size: 140,
        },
        {
          id: 'workDir',
          accessorFn: row => row.workDir,
          header: t('res.matrix.col.work_dir'),
          cell: info => renderWorkDir(info.getValue<MatrixValue>()),
          size: 320,
        },
        {
          id: 'runningModule',
          accessorFn: row => row.runningModule,
          header: t('res.matrix.col.running_module'),
          cell: info => info.getValue<MatrixValue>() ?? emptyCell,
          size: 120,
        },
        {
          id: 'progress',
          accessorFn: row => row.progress,
          header: t('res.matrix.col.progress'),
          cell: info => info.getValue<MatrixValue>() ?? emptyCell,
          size: 120,
        },
        {
          id: 'finalResult',
          accessorFn: row => row.finalResult,
          header: t('res.matrix.col.final_result'),
          cell: info => info.getValue<MatrixValue>() ?? emptyCell,
          size: 120,
        },
      ],
    });

    return result;
  }, [
    conditionLabelMap,
    openAttachmentPreview,
    outputKeysByCondition,
    paramKeys,
    renderStatus,
    renderWorkDir,
    roundGroups,
    t,
  ]);

  return (
    <>
      <Card className="shadow-none">
        <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-base font-semibold text-foreground">{caseLabel}</h3>
              <Badge variant="default">{t('res.matrix.round_count', { count: rows.length })}</Badge>
              {activeCaseStats && (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>
                    {t('res.matrix.stat.conditions', { count: activeCaseStats.conditionCount })}
                  </span>
                  <span>
                    {t('res.matrix.stat.completed', { count: activeCaseStats.completedRounds })}
                  </span>
                  <span>
                    {t('res.matrix.stat.failed', { count: activeCaseStats.failedRounds })}
                  </span>
                  <span>
                    {t('res.matrix.stat.progress', { progress: activeCaseStats.progress })}
                  </span>
                </div>
              )}
              <div className="flex rounded-xl border border-border bg-background p-1">
                <Button
                  type="button"
                  variant={viewMode === 'matrix' ? 'primary' : 'ghost'}
                  size="sm"
                  className={viewMode === 'matrix' ? 'shadow-none' : ''}
                  onClick={() => setViewMode('matrix')}
                >
                  {t('res.matrix.tab.detail')}
                </Button>
                <Button
                  type="button"
                  variant={viewMode === 'analysis' ? 'primary' : 'ghost'}
                  size="sm"
                  className={viewMode === 'analysis' ? 'shadow-none' : ''}
                  onClick={() => setViewMode('analysis')}
                >
                  {t('res.matrix.tab.analysis')}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {viewMode === 'matrix' ? t('res.matrix.desc.detail') : t('res.matrix.desc.analysis')}
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

        {viewMode === 'matrix' ? (
          <VirtualTable
            data={rows}
            columns={columns}
            rowHeight={42}
            containerHeight={620}
            loading={loading}
            striped
            enableSorting
            emptyText={t('res.matrix.empty')}
            getRowId={row => String(row.roundIndex)}
          />
        ) : (
          <CaseResultAnalysisPanel roundGroups={roundGroups} loading={loading} />
        )}
      </Card>

      <CaseResultPreviewModal
        attachment={previewAttachment}
        previewIndex={previewIndex}
        setPreviewIndex={setPreviewIndex}
        onClose={() => setPreviewAttachment(null)}
        t={t}
      />
    </>
  );
};
