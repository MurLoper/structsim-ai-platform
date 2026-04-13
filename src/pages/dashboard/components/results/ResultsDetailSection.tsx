import React from 'react';
import type { OrderCaseResult } from '@/api/results';
import { useI18n } from '@/hooks/useI18n';
import type { ConditionRoundsGroup } from '../../hooks/resultsAnalysisTypes';
import { CaseResultMatrixTable } from './CaseResultMatrixTable';
import type { ResultsCaseCard, ResultsConditionCard } from './types';

interface ResultsDetailSectionProps {
  resultCases: OrderCaseResult[];
  activeCaseId: number | null;
  activeCaseRoundGroups: ConditionRoundsGroup[];
  activeCaseConditionCards: ResultsConditionCard[];
  caseCards: ResultsCaseCard[];
  isResultsLoading: boolean;
  onSelectCase: (caseId: number) => void;
}

const buildCaseLabel = (caseItem: OrderCaseResult) =>
  caseItem.caseName || `case-${caseItem.caseIndex || caseItem.id}`;

export const ResultsDetailSection: React.FC<ResultsDetailSectionProps> = ({
  resultCases,
  activeCaseId,
  activeCaseRoundGroups,
  activeCaseConditionCards,
  caseCards,
  isResultsLoading,
  onSelectCase,
}) => {
  const { t } = useI18n();
  const activeCase = resultCases.find(item => item.id === activeCaseId) || resultCases[0] || null;
  const activeCaseLabel = activeCase ? buildCaseLabel(activeCase) : t('res.case.fallback');
  const activeCaseStats = caseCards.find(item => item.id === activeCase?.id) || null;

  return (
    <CaseResultMatrixTable
      caseLabel={activeCaseLabel}
      caseCards={caseCards}
      activeCaseId={activeCaseId}
      activeCaseStats={activeCaseStats}
      conditionCards={activeCaseConditionCards}
      roundGroups={activeCaseRoundGroups}
      loading={isResultsLoading}
      onSelectCase={onSelectCase}
    />
  );
};
