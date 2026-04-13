import { resultsBaseEn, resultsBaseZh } from './results/base';
import { resultsAnalysisEn, resultsAnalysisZh } from './results/analysis';
import { resultsCaseMatrixEn, resultsCaseMatrixZh } from './results/caseMatrix';

export const resultsEn = {
  ...resultsBaseEn,
  ...resultsAnalysisEn,
  ...resultsCaseMatrixEn,
};

export const resultsZh = {
  ...resultsBaseZh,
  ...resultsAnalysisZh,
  ...resultsCaseMatrixZh,
};
