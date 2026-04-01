import React from 'react';
import { Button, Card } from '@/components/ui';

interface ResultsErrorSectionProps {
  title: string;
  message: string;
  retryLabel: string;
  onRetry: () => void;
}

export const ResultsErrorSection: React.FC<ResultsErrorSectionProps> = ({
  title,
  message,
  retryLabel,
  onRetry,
}) => (
  <Card className="border-red-200 bg-red-50 text-red-700 shadow-none">
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm">{message}</div>
      </div>
      <Button variant="outline" onClick={onRetry}>
        {retryLabel}
      </Button>
    </div>
  </Card>
);
