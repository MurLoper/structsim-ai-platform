import React from 'react';
import { Badge, Button, Card } from '@/components/ui';
import { Boxes, GitBranch, Gauge, Layers3 } from 'lucide-react';
import type { ResultsCaseCard } from './types';

interface ResultsOverviewSectionProps {
  derivedOrderProgress: number;
  caseCount: number;
  conditionCount: number;
  totalRounds: number;
  completedRounds: number;
  failedRounds: number;
  caseCards: ResultsCaseCard[];
  onOpenCase: (caseId: number) => void;
}

const formatConditionLabels = (labels: string[]) => {
  if (!labels.length) return '暂无工况';
  if (labels.length <= 3) return labels.join('、');
  return `${labels.slice(0, 3).join('、')} 等 ${labels.length} 个工况`;
};

export const ResultsOverviewSection: React.FC<ResultsOverviewSectionProps> = ({
  derivedOrderProgress,
  caseCount,
  conditionCount,
  totalRounds,
  completedRounds,
  failedRounds,
  caseCards,
  onOpenCase,
}) => (
  <div className="space-y-5">
    <Card className="shadow-none">
      <div className="grid gap-3 md:grid-cols-5">
        <div className="rounded-2xl bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Layers3 className="h-3.5 w-3.5 text-brand-500" />
            方案数
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{caseCount}</div>
        </div>
        <div className="rounded-2xl bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Boxes className="h-3.5 w-3.5 text-brand-500" />
            工况数
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{conditionCount}</div>
        </div>
        <div className="rounded-2xl bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <GitBranch className="h-3.5 w-3.5 text-brand-500" />
            轮次
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{totalRounds}</div>
        </div>
        <div className="rounded-2xl bg-muted/40 px-4 py-3">
          <div className="text-xs font-medium text-muted-foreground">完成 / 失败</div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {completedRounds} / {failedRounds}
          </div>
        </div>
        <div className="rounded-2xl bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Gauge className="h-3.5 w-3.5 text-brand-500" />
            申请单进度
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{derivedOrderProgress}%</div>
        </div>
      </div>
    </Card>

    <section className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Layers3 className="h-4 w-4 text-brand-500" />
        <span>方案矩阵</span>
      </div>

      <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        {caseCards.map(caseItem => (
          <Card key={caseItem.id} className="shadow-none">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="text-base font-semibold text-foreground">{caseItem.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {caseItem.conditionCount} 个工况 / {caseItem.totalRounds} 轮
                  </div>
                </div>
                <Badge variant={caseItem.statusMeta.variant} size="sm">
                  {caseItem.statusMeta.label}
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-muted/50 px-4 py-3 text-sm">
                  <div className="text-xs text-muted-foreground">完成</div>
                  <div className="mt-2 font-medium tabular-nums">{caseItem.completedRounds}</div>
                </div>
                <div className="rounded-2xl bg-muted/50 px-4 py-3 text-sm">
                  <div className="text-xs text-muted-foreground">失败</div>
                  <div className="mt-2 font-medium tabular-nums">{caseItem.failedRounds}</div>
                </div>
                <div className="rounded-2xl bg-muted/50 px-4 py-3 text-sm">
                  <div className="text-xs text-muted-foreground">进度</div>
                  <div className="mt-2 font-medium tabular-nums">{caseItem.progress}%</div>
                </div>
              </div>

              <div className="line-clamp-2 text-xs text-muted-foreground">
                {formatConditionLabels(caseItem.conditionLabels)}
              </div>

              <Button variant="outline" onClick={() => onOpenCase(caseItem.id)}>
                查看方案明细
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  </div>
);
