import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { Badge, Tabs } from '@/components/ui';
import type { ResultsStatusMeta, ResultsSummaryCard } from './types';

interface ResultsHeaderSectionProps {
  showBackLink: boolean;
  backLabel: string;
  displayOrderId: string;
  sourceVariant: 'warning' | 'success';
  sourceLabel: string;
  orderStatusMeta: ResultsStatusMeta;
  derivedOrderProgress: number;
  summaryCards: ResultsSummaryCard[];
  focusedLabel?: string | null;
  tabs: Array<{ key: string; label: string; icon: React.ReactNode }>;
  activeTab: string;
  onTabChange: (key: string) => void;
  onOpenEdit?: () => void;
}

export const ResultsHeaderSection: React.FC<ResultsHeaderSectionProps> = ({
  showBackLink,
  backLabel,
  displayOrderId,
  sourceVariant,
  sourceLabel,
  orderStatusMeta,
  derivedOrderProgress,
  summaryCards,
  focusedLabel,
  tabs,
  activeTab,
  onTabChange,
  onOpenEdit,
}) => (
  <section className="overflow-hidden rounded-xl border border-border bg-card/95 px-4 py-2.5 shadow-sm">
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {showBackLink && (
            <Link
              to="/orders"
              className="inline-flex items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
              title={backLabel}
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
          )}

          <div className="flex items-center gap-1.5 text-base font-semibold text-foreground">
            <span className="font-normal text-muted-foreground">结果总览</span>
            <span className="font-normal text-border">/</span>
            {onOpenEdit ? (
              <button
                onClick={onOpenEdit}
                className="font-mono text-brand-600 transition-colors hover:text-brand-700 hover:underline"
              >
                {displayOrderId}
              </button>
            ) : (
              <span className="font-mono">{displayOrderId}</span>
            )}
          </div>

          <div className="hidden h-4 w-px bg-border sm:block" />

          <div className="flex items-center gap-1.5">
            <Badge
              variant={sourceVariant}
              size="sm"
              className="h-5 px-1.5 py-0 text-[10px] font-medium leading-5"
            >
              {sourceLabel}
            </Badge>
            <Badge
              variant={orderStatusMeta.variant}
              size="sm"
              className="h-5 px-1.5 py-0 text-[10px] font-medium leading-5"
            >
              {orderStatusMeta.label}
            </Badge>
            <Badge
              variant="info"
              size="sm"
              className="h-5 px-1.5 py-0 text-[10px] font-medium leading-5"
            >
              进度 {derivedOrderProgress}%
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-5">
          {summaryCards.map(card => (
            <div key={card.label} className="flex items-center gap-1.5">
              <span className="hidden scale-90 text-muted-foreground sm:inline-flex">
                {card.icon}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-muted-foreground">{card.label}</span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {card.value}
                </span>
              </div>
            </div>
          ))}
          {focusedLabel ? (
            <>
              <div className="hidden h-4 w-px bg-border sm:block" />
              <div
                className="hidden max-w-[200px] truncate text-xs text-muted-foreground sm:block"
                title={focusedLabel}
              >
                当前工况：{focusedLabel}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex items-center">
        <Tabs
          items={tabs}
          activeKey={activeTab}
          onChange={onTabChange}
          variant="pills"
          className="inline-flex w-auto rounded-lg border border-border bg-background shadow-sm"
        />
      </div>
    </div>
  </section>
);
