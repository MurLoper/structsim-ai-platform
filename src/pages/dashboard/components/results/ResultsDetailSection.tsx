import React from 'react';
import { Button, Card } from '@/components/ui';
import { FileStack } from 'lucide-react';
import type { OrderCaseResult } from '@/api/results';
import type {
  ConditionRoundsGroup,
  FullConditionRoundsGroup,
} from '../../hooks/resultsAnalysisTypes';
import { ConditionAnalysisWorkbench } from '../ConditionAnalysisWorkbench';
import { CaseResultMatrixTable } from './CaseResultMatrixTable';
import type { ResultsConditionCard } from './types';

interface ResultsDetailSectionProps {
  resultCases: OrderCaseResult[];
  activeCaseId: number | null;
  activeCaseRoundGroups: ConditionRoundsGroup[];
  activeCaseConditionCards: ResultsConditionCard[];
  focusedConditionAnalysis: FullConditionRoundsGroup | null | undefined;
  focusConditionLabel: string;
  overviewResultSource: string;
  metricLabelMap: Map<string, string>;
  isResultsLoading: boolean;
  onSelectCase: (caseId: number) => void;
}

const buildCaseLabel = (caseItem: OrderCaseResult) =>
  caseItem.caseName || `方案 ${caseItem.caseIndex || caseItem.id}`;

export const ResultsDetailSection: React.FC<ResultsDetailSectionProps> = ({
  resultCases,
  activeCaseId,
  activeCaseRoundGroups,
  activeCaseConditionCards,
  focusedConditionAnalysis,
  focusConditionLabel,
  overviewResultSource,
  metricLabelMap,
  isResultsLoading,
  onSelectCase,
}) => {
  const activeCase = resultCases.find(item => item.id === activeCaseId) || resultCases[0] || null;
  const activeCaseLabel = activeCase ? buildCaseLabel(activeCase) : '当前方案';

  return (
    <div className="space-y-6">
      <Card className="shadow-none">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FileStack className="h-4 w-4 text-brand-500" />
              <span>方案切换</span>
            </div>
            <p className="text-sm text-muted-foreground">
              结果页按申请单方案查看：一个 case 对应一个外部 job，工况输出在同一张明细矩阵中展开。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {resultCases.map(caseItem => (
              <Button
                key={caseItem.id}
                type="button"
                variant={caseItem.id === activeCaseId ? 'primary' : 'outline'}
                onClick={() => onSelectCase(caseItem.id)}
                className="rounded-full"
              >
                {buildCaseLabel(caseItem)}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <CaseResultMatrixTable
        caseLabel={activeCaseLabel}
        conditionCards={activeCaseConditionCards}
        roundGroups={activeCaseRoundGroups}
        loading={isResultsLoading}
      />

      <ConditionAnalysisWorkbench
        condition={
          focusedConditionAnalysis?.orderCondition ||
          activeCaseRoundGroups[0]?.orderCondition ||
          null
        }
        conditionTitle={focusConditionLabel}
        rounds={activeCaseRoundGroups.flatMap(group => group.rounds)}
        resultSource={focusedConditionAnalysis?.resultSource || overviewResultSource}
        total={activeCaseRoundGroups.reduce((sum, group) => sum + group.total, 0)}
        loading={isResultsLoading}
        sampled={false}
        metricLabelMap={metricLabelMap}
      />
    </div>
  );
};
