import React from 'react';
import type { EChartsOption } from 'echarts';
import { ChartColumnBig } from 'lucide-react';
import { BaseChart } from '@/components/charts';
import { Card } from '@/components/ui';

type ConditionAnalysisChartCardProps = {
  chartInstanceKey: string;
  option: EChartsOption;
  loading: boolean;
};

export const ConditionAnalysisChartCard: React.FC<ConditionAnalysisChartCardProps> = ({
  chartInstanceKey,
  option,
  loading,
}) => (
  <Card className="shadow-none">
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
        <ChartColumnBig className="h-4 w-4 text-brand-500" />
        <span>自定义图形</span>
      </div>
      <BaseChart key={chartInstanceKey} option={option} height={520} loading={loading} largeData />
    </div>
  </Card>
);
