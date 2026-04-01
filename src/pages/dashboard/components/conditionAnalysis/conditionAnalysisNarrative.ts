import type { OrderConditionSummary } from '@/api/results';
import type { AnalysisSummary } from './conditionAnalysisTypes';
import { formatNumber } from './conditionAnalysisFields';

export const buildConditionAnalysisNarrative = ({
  currentYLabel,
  total,
  sampledRowCount,
  summary,
}: {
  currentYLabel: string;
  total: number;
  sampledRowCount: number;
  summary: AnalysisSummary;
}) => {
  const lines = [
    `当前以 ${currentYLabel} 作为分析目标，覆盖 ${total.toLocaleString()} 轮结果，绘图采样 ${sampledRowCount.toLocaleString()} 点。`,
    `最优轮次 #${summary.best?.roundIndex ?? '--'}，最差轮次 #${summary.worst?.roundIndex ?? '--'}，均值 ${formatNumber(summary.avg)}，波动跨度 ${formatNumber(summary.spread)}。`,
  ];

  if (summary.strongestParam) {
    lines.push(
      `${summary.strongestParam.label} 与 ${currentYLabel} 的线性相关性当前最强，|r|=${summary.strongestParam.score.toFixed(3)}。`
    );
  } else {
    lines.push('当前样本不足以给出稳定的参数敏感性判断。');
  }

  return lines;
};

export const buildConditionHeaderBadges = ({
  condition,
  resultSource,
  sampled,
}: {
  condition: OrderConditionSummary | null;
  resultSource: string;
  sampled: boolean;
}) =>
  [
    condition?.conditionId ? `工况ID ${condition.conditionId}` : null,
    condition?.solverId ? `求解器 ${condition.solverId}` : null,
    `结果源 ${String(resultSource).toUpperCase()}`,
    sampled ? '当前数据已采样' : '当前数据为完整轮次',
  ].filter((value): value is string => Boolean(value));
