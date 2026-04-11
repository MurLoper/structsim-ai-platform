import React from 'react';
import { Badge, Button, Card } from '@/components/ui';
import { FileStack } from 'lucide-react';
import type { ConditionRoundsGroup } from '../../hooks/resultsAnalysisTypes';
import { ConditionResultTable } from '../ConditionResultTable';
import type { ResultsConditionCard } from './types';

interface ResultsDetailSectionProps {
  conditionCards: ResultsConditionCard[];
  focusedConditionId: number | null;
  focusedGroup: ConditionRoundsGroup | null;
  focusConditionLabel: string;
  isResultsLoading: boolean;
  onSelectCondition: (conditionId: number) => void;
  onResubmitCondition: (conditionId: number) => void;
  resubmitLabel: string;
  resubmittingLabel: string;
  resubmittingConditionId: number | null;
  isResubmittingCondition: boolean;
  onPageChange: (conditionId: number, page: number) => void;
  onPageSizeChange: (conditionId: number, pageSize: number) => void;
}

export const ResultsDetailSection: React.FC<ResultsDetailSectionProps> = ({
  conditionCards,
  focusedConditionId,
  focusedGroup,
  focusConditionLabel,
  isResultsLoading,
  onSelectCondition,
  onResubmitCondition,
  resubmitLabel,
  resubmittingLabel,
  resubmittingConditionId,
  isResubmittingCondition,
  onPageChange,
  onPageSizeChange,
}) => (
  <div className="grid gap-6 xl:grid-cols-[290px_minmax(0,1fr)]">
    <Card className="shadow-none">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
          <FileStack className="h-4 w-4 text-brand-500" />
          <span>工况切换</span>
        </div>
        <div className="space-y-3">
          {conditionCards.map(condition => {
            const active = condition.id === (focusedConditionId || focusedGroup?.conditionId);
            const isCurrentResubmitting =
              isResubmittingCondition && resubmittingConditionId === condition.id;
            return (
              <div
                key={condition.id}
                className={`rounded-2xl border px-4 py-4 transition-colors ${
                  active
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectCondition(condition.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {condition.label}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {condition.totalRounds.toLocaleString()} 轮
                      </div>
                    </div>
                    <Badge variant={condition.statusMeta.variant} size="sm">
                      {condition.statusMeta.label}
                    </Badge>
                  </div>
                </button>
                {condition.canResubmit && (
                  <Button
                    variant="danger"
                    className="mt-3 w-full"
                    disabled={isCurrentResubmitting}
                    onClick={() => onResubmitCondition(condition.id)}
                  >
                    {isCurrentResubmitting ? resubmittingLabel : resubmitLabel}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>

    <div className="space-y-4">
      {focusedGroup ? (
        <Card className="shadow-none">
          <ConditionResultTable
            conditionId={focusedGroup.conditionId}
            conditionName={focusConditionLabel}
            condition={focusedGroup.orderCondition}
            resultSource={focusedGroup.resultSource}
            rounds={focusedGroup.rounds}
            columns={focusedGroup.columns}
            bestRoundIndex={null}
            loading={isResultsLoading}
            height={640}
            page={focusedGroup.page}
            pageSize={focusedGroup.pageSize}
            total={focusedGroup.total}
            totalPages={focusedGroup.totalPages}
            onPageChange={page => onPageChange(focusedGroup.conditionId, page)}
            onPageSizeChange={pageSize => onPageSizeChange(focusedGroup.conditionId, pageSize)}
          />
        </Card>
      ) : (
        <Card className="shadow-none">
          <div className="flex h-56 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            {isResultsLoading ? '当前工况明细加载中...' : '当前工况暂无明细数据'}
          </div>
        </Card>
      )}
    </div>
  </div>
);
