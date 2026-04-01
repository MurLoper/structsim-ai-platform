import React from 'react';
import { Download, BarChart3 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { VirtualTable } from '@/components/tables/VirtualTable';
import { Button, Card } from '@/components/ui';

type PreviewRow = { id: string };

type ConditionAnalysisPreviewCardProps<T extends PreviewRow> = {
  rows: T[];
  columns: ColumnDef<T>[];
  loading: boolean;
  chartLabel?: string;
  onExport: () => void;
};

export const ConditionAnalysisPreviewCard = <T extends PreviewRow>({
  rows,
  columns,
  loading,
  chartLabel,
  onExport,
}: ConditionAnalysisPreviewCardProps<T>) => (
  <Card className="shadow-none">
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
          <BarChart3 className="h-4 w-4 text-brand-500" />
          <span>绘图数据预览</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
            预览行数 {rows.length.toLocaleString()}
          </span>
          {chartLabel ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
              当前图形 {chartLabel}
            </span>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="ml-2 h-7 px-3 text-xs"
            disabled={rows.length === 0}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            导出 Excel
          </Button>
        </div>
      </div>

      <VirtualTable
        data={rows}
        columns={columns}
        rowHeight={40}
        containerHeight={360}
        striped
        enableSorting
        loading={loading}
        emptyText="当前工况暂无可预览数据"
        getRowId={row => row.id}
      />
    </div>
  </Card>
);
