import React from 'react';
import { Badge, Button, Card } from '@/components/ui';
import { Boxes, GitBranch, Gauge, Layers3 } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
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

const formatConditionLabels = (
  labels: string[],
  t: (key: string, params?: Record<string, string | number>) => string
) => {
  if (!labels.length) return t('res.case.no_conditions');
  if (labels.length <= 3) return labels.join('、');
  return t('res.case.conditions_more', {
    labels: labels.slice(0, 3).join('、'),
    count: labels.length,
  });
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
}) => {
  const { t } = useI18n();

  return (
    <div className="space-y-5">
      <Card className="shadow-none">
        <div className="grid gap-3 md:grid-cols-5">
          <div className="rounded-2xl bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Layers3 className="h-3.5 w-3.5 text-brand-500" />
              {t('res.case.overview.case_count')}
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">{caseCount}</div>
          </div>
          <div className="rounded-2xl bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Boxes className="h-3.5 w-3.5 text-brand-500" />
              {t('res.case.overview.condition_count')}
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">{conditionCount}</div>
          </div>
          <div className="rounded-2xl bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <GitBranch className="h-3.5 w-3.5 text-brand-500" />
              {t('res.case.overview.rounds')}
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">{totalRounds}</div>
          </div>
          <div className="rounded-2xl bg-muted/40 px-4 py-3">
            <div className="text-xs font-medium text-muted-foreground">
              {t('res.case.overview.completed_failed')}
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">
              {completedRounds} / {failedRounds}
            </div>
          </div>
          <div className="rounded-2xl bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Gauge className="h-3.5 w-3.5 text-brand-500" />
              {t('res.case.overview.order_progress')}
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">{derivedOrderProgress}%</div>
          </div>
        </div>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Layers3 className="h-4 w-4 text-brand-500" />
          <span>{t('res.case.overview.matrix')}</span>
        </div>

        <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {caseCards.map(caseItem => (
            <Card key={caseItem.id} className="shadow-none">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="text-base font-semibold text-foreground">{caseItem.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {t('res.case.overview.condition_rounds', {
                        conditionCount: caseItem.conditionCount,
                        rounds: caseItem.totalRounds,
                      })}
                    </div>
                  </div>
                  <Badge variant={caseItem.statusMeta.variant} size="sm">
                    {caseItem.statusMeta.label}
                  </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-muted/50 px-4 py-3 text-sm">
                    <div className="text-xs text-muted-foreground">
                      {t('res.case.overview.completed')}
                    </div>
                    <div className="mt-2 font-medium tabular-nums">{caseItem.completedRounds}</div>
                  </div>
                  <div className="rounded-2xl bg-muted/50 px-4 py-3 text-sm">
                    <div className="text-xs text-muted-foreground">
                      {t('res.case.overview.failed')}
                    </div>
                    <div className="mt-2 font-medium tabular-nums">{caseItem.failedRounds}</div>
                  </div>
                  <div className="rounded-2xl bg-muted/50 px-4 py-3 text-sm">
                    <div className="text-xs text-muted-foreground">
                      {t('res.case.overview.progress')}
                    </div>
                    <div className="mt-2 font-medium tabular-nums">{caseItem.progress}%</div>
                  </div>
                </div>

                <div className="line-clamp-2 text-xs text-muted-foreground">
                  {formatConditionLabels(caseItem.conditionLabels, t)}
                </div>

                <Button variant="outline" onClick={() => onOpenCase(caseItem.id)}>
                  {t('res.case.overview.open_detail')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};
