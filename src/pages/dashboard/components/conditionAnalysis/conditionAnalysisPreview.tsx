import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { ExcelCellValue, ExcelMergeRange } from '@/utils/excel';
import type { FlatRoundRow } from './conditionAnalysisTypes';
import { STATUS_LABELS } from './conditionAnalysisTypes';
import { formatNumber, getNumericValue } from './conditionAnalysisFields';

export type PreviewExportColumn = {
  id: 'roundIndex' | 'xField' | 'yField' | 'zField' | 'status';
  header: string;
  group: 'basic' | 'coords' | 'meta';
};

export const buildConditionPreviewColumns = ({
  currentXLabel,
  currentYLabel,
  currentZLabel,
  is3DChart,
  xField,
  yField,
  zField,
}: {
  currentXLabel: string;
  currentYLabel: string;
  currentZLabel: string;
  is3DChart: boolean;
  xField: string;
  yField: string;
  zField: string;
}): ColumnDef<FlatRoundRow>[] => {
  const columns: ColumnDef<FlatRoundRow>[] = [
    {
      header: '轮次',
      accessorKey: 'roundIndex',
      cell: ({ row }) => <span className="tabular-nums">{row.original.roundIndex}</span>,
    },
    {
      header: currentXLabel,
      id: 'xField',
      cell: ({ row }) => formatNumber(getNumericValue(row.original, xField), 4),
    },
    {
      header: currentYLabel,
      id: 'yField',
      cell: ({ row }) => (
        <span className="font-medium text-slate-900 dark:text-slate-100">
          {formatNumber(getNumericValue(row.original, yField), 4)}
        </span>
      ),
    },
  ];

  if (is3DChart) {
    columns.push({
      header: currentZLabel,
      id: 'zField',
      cell: ({ row }) => formatNumber(getNumericValue(row.original, zField), 4),
    });
  }

  columns.push({
    header: '状态',
    accessorKey: 'status',
    cell: ({ row }) => STATUS_LABELS[row.original.status] || `状态 ${row.original.status}`,
  });

  return columns;
};

export const buildConditionPreviewExportColumns = ({
  currentXLabel,
  currentYLabel,
  currentZLabel,
  is3DChart,
}: {
  currentXLabel: string;
  currentYLabel: string;
  currentZLabel: string;
  is3DChart: boolean;
}): PreviewExportColumn[] => [
  { id: 'roundIndex', header: '轮次', group: 'basic' },
  { id: 'xField', header: currentXLabel, group: 'coords' },
  { id: 'yField', header: currentYLabel, group: 'coords' },
  ...(is3DChart
    ? [{ id: 'zField' as const, header: currentZLabel, group: 'coords' as const }]
    : []),
  { id: 'status', header: '状态', group: 'meta' },
];

export const buildConditionPreviewExportData = ({
  rows,
  columns,
  xField,
  yField,
  zField,
}: {
  rows: FlatRoundRow[];
  columns: PreviewExportColumn[];
  xField: string;
  yField: string;
  zField: string;
}) => {
  const aoa: ExcelCellValue[][] = [];
  const headerRow1: string[] = [];
  const headerRow2: string[] = [];
  const merges: ExcelMergeRange[] = [];

  columns.forEach(col => {
    if (col.group === 'coords') {
      headerRow1.push('坐标数据');
    } else if (col.group === 'basic') {
      headerRow1.push('基本信息');
    } else {
      headerRow1.push('状态信息');
    }
    headerRow2.push(col.header);
  });

  const coordsStart = columns.findIndex(col => col.group === 'coords');
  let coordsEnd = -1;
  for (let index = columns.length - 1; index >= 0; index -= 1) {
    if (columns[index].group === 'coords') {
      coordsEnd = index;
      break;
    }
  }

  if (coordsStart !== -1 && coordsEnd > coordsStart) {
    merges.push({ s: { r: 0, c: coordsStart }, e: { r: 0, c: coordsEnd } });
  }

  aoa.push(headerRow1);
  aoa.push(headerRow2);

  rows.forEach(row => {
    const rowData = columns.map(col => {
      if (col.id === 'xField') return getNumericValue(row, xField) ?? '-';
      if (col.id === 'yField') return getNumericValue(row, yField) ?? '-';
      if (col.id === 'zField') return getNumericValue(row, zField) ?? '-';
      if (col.id === 'roundIndex') return row.roundIndex;
      if (col.id === 'status') return STATUS_LABELS[row.status] || '未知';
      return '-';
    });
    aoa.push(rowData);
  });

  return { aoa, merges };
};
