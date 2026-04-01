import React from 'react';
import { BarChart } from '@/components/charts';
import { Badge, Button, Card } from '@/components/ui';
import { Boxes, Gauge, Sparkles } from 'lucide-react';
import type { ResultsConditionCard } from './types';

interface ResultsOverviewSectionProps {
  derivedOrderProgress: number;
  runningRounds: number;
  workflowNodeCount: number;
  focusConditionLabel: string;
  scaleChartData: Array<{ conditionName: string; value: number }>;
  conditionCards: ResultsConditionCard[];
  onOpenCondition: (conditionId: number, targetTab: 'detail' | 'analysis') => void;
}

export const ResultsOverviewSection: React.FC<ResultsOverviewSectionProps> = ({
  derivedOrderProgress,
  runningRounds,
  workflowNodeCount,
  focusConditionLabel,
  scaleChartData,
  conditionCards,
  onOpenCondition,
}) => (
  <div className="space-y-6">
    <section className="grid gap-6 xl:grid-cols-[1fr_400px]">
      <Card className="shadow-none">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
            <Sparkles className="h-4 w-4 text-brand-500" />
            <span>核心指标</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="text-xs font-medium text-slate-500">订单进度</div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {derivedOrderProgress}%
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="text-xs font-medium text-slate-500">运行轮次</div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {runningRounds}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="text-xs font-medium text-slate-500">流程节点</div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {workflowNodeCount}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="text-xs font-medium text-slate-500">当前聚焦工况</div>
              <div
                className="mt-2 truncate text-base font-semibold text-slate-900 dark:text-white"
                title={focusConditionLabel}
              >
                {focusConditionLabel}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="flex flex-col shadow-none">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
          <Gauge className="h-4 w-4 text-brand-500" />
          <span>轮次规模分布</span>
        </div>
        <div className="min-h-[160px] flex-1">
          <BarChart
            data={scaleChartData}
            xField="conditionName"
            yField="value"
            showLegend={false}
            barWidth={24}
            height={160}
          />
        </div>
      </Card>
    </section>

    <section className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
        <Boxes className="h-4 w-4 text-brand-500" />
        <span>工况矩阵</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {conditionCards.map(condition => (
          <Card key={condition.id} className="shadow-none">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="text-base font-semibold text-slate-900 dark:text-white">
                    {condition.label}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    总轮次：{condition.totalRounds.toLocaleString()}
                  </div>
                </div>
                <Badge variant={condition.statusMeta.variant} size="sm">
                  {condition.statusMeta.label}
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-900/50">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">完成</div>
                  <div className="mt-2 font-medium tabular-nums">{condition.completedRounds}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-900/50">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">失败</div>
                  <div className="mt-2 font-medium tabular-nums">{condition.failedRounds}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-900/50">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">进度</div>
                  <div className="mt-2 font-medium tabular-nums">{condition.progress}%</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => onOpenCondition(condition.id, 'detail')}>
                  查看明细
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => onOpenCondition(condition.id, 'analysis')}
                >
                  进入分析
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  </div>
);
