import { useEffect, useMemo, useState } from 'react';
import type { EChartsOption } from 'echarts';
import { Card } from '@/components/ui';
import { BaseChart } from '@/components/charts';
import type { ConditionRoundsGroup } from '../../hooks/resultsAnalysisTypes';
import type { ResultsConditionCard } from './types';

interface CaseResultAnalysisPanelProps {
  conditionCards: ResultsConditionCard[];
  roundGroups: ConditionRoundsGroup[];
  loading?: boolean;
}

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getConditionLabel = (
  conditionLabelMap: Map<number, string>,
  group: ConditionRoundsGroup,
  index: number
) => conditionLabelMap.get(group.conditionId) || `工况 ${index + 1}`;

export const CaseResultAnalysisPanel: React.FC<CaseResultAnalysisPanelProps> = ({
  conditionCards,
  roundGroups,
  loading = false,
}) => {
  const conditionLabelMap = useMemo(
    () => new Map(conditionCards.map(item => [item.id, item.label])),
    [conditionCards]
  );

  const outputKeys = useMemo(() => {
    const seen = new Set<string>();
    roundGroups.forEach(group => {
      group.rounds.forEach(round => {
        Object.keys(round.outputResults || {}).forEach(key => seen.add(key));
      });
    });
    return Array.from(seen);
  }, [roundGroups]);

  const metricOptions = useMemo(
    () => [
      { value: 'finalResult', label: '最终结果' },
      ...outputKeys.map(key => ({ value: key, label: key })),
    ],
    [outputKeys]
  );

  const [selectedMetric, setSelectedMetric] = useState('finalResult');

  useEffect(() => {
    if (metricOptions.some(option => option.value === selectedMetric)) return;
    setSelectedMetric(metricOptions[0]?.value || 'finalResult');
  }, [metricOptions, selectedMetric]);

  const trendRows = useMemo(() => {
    return roundGroups.flatMap((group, groupIndex) => {
      const conditionName = getConditionLabel(conditionLabelMap, group, groupIndex);
      return group.rounds.flatMap(round => {
        const rawValue =
          selectedMetric === 'finalResult'
            ? round.finalResult
            : round.outputResults?.[selectedMetric];
        const value = toNumber(rawValue);
        if (value === null) return [];
        return {
          round: `#${round.roundIndex}`,
          roundIndex: Number(round.roundIndex || 0),
          conditionName,
          value,
        };
      });
    });
  }, [conditionLabelMap, roundGroups, selectedMetric]);

  const statusRows = useMemo(
    () =>
      roundGroups.map((group, groupIndex) => {
        const conditionName = getConditionLabel(conditionLabelMap, group, groupIndex);
        const completed = group.rounds.filter(round => round.status === 2).length;
        const failed = group.rounds.filter(round => round.status === 3).length;
        const running = group.rounds.filter(round => round.status === 1).length;
        return {
          conditionName,
          completed,
          failed,
          running,
        };
      }),
    [conditionLabelMap, roundGroups]
  );

  const trendOption = useMemo<EChartsOption>(() => {
    const conditionNames = Array.from(new Set(trendRows.map(row => row.conditionName)));
    const rounds = Array.from(new Set(trendRows.map(row => row.round))).sort((a, b) => {
      return Number(a.replace('#', '')) - Number(b.replace('#', ''));
    });

    return {
      title: { text: '结果趋势', left: 12, top: 8, textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      legend: { top: 8, right: 12 },
      grid: { top: 58, right: 24, bottom: 44, left: 56, containLabel: true },
      xAxis: { type: 'category', data: rounds, name: '轮次' },
      yAxis: {
        type: 'value',
        name: metricOptions.find(item => item.value === selectedMetric)?.label,
      },
      series: conditionNames.map(conditionName => ({
        name: conditionName,
        type: 'line',
        smooth: true,
        showSymbol: true,
        data: rounds.map(round => {
          const item = trendRows.find(
            row => row.round === round && row.conditionName === conditionName
          );
          return item?.value ?? null;
        }),
      })),
    };
  }, [metricOptions, selectedMetric, trendRows]);

  const statusOption = useMemo<EChartsOption>(() => {
    const conditions = statusRows.map(row => row.conditionName);

    return {
      title: { text: '工况轮次状态', left: 12, top: 8, textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      legend: { top: 8, right: 12 },
      grid: { top: 58, right: 24, bottom: 44, left: 56, containLabel: true },
      xAxis: { type: 'category', data: conditions },
      yAxis: { type: 'value', name: '轮次' },
      series: [
        {
          name: '完成',
          type: 'bar',
          stack: 'rounds',
          data: statusRows.map(row => row.completed),
        },
        {
          name: '运行中',
          type: 'bar',
          stack: 'rounds',
          data: statusRows.map(row => row.running),
        },
        {
          name: '失败',
          type: 'bar',
          stack: 'rounds',
          data: statusRows.map(row => row.failed),
        },
      ],
    };
  }, [statusRows]);

  if (!roundGroups.length) {
    return (
      <Card className="shadow-none">
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          当前方案暂无可分析的结果数据
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-foreground">数据分析</div>
            <div className="mt-1 text-xs text-muted-foreground">
              当前分析只使用已加载的方案结果，不额外请求外部数据库。
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            分析指标
            <select
              value={selectedMetric}
              onChange={event => setSelectedMetric(event.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
            >
              {metricOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
        <Card className="shadow-none">
          <BaseChart option={trendOption} height={360} loading={loading} />
        </Card>
        <Card className="shadow-none">
          <BaseChart option={statusOption} height={360} loading={loading} />
        </Card>
      </div>
    </div>
  );
};
