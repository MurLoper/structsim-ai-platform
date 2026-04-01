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
  label: string;
  shortLabel: string;
  totalRounds: number;
  completedRounds: number;
  failedRounds: number;
  progress: number;
  statusMeta: ResultsStatusMeta;
}
