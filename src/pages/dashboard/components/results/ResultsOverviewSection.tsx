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
  onOpenCondition: (conditionId: number) => void;
  onResubmitCondition: (conditionId: number) => void;
  resubmitLabel: string;
  resubmittingLabel: string;
  resubmittingConditionId: number | null;
  isResubmittingCondition: boolean;
}

export const ResultsOverviewSection: React.FC<ResultsOverviewSectionProps> = ({
  derivedOrderProgress,
  runningRounds,
  workflowNodeCount,
  focusConditionLabel,
  scaleChartData,
  conditionCards,
  onOpenCondition,
  onResubmitCondition,
  resubmitLabel,
  resubmittingLabel,
  resubmittingConditionId,
  isResubmittingCondition,
}) => (
  <div className="space-y-6">
    <section className="grid gap-6 xl:grid-cols-[1fr_400px]">
      <Card className="shadow-none">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Sparkles className="h-4 w-4 text-brand-500" />
            <span>核心指标</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-muted/40 px-4 py-4">
              <div className="text-xs font-medium text-muted-foreground">订单进度</div>
              <div className="mt-2 text-2xl font-bold text-foreground">{derivedOrderProgress}%</div>
            </div>
            <div className="rounded-2xl border border-border bg-muted/40 px-4 py-4">
              <div className="text-xs font-medium text-muted-foreground">运行轮次</div>
              <div className="mt-2 text-2xl font-bold text-foreground">{runningRounds}</div>
            </div>
            <div className="rounded-2xl border border-border bg-muted/40 px-4 py-4">
              <div className="text-xs font-medium text-muted-foreground">流程节点</div>
              <div className="mt-2 text-2xl font-bold text-foreground">{workflowNodeCount}</div>
            </div>
            <div className="rounded-2xl border border-border bg-muted/40 px-4 py-4">
              <div className="text-xs font-medium text-muted-foreground">当前聚焦工况</div>
              <div
                className="mt-2 truncate text-base font-semibold text-foreground"
                title={focusConditionLabel}
              >
                {focusConditionLabel}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="flex flex-col shadow-none">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
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
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Boxes className="h-4 w-4 text-brand-500" />
        <span>工况矩阵</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {conditionCards.map(condition => (
          <Card key={condition.id} className="shadow-none">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="text-base font-semibold text-foreground">{condition.label}</div>
                  <div className="text-sm text-muted-foreground">
                    总轮次：{condition.totalRounds.toLocaleString()}
                  </div>
                </div>
                <Badge variant={condition.statusMeta.variant} size="sm">
                  {condition.statusMeta.label}
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-muted/50 px-4 py-3 text-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    完成
                  </div>
                  <div className="mt-2 font-medium tabular-nums">{condition.completedRounds}</div>
                </div>
                <div className="rounded-2xl bg-muted/50 px-4 py-3 text-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    失败
                  </div>
                  <div className="mt-2 font-medium tabular-nums">{condition.failedRounds}</div>
                </div>
                <div className="rounded-2xl bg-muted/50 px-4 py-3 text-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    进度
                  </div>
                  <div className="mt-2 font-medium tabular-nums">{condition.progress}%</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => onOpenCondition(condition.id)}>
                  查看明细与分析
                </Button>
                {condition.canResubmit && (
                  <Button
                    variant="danger"
                    disabled={isResubmittingCondition && resubmittingConditionId === condition.id}
                    onClick={() => onResubmitCondition(condition.id)}
                  >
                    {isResubmittingCondition && resubmittingConditionId === condition.id
                      ? resubmittingLabel
                      : resubmitLabel}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  </div>
);
