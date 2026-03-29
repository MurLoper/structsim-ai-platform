import React, { useMemo, useState } from 'react';
import { Card, Badge, Button } from '@/components/ui';
import {
  Sigma,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Award,
  AlertTriangle,
} from 'lucide-react';
import type { RoundItem } from '@/api/results';
import { clsx } from 'clsx';

interface Props {
  rounds: RoundItem[];
  metricLabelMap: Map<string, string>;
}

const formatNumber = (val: any) => {
  if (typeof val === 'number') return Number.isFinite(val) ? val.toFixed(4) : '--';
  return val ?? '--';
};

export const OverviewAnalysisReport: React.FC<Props> = ({ rounds, metricLabelMap }) => {
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());

  const toggleRound = (index: number) => {
    setExpandedRounds(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const { bestRound, worstRound, successRounds, failedRounds } = useMemo(() => {
    let best: RoundItem | null = null;
    let worst: RoundItem | null = null;
    const successes: RoundItem[] = [];
    const failures: RoundItem[] = [];

    rounds.forEach(r => {
      if (r.status === 2) successes.push(r);
      if (r.status === 3) failures.push(r);

      // Simple mock logic for best/worst:
      // If finalResult exists, best = min finalResult, worst = max finalResult (or vice versa depending on metric, let's just pick one)
      // Otherwise fallback to progress or just first success/failure
      if (typeof r.finalResult === 'number') {
        if (!best || r.finalResult > (best.finalResult ?? -Infinity)) best = r;
        if (!worst || r.finalResult < (worst.finalResult ?? Infinity)) worst = r;
      }
    });

    if (!best && successes.length) best = successes[0];
    if (!worst && failures.length) worst = failures[0];
    else if (!worst && successes.length) worst = successes[successes.length - 1];

    return { bestRound: best, worstRound: worst, successRounds: successes, failedRounds: failures };
  }, [rounds]);

  if (!rounds || rounds.length === 0) return null;

  const renderRoundDetails = (round: RoundItem, type: 'best' | 'worst' | 'failed') => {
    const isExpanded = expandedRounds.has(round.roundIndex);
    const badgeMap = {
      best: (
        <Badge variant="success" size="sm" className="ml-2">
          <Award className="w-3 h-3 mr-1" />
          最优
        </Badge>
      ),
      worst: (
        <Badge variant="warning" size="sm" className="ml-2">
          <AlertTriangle className="w-3 h-3 mr-1" />
          最差
        </Badge>
      ),
      failed: (
        <Badge variant="error" size="sm" className="ml-2">
          <XCircle className="w-3 h-3 mr-1" />
          失败
        </Badge>
      ),
    };

    return (
      <div
        key={round.roundIndex}
        className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden mb-3 bg-white dark:bg-slate-900 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700"
      >
        <button
          onClick={() => toggleRound(round.roundIndex)}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              轮次 #{round.roundIndex}
            </span>
            {badgeMap[type]}
          </div>
          <div className="text-xs text-slate-500">
            {round.finalResult !== null && round.finalResult !== undefined
              ? `综合结果: ${formatNumber(round.finalResult)}`
              : `进度: ${round.progress}%`}
          </div>
        </button>
        {isExpanded && (
          <div className="px-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-xs font-medium text-slate-500 mb-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> 参数配置 (Params)
              </div>
              {round.paramValues && Object.keys(round.paramValues).length > 0 ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {Object.entries(round.paramValues).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between items-center text-sm py-1 border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                    >
                      <span className="text-slate-500 truncate pr-2" title={k}>
                        {k}
                      </span>
                      <span className="font-mono text-slate-900 dark:text-slate-300">
                        {formatNumber(v)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-slate-400">无参数</span>
              )}
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 mb-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 输出结果 (Outputs)
              </div>
              {round.outputResults && Object.keys(round.outputResults).length > 0 ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {Object.entries(round.outputResults).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between items-center text-sm py-1 border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                    >
                      <span
                        className="text-slate-500 truncate pr-2"
                        title={metricLabelMap.get(k) || k}
                      >
                        {metricLabelMap.get(k) || k}
                      </span>
                      <span className="font-mono text-slate-900 dark:text-slate-300">
                        {formatNumber(v)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-slate-400">无输出结果</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="shadow-none">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
            <Sigma className="h-4 w-4 text-brand-500" />
            <span>自动分析报告</span>
          </div>
          <div className="flex gap-2">
            <Badge variant="success" className="px-2 py-0.5">
              <CheckCircle className="w-3 h-3 mr-1" />
              成功: {successRounds.length}
            </Badge>
            {failedRounds.length > 0 && (
              <Badge variant="error" className="px-2 py-0.5">
                <XCircle className="w-3 h-3 mr-1" />
                失败: {failedRounds.length}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {/* 最佳与最差 */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-3 font-medium">
              极值轮次分析
            </h4>
            {bestRound ? (
              renderRoundDetails(bestRound, 'best')
            ) : (
              <div className="text-sm text-slate-400 py-4 text-center bg-slate-50 rounded-lg">
                暂无最优轮次
              </div>
            )}
            {worstRound && worstRound !== bestRound
              ? renderRoundDetails(worstRound, 'worst')
              : null}
          </div>

          {/* 失败归类 */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-3 font-medium">
              失败轮次归类 ({failedRounds.length})
            </h4>
            {failedRounds.length > 0 ? (
              <div className="space-y-1">
                {failedRounds.slice(0, 5).map(r => renderRoundDetails(r, 'failed'))}
                {failedRounds.length > 5 && (
                  <div className="text-center py-2 text-xs text-slate-500">
                    还有 {failedRounds.length - 5} 个失败轮次未展示...
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-400 py-8 text-center bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30 flex flex-col items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-400 mb-2 opacity-50" />
                <span>当前工况所有轮次执行成功，无失败记录</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
