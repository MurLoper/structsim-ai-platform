import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error';

export interface ResultsStatusMeta {
  label: string;
  variant: BadgeVariant;
}

export interface ResultsSummaryCard {
  icon: React.ReactNode;
  label: string;
  value: number;
}

export interface ResultsConditionCard {
  id: number;
  caseId?: number | null;
  caseIndex?: number | null;
  label: string;
  shortLabel: string;
  totalRounds: number;
  completedRounds: number;
  failedRounds: number;
  progress: number;
  status: number;
  canResubmit?: boolean;
  statusMeta: ResultsStatusMeta;
}

export interface ResultsCaseCard {
  id: number;
  label: string;
  conditionCount: number;
  totalRounds: number;
  completedRounds: number;
  failedRounds: number;
  runningRounds: number;
  progress: number;
  status: number;
  statusMeta: ResultsStatusMeta;
  conditionLabels: string[];
}
