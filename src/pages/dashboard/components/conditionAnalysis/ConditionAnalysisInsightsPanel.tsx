import React from 'react';
import { Boxes, Sigma } from 'lucide-react';
import { Badge, Card } from '@/components/ui';
import type { AnalysisSummary } from './conditionAnalysisTypes';
import { formatNumber } from './conditionAnalysisFields';

type ConditionAnalysisInsightsPanelProps = {
  summary: AnalysisSummary;
  narrative: string[];
  algorithmType?: string | null;
  resolvedConditionTitle: string;
  conditionId?: number | null;
  foldTypeId?: number | null;
  simTypeId?: number | null;
  total: number;
  sampledRowCount: number;
  resultSource: string;
};

export const ConditionAnalysisInsightsPanel: React.FC<ConditionAnalysisInsightsPanelProps> = ({
  summary,
  narrative,
  algorithmType,
  resolvedConditionTitle,
  conditionId,
  foldTypeId,
  simTypeId,
  total,
  sampledRowCount,
  resultSource,
}) => (
  <div className="space-y-6">
    <Card className="shadow-none">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
          <Sigma className="h-4 w-4 text-brand-500" />
          <span>图表分析结论</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-900/50">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Min</div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">
              {formatNumber(summary.min)}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-900/50">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Avg</div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">
              {formatNumber(summary.avg)}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-900/50">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Max</div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">
              {formatNumber(summary.max)}
            </div>
          </div>
        </div>
        <div className="space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {narrative.map(line => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="info" size="sm">
            {algorithmType || 'UNKNOWN'}
          </Badge>
          <Badge variant="success" size="sm">
            最优轮次 #{summary.best?.roundIndex ?? '--'}
          </Badge>
          <Badge variant="warning" size="sm">
            最差轮次 #{summary.worst?.roundIndex ?? '--'}
          </Badge>
        </div>
      </div>
    </Card>

    <Card className="shadow-none">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
          <Boxes className="h-4 w-4 text-brand-500" />
          <span>分析范围</span>
        </div>
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/50">
            <span>工况标题</span>
            <span className="max-w-[220px] text-right font-medium">{resolvedConditionTitle}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/50">
            <span>工况 ID</span>
            <span className="font-medium tabular-nums">{conditionId ?? '-'}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/50">
            <span>FoldType</span>
            <span className="font-medium tabular-nums">{foldTypeId ?? '-'}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/50">
            <span>SimType</span>
            <span className="font-medium tabular-nums">{simTypeId ?? '-'}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/50">
            <span>轮次覆盖</span>
            <span className="font-medium tabular-nums">{total.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/50">
            <span>绘图点数</span>
            <span className="font-medium tabular-nums">{sampledRowCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/50">
            <span>结果源</span>
            <Badge variant={resultSource === 'mock' ? 'warning' : 'success'} size="sm">
              {String(resultSource).toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  </div>
);
