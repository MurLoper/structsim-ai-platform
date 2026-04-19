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

const renderCenterCell = (value: MatrixValue) => (
  <div className="text-center">{value ?? emptyCell}</div>
);

const getAlgorithmType = (roundGroups: ConditionRoundsGroup[]) =>
  String(roundGroups[0]?.orderCondition?.algorithmType || '').toUpperCase();

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

  const algorithmType = useMemo(() => getAlgorithmType(roundGroups), [roundGroups]);
  const isBayesian = algorithmType === 'BAYESIAN';

  const paramKeys = useMemo(
    () => collectSortedKeys(roundGroups, group => group.rounds.map(round => round.paramValues)),
    [roundGroups]
  );

  const outputKeysByCondition = useMemo(
    () => buildOutputKeysByCondition(roundGroups),
    [roundGroups]
  );

  const rows = useMemo<MatrixRow[]>(() => {
    const orderedRowKeys: Array<string | number> = [];
    const seenRowKeys = new Set<string | number>();

    roundGroups.forEach(group => {
      group.rounds.forEach((round, index) => {
        const rowKey = round.circleId ?? round.id ?? `row_${index + 1}`;
        if (seenRowKeys.has(rowKey)) return;
        seenRowKeys.add(rowKey);
        orderedRowKeys.push(rowKey);
      });
    });

    return orderedRowKeys.map((rowKey, index) => {
      const row: MatrixRow = {
        __rowKey: String(rowKey),
        roundIndex: index + 1,
        __attachments: {},
      };
      let resolvedRoundIndex: number | null = null;

      roundGroups.forEach(group => {
        const round =
          group.rounds.find(item => {
            const candidateKey = item.circleId ?? item.id;
            return String(candidateKey) === String(rowKey);
          }) || group.rounds[index];
        if (!round) return;
        resolvedRoundIndex = Number(round.roundIndex || resolvedRoundIndex || index + 1);

        const groupKey = `condition_${group.conditionId}`;
        row[`${groupKey}_status`] = normalizeCellValue(round.status);
        row[`${groupKey}_optDataId`] = normalizeCellValue(round.optDataId);
        row[`${groupKey}_taskId`] = normalizeCellValue(round.taskId);
        row[`${groupKey}_workDir`] = getFirstPresent(round.dataDir, round.jobDir, round.baseDir);
        row[`${groupKey}_runningModule`] = normalizeCellValue(round.runningModule);
        row[`${groupKey}_runningStatus`] = normalizeCellValue(round.runningStatus ?? round.status);
        row[`${groupKey}_progress`] = normalizeCellValue(`${round.progress ?? 0}%`);
        row.finalResult = getFirstPresent(row.finalResult, round.finalResult);

        Object.entries(round.paramValues || {}).forEach(([key, value]) => {
          row[`param_${key}`] = getFirstPresent(row[`param_${key}`], value);
        });

        const outputOrigins = round.outputOriginResults || round.outputResults || {};
        const outputFinals = round.outputFinalResults || {};

        Object.entries(outputOrigins).forEach(([key, value]) => {
          const cellKey = `${groupKey}_output_origin_${key}`;
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

        Object.entries(outputFinals).forEach(([key, value]) => {
          const cellKey = `${groupKey}_output_final_${key}`;
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

      row.roundIndex = resolvedRoundIndex ?? index + 1;
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
        <div className="flex justify-center">
          <button
            type="button"
            title={t('res.matrix.copy.title', { path: text })}
            className="block max-w-[320px] truncate text-center font-mono text-xs text-brand-700 underline-offset-2 hover:underline"
            onClick={() => void handleCopyWorkDir(text)}
          >
            {text}
          </button>
        </div>
      );
    },
    [handleCopyWorkDir, t]
  );

  const renderOutputValue = useCallback(
    (value: MatrixValue, attachment: MatrixAttachment | undefined) => {
      if (value === null || value === undefined || value === '') return emptyCell;
      if (!attachment) return renderCenterCell(value);
      return (
        <div className="text-center">
          <Button
            type="button"
            variant="ghost"
            className="h-auto px-0 py-0 font-mono text-brand-700 hover:bg-transparent hover:text-brand-800"
            onClick={() => openAttachmentPreview(attachment)}
          >
            {value}
          </Button>
        </div>
      );
    },
    [openAttachmentPreview]
  );

  const columns = useMemo<ColumnDef<MatrixRow, unknown>[]>(() => {
    const result: ColumnDef<MatrixRow, unknown>[] = [
      {
        id: 'roundIndex',
        accessorFn: row => row.roundIndex,
        header: t('res.matrix.col.round'),
        cell: info => renderCenterCell(info.getValue<number>()),
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
          cell: info => renderCenterCell(info.getValue<MatrixValue>()),
          size: 110,
        })),
      });
    }

    roundGroups.forEach((group, index) => {
      const label = getConditionLabel(conditionLabelMap, group, index, t);
      const groupKey = `condition_${group.conditionId}`;
      const outputKeys = outputKeysByCondition.get(group.conditionId) || [];

      result.push({
        id: groupKey,
        header: label,
        columns: [
          {
            id: `${groupKey}_optDataId`,
            accessorFn: row => row[`${groupKey}_optDataId`],
            header: t('res.matrix.col.opt_data_id'),
            cell: info => renderCenterCell(info.getValue<MatrixValue>()),
            size: 140,
          },
          {
            id: `${groupKey}_taskId`,
            accessorFn: row => row[`${groupKey}_taskId`],
            header: t('res.matrix.col.task_id'),
            cell: info => renderCenterCell(info.getValue<MatrixValue>()),
            size: 140,
          },
          ...outputKeys.map(outputKey => {
            const originCellKey = `${groupKey}_output_origin_${outputKey}`;
            const finalCellKey = `${groupKey}_output_final_${outputKey}`;
            const originColumn = {
              id: originCellKey,
              accessorFn: (row: MatrixRow) => row[originCellKey],
              header: isBayesian ? t('res.matrix.col.output_origin') : outputKey,
              cell: info =>
                renderOutputValue(
                  info.getValue() as MatrixValue,
                  info.row.original.__attachments[originCellKey]
                ),
              size: 150,
            } satisfies ColumnDef<MatrixRow, unknown>;

            if (!isBayesian) {
              return originColumn;
            }

            return {
              id: `${groupKey}_output_${outputKey}`,
              header: outputKey,
              columns: [
                originColumn,
                {
                  id: finalCellKey,
                  accessorFn: (row: MatrixRow) => row[finalCellKey],
                  header: t('res.matrix.col.output_final'),
                  cell: info =>
                    renderOutputValue(
                      info.getValue() as MatrixValue,
                      info.row.original.__attachments[finalCellKey]
                    ),
                  size: 150,
                } satisfies ColumnDef<MatrixRow, unknown>,
              ],
            } satisfies ColumnDef<MatrixRow, unknown>;
          }),
          {
            id: `${groupKey}_workDir`,
            accessorFn: row => row[`${groupKey}_workDir`],
            header: t('res.matrix.col.work_dir'),
            cell: info => renderWorkDir(info.getValue<MatrixValue>()),
            size: 320,
          },
          {
            id: `${groupKey}_runningModule`,
            accessorFn: row => row[`${groupKey}_runningModule`],
            header: t('res.matrix.col.running_module'),
            cell: info => renderCenterCell(info.getValue<MatrixValue>()),
            size: 120,
          },
          {
            id: `${groupKey}_runningStatus`,
            accessorFn: row => row[`${groupKey}_runningStatus`],
            header: t('res.matrix.col.running_status'),
            cell: info => renderStatus(info.getValue<MatrixValue>()),
            size: 110,
          },
          {
            id: `${groupKey}_progress`,
            accessorFn: row => row[`${groupKey}_progress`],
            header: t('res.matrix.col.progress'),
            cell: info => renderCenterCell(info.getValue<MatrixValue>()),
            size: 120,
          },
        ],
      });
    });

    if (isBayesian) {
      result.push({
        id: 'finalResult',
        accessorFn: row => row.finalResult,
        header: t('res.matrix.col.final_result'),
        cell: info => renderCenterCell(info.getValue<MatrixValue>()),
        size: 120,
      });
    }

    return result;
  }, [
    conditionLabelMap,
    isBayesian,
    outputKeysByCondition,
    paramKeys,
    renderOutputValue,
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
            getRowId={row => row.__rowKey}
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
