import type { ColumnDef } from '@tanstack/react-table';
import type { RoundItem } from '@/api/results';
import { exportAoaToExcel, type ExcelCellValue, type ExcelMergeRange } from '@/utils/excel';
import { CONDITION_RESULT_STATUS_MAP } from './conditionResultConfig';

type ExportConditionResultTableOptions = {
  conditionName: string;
  rounds: RoundItem[];
  tableColumns: ColumnDef<RoundItem>[];
  bestRoundIndex?: number | null;
};

export const exportConditionResultTable = async ({
  conditionName,
  rounds,
  tableColumns,
  bestRoundIndex,
}: ExportConditionResultTableOptions) => {
  const aoa: ExcelCellValue[][] = [];
  const merges: ExcelMergeRange[] = [];

  const baseColumns = tableColumns.filter(
    column =>
      !column.id?.startsWith('param_') &&
      !column.id?.startsWith('output_') &&
      column.id !== 'status' &&
      column.id !== 'isBest'
  );
  const paramColumns = tableColumns.filter(column => column.id?.startsWith('param_'));
  const outputColumns = tableColumns.filter(column => column.id?.startsWith('output_'));
  const metaColumns = tableColumns.filter(
    column => column.id === 'status' || column.id === 'isBest'
  );
  const hasGroupHeader = paramColumns.length > 0 || outputColumns.length > 0;

  if (hasGroupHeader) {
    const headerRow1: string[] = [];
    const headerRow2: string[] = [];
    let colIndex = 0;

    baseColumns.forEach(column => {
      headerRow1.push('基础信息');
      headerRow2.push(typeof column.header === 'string' ? column.header : String(column.id));
      colIndex += 1;
    });
    if (baseColumns.length > 1) {
      merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: baseColumns.length - 1 } });
    }

    if (paramColumns.length > 0) {
      const startIndex = colIndex;
      paramColumns.forEach(column => {
        headerRow1.push('参数配置');
        headerRow2.push(typeof column.header === 'string' ? column.header : String(column.id));
        colIndex += 1;
      });
      if (paramColumns.length > 1) {
        merges.push({ s: { r: 0, c: startIndex }, e: { r: 0, c: colIndex - 1 } });
      }
    }

    if (outputColumns.length > 0) {
      const startIndex = colIndex;
      outputColumns.forEach(column => {
        headerRow1.push('输出结果');
        headerRow2.push(typeof column.header === 'string' ? column.header : String(column.id));
        colIndex += 1;
      });
      if (outputColumns.length > 1) {
        merges.push({ s: { r: 0, c: startIndex }, e: { r: 0, c: colIndex - 1 } });
      }
    }

    if (metaColumns.length > 0) {
      const startIndex = colIndex;
      metaColumns.forEach(column => {
        headerRow1.push('其他信息');
        headerRow2.push(typeof column.header === 'string' ? column.header : String(column.id));
        colIndex += 1;
      });
      if (metaColumns.length > 1) {
        merges.push({ s: { r: 0, c: startIndex }, e: { r: 0, c: colIndex - 1 } });
      }
    }

    aoa.push(headerRow1);
    aoa.push(headerRow2);
  } else {
    aoa.push(
      tableColumns.map(column =>
        typeof column.header === 'string' ? column.header : String(column.id)
      )
    );
  }

  const orderedColumns = hasGroupHeader
    ? [...baseColumns, ...paramColumns, ...outputColumns, ...metaColumns]
    : tableColumns;

  rounds.forEach(round => {
    aoa.push(
      orderedColumns.map(column => {
        if (column.id === 'roundIndex') return round.roundIndex;
        if (column.id === 'runningModule') return round.runningModule || '-';
        if (column.id === 'process') return `${round.progress}%`;
        if (column.id === 'finalResult') return round.finalResult ?? '-';
        if (column.id?.startsWith('param_')) {
          return round.paramValues?.[column.id.replace('param_', '')] ?? '-';
        }
        if (column.id?.startsWith('output_')) {
          return round.outputResults?.[column.id.replace('output_', '')] ?? '-';
        }
        if (column.id === 'status') {
          return CONDITION_RESULT_STATUS_MAP[round.status]?.label || '未知';
        }
        if (column.id === 'isBest') {
          return bestRoundIndex === round.roundIndex ? '最优' : '';
        }
        return '-';
      })
    );
  });

  await exportAoaToExcel(aoa, `${conditionName}-明细结果`, merges);
};
