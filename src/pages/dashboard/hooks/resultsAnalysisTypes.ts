import type {
  ModuleDetail,
  OrderConditionRoundColumn,
  OrderCaseResult,
  OrderConditionRoundsResponse,
  OrderConditionSummary,
  RoundItem,
  SimTypeResult as ConditionResultSummary,
} from '@/api/results';

export interface ResultRecord {
  iteration: number;
  conditionId: number;
  metricKey: string;
  value: number;
  conditionName: string;
}

export interface ConditionRoundsGroup {
  conditionId: number;
  caseId?: number | null;
  caseIndex?: number | null;
  rounds: RoundItem[];
  orderCondition: OrderConditionSummary;
  resultSource: string;
  columns: OrderConditionRoundColumn[];
  statistics?: OrderConditionRoundsResponse['statistics'];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type ResultCaseGroup = OrderCaseResult;

export interface FullConditionRoundsGroup extends ConditionRoundsGroup {
  sampled: boolean;
}

export interface ConditionRoundPagingState {
  page: number;
  pageSize: number;
}

export interface ResultsOverviewStats {
  conditionCount: number;
  totalRounds: number;
  completedRounds: number;
  failedRounds: number;
  runningRounds: number;
  resultSource: string;
  runningModules: string[];
}

export type ConditionResultsSummary = ConditionResultSummary;
export type ResultModuleDetail = ModuleDetail;

export const RESULTS_ANALYSIS_PAGE_SIZE = 20000;
