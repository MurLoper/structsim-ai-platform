import type { OrderConditionSummary, RoundItem } from '@/api/results';
import type { FlatRoundRow, NumericFieldOption } from './conditionAnalysisTypes';

export const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const formatNumber = (value: number | null, digits = 3) =>
  value === null || !Number.isFinite(value) ? '--' : value.toFixed(digits);

export const resolveConditionTitle = (
  condition: OrderConditionSummary | null,
  fallbackTitle?: string
) => {
  if (fallbackTitle) return fallbackTitle;
  if (!condition) return '工况分析';
  const fold = condition.foldTypeName || `目标姿态#${condition.foldTypeId ?? '-'}`;
  const sim = condition.simTypeName || `仿真类型#${condition.simTypeId ?? '-'}`;
  return `工况 / ${fold} / ${sim}`;
};

export const buildFlatRows = (rounds: RoundItem[]): FlatRoundRow[] =>
  rounds.map(round => {
    const params = Object.entries(round.paramValues || {}).reduce<Record<string, number>>(
      (acc, [key, value]) => {
        const numeric = toNumber(value);
        if (numeric !== null) {
          acc[key] = numeric;
        }
        return acc;
      },
      {}
    );

    const outputs = Object.entries(round.outputResults || {}).reduce<Record<string, number>>(
      (acc, [key, value]) => {
        const numeric = toNumber(value);
        if (numeric !== null) {
          acc[key] = numeric;
        }
        return acc;
      },
      {}
    );

    const outputOrigins = Object.entries(
      round.outputOriginResults || round.outputResults || {}
    ).reduce<Record<string, number>>((acc, [key, value]) => {
      const numeric = toNumber(value);
      if (numeric !== null) {
        acc[key] = numeric;
      }
      return acc;
    }, {});

    const outputFinals = Object.entries(round.outputFinalResults || {}).reduce<
      Record<string, number>
    >((acc, [key, value]) => {
      const numeric = toNumber(value);
      if (numeric !== null) {
        acc[key] = numeric;
      }
      return acc;
    }, {});

    return {
      id: String(round.id),
      roundIndex: round.roundIndex,
      status: round.status,
      process: Number(round.progress || 0),
      finalResult: toNumber(round.finalResult),
      params,
      outputs,
      outputOrigins,
      outputFinals,
    };
  });

export const sampleRows = (rows: FlatRoundRow[], maxPoints: number) => {
  if (rows.length <= maxPoints) return rows;
  const step = Math.ceil(rows.length / maxPoints);
  return rows.filter((_, index) => index % step === 0);
};

export const buildFieldOptions = (
  rows: FlatRoundRow[],
  metricLabelMap: Map<string, string>
): NumericFieldOption[] => {
  const options: NumericFieldOption[] = [
    { key: 'roundIndex', label: '轮次', group: 'base' },
    { key: 'process', label: '进度', group: 'base' },
  ];

  if (rows.some(row => row.finalResult !== null)) {
    options.push({ key: 'finalResult', label: '综合结果', group: 'output' });
  }

  const paramKeys = new Set<string>();
  const outputKeys = new Set<string>();

  rows.forEach(row => {
    Object.keys(row.params).forEach(key => paramKeys.add(key));
    Object.keys(row.outputs).forEach(key => outputKeys.add(key));
  });

  Array.from(paramKeys)
    .sort()
    .forEach(key => {
      options.push({ key: `param:${key}`, label: `参数 / ${key}`, group: 'param' });
    });

  Array.from(outputKeys)
    .sort()
    .forEach(key => {
      options.push({
        key: `output:${key}`,
        label: `输出 / ${metricLabelMap.get(key) || key}`,
        group: 'output',
      });
    });

  return options;
};

export const getNumericValue = (row: FlatRoundRow, key: string): number | null => {
  if (key === 'roundIndex') return row.roundIndex;
  if (key === 'process') return row.process;
  if (key === 'finalResult') return row.finalResult;
  if (key.startsWith('param:')) {
    return row.params[key.replace('param:', '')] ?? null;
  }
  if (key.startsWith('output:')) {
    return row.outputs[key.replace('output:', '')] ?? null;
  }
  return null;
};

export const buildAxisOptions = (fields: NumericFieldOption[]) =>
  fields.map(field => ({
    value: field.key,
    label: field.label,
  }));
