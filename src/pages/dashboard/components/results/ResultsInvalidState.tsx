import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button, Card } from '@/components/ui';

interface ResultsInvalidStateProps {
  backLabel: string;
  orderIdLabel: string;
  title: string;
  description: string;
  errorDescription: string;
  onBack: () => void;
}

export const ResultsInvalidState: React.FC<ResultsInvalidStateProps> = ({
  backLabel,
  orderIdLabel,
  title,
  description,
  errorDescription,
  onBack,
}) => (
  <div className="animate-fade-in space-y-6">
    <Card className="rounded-[24px] border border-slate-200 bg-white/95 shadow-none">
      <div className="flex flex-col gap-6 p-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {backLabel}
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{orderIdLabel}</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">{description}</p>
          </div>
        </div>
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="text-sm text-slate-600">{errorDescription}</div>
          <Button className="mt-4" variant="secondary" onClick={onBack}>
            {backLabel}
          </Button>
        </div>
      </div>
    </Card>
  </div>
);
