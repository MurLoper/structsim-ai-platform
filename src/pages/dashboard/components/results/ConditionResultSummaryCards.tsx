import React from 'react';
import { Sigma } from 'lucide-react';

type ConditionResultSummaryCardsProps = {
  rangeStart: number;
  rangeEnd: number;
  total: number;
  finalResultStats: { min: number; max: number; avg: number } | null;
};

export const ConditionResultSummaryCards: React.FC<ConditionResultSummaryCardsProps> = ({
  rangeStart,
  rangeEnd,
  total,
  finalResultStats,
}) => (
  <div className="grid gap-3 sm:grid-cols-3">
    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-900/50">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">当前区间</div>
      <div className="mt-2 font-medium tabular-nums">
        {rangeStart}-{rangeEnd}
      </div>
    </div>
    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-900/50">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">总轮次</div>
      <div className="mt-2 font-medium tabular-nums">{total.toLocaleString()}</div>
    </div>
    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-900/50">
      <div className="flex items-center gap-1 text-xs uppercase tracking-[0.16em] text-slate-500">
        <Sigma className="h-3.5 w-3.5" />
        <span>综合结果</span>
      </div>
      <div className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
        {finalResultStats ? (
          <>
            Min {finalResultStats.min.toFixed(3)} / Avg {finalResultStats.avg.toFixed(3)} / Max{' '}
            {finalResultStats.max.toFixed(3)}
          </>
        ) : (
          '当前没有综合结果统计。'
        )}
      </div>
    </div>
  </div>
);
