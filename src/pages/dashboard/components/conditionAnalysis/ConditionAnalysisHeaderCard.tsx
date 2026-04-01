import React, { startTransition } from 'react';
import { ScanSearch } from 'lucide-react';
import { Card, Input, Select } from '@/components/ui';
import type { ChartType, StylePreset, ThreeDViewMode } from './conditionAnalysisTypes';

type AxisOption = { value: string; label: string };

type ConditionAnalysisHeaderCardProps = {
  resolvedConditionTitle: string;
  headerBadges: string[];
  is3DChart: boolean;
  chartType: ChartType;
  stylePreset: StylePreset;
  sampleLimit: string;
  xField: string;
  yField: string;
  zField: string;
  chartTitle: string;
  currentYLabel: string;
  threeDViewMode: ThreeDViewMode;
  axisOptions: AxisOption[];
  chartOptions: Array<{ value: ChartType; label: string }>;
  styleOptions: Array<{ value: StylePreset; label: string }>;
  sampleOptions: Array<{ value: string; label: string }>;
  threeDViewOptions: Array<{ value: ThreeDViewMode; label: string }>;
  onChartTypeChange: (value: ChartType) => void;
  onStylePresetChange: (value: StylePreset) => void;
  onSampleLimitChange: (value: string) => void;
  onXFieldChange: (value: string) => void;
  onYFieldChange: (value: string) => void;
  onZFieldChange: (value: string) => void;
  onChartTitleChange: (value: string) => void;
  onThreeDViewModeChange: (value: ThreeDViewMode) => void;
};

export const ConditionAnalysisHeaderCard: React.FC<ConditionAnalysisHeaderCardProps> = ({
  resolvedConditionTitle,
  headerBadges,
  is3DChart,
  chartType,
  stylePreset,
  sampleLimit,
  xField,
  yField,
  zField,
  chartTitle,
  currentYLabel,
  threeDViewMode,
  axisOptions,
  chartOptions,
  styleOptions,
  sampleOptions,
  threeDViewOptions,
  onChartTypeChange,
  onStylePresetChange,
  onSampleLimitChange,
  onXFieldChange,
  onYFieldChange,
  onZFieldChange,
  onChartTitleChange,
  onThreeDViewModeChange,
}) => (
  <Card className="shadow-none">
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
            <ScanSearch className="h-4 w-4 text-brand-500" />
            <span>工况分析工作台</span>
          </div>
          <div className="text-xl font-semibold text-slate-900 dark:text-white">
            {resolvedConditionTitle}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            分析页仅围绕当前工况展开，组合校验和来源信息统一收敛到下方信息区，避免页面信息重复堆叠。
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
          {headerBadges.map(item => (
            <span key={item} className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div
        className={`grid gap-4 md:grid-cols-2 ${is3DChart ? 'xl:grid-cols-7' : 'xl:grid-cols-5'}`}
      >
        <Select
          label="图形类型"
          value={chartType}
          options={chartOptions}
          onChange={event =>
            startTransition(() => onChartTypeChange(event.target.value as ChartType))
          }
        />
        <Select
          label="X 轴"
          value={xField}
          options={axisOptions}
          onChange={event => startTransition(() => onXFieldChange(event.target.value))}
        />
        <Select
          label="Y 轴"
          value={yField}
          options={axisOptions}
          onChange={event => startTransition(() => onYFieldChange(event.target.value))}
        />
        {is3DChart ? (
          <Select
            label="Z 轴"
            value={zField}
            options={axisOptions}
            onChange={event => startTransition(() => onZFieldChange(event.target.value))}
          />
        ) : null}
        {is3DChart ? (
          <Select
            label="视图"
            value={threeDViewMode}
            options={threeDViewOptions}
            onChange={event =>
              startTransition(() => onThreeDViewModeChange(event.target.value as ThreeDViewMode))
            }
          />
        ) : null}
        <Select
          label="样式"
          value={stylePreset}
          options={styleOptions}
          onChange={event =>
            startTransition(() => onStylePresetChange(event.target.value as StylePreset))
          }
        />
        <Select
          label="点位上限"
          value={sampleLimit}
          options={sampleOptions}
          onChange={event => startTransition(() => onSampleLimitChange(event.target.value))}
        />
      </div>

      <Input
        label="图表标题"
        value={chartTitle}
        onChange={event => onChartTitleChange(event.target.value)}
        placeholder={`${currentYLabel} 分析`}
      />
    </div>
  </Card>
);
