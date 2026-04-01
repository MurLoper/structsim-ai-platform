import React from 'react';
import { Button, Card } from '@/components/ui';
import { ScanSearch } from 'lucide-react';
import type { OrderConditionSummary } from '@/api/results';
import type { FullConditionRoundsGroup } from '../../hooks/resultsAnalysisTypes';
import { ConditionAnalysisWorkbench } from '../ConditionAnalysisWorkbench';
import type { ResultsConditionCard } from './types';

interface ResultsAnalysisSectionProps {
  conditionCards: ResultsConditionCard[];
  focusedConditionId: number | null;
  focusedCondition: OrderConditionSummary | null;
  focusedConditionAnalysis: FullConditionRoundsGroup | null | undefined;
  focusConditionLabel: string;
  overviewResultSource: string;
  metricLabelMap: Map<string, string>;
  isResultsLoading: boolean;
  onSelectCondition: (conditionId: number) => void;
}

export const ResultsAnalysisSection: React.FC<ResultsAnalysisSectionProps> = ({
  conditionCards,
  focusedConditionId,
  focusedCondition,
  focusedConditionAnalysis,
  focusConditionLabel,
  overviewResultSource,
  metricLabelMap,
  isResultsLoading,
  onSelectCondition,
}) => (
  <div className="space-y-6">
    <Card className="shadow-none">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
            <ScanSearch className="h-4 w-4 text-brand-500" />
            <span>数据分析入口</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            分析页一次只聚焦一个工况，默认拉取该工况完整轮次，用于图表、报告和数据预览。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {conditionCards.map(condition => (
            <Button
              key={condition.id}
              type="button"
              variant={condition.id === focusedConditionId ? 'primary' : 'outline'}
              onClick={() => onSelectCondition(condition.id)}
              className="rounded-full"
            >
              {condition.label}
            </Button>
          ))}
        </div>
      </div>
    </Card>

    <ConditionAnalysisWorkbench
      condition={focusedConditionAnalysis?.orderCondition || focusedCondition || null}
      conditionTitle={focusConditionLabel}
      rounds={focusedConditionAnalysis?.rounds || []}
      resultSource={focusedConditionAnalysis?.resultSource || overviewResultSource}
      total={focusedConditionAnalysis?.total || focusedCondition?.roundTotal || 0}
      loading={isResultsLoading}
      sampled={focusedConditionAnalysis?.sampled || false}
      metricLabelMap={metricLabelMap}
    />
  </div>
);
