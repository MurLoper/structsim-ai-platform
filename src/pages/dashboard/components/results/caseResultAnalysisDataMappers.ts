import type { TranslationParams } from '@/locales';
import type { FlatRoundRow } from '../conditionAnalysis/conditionAnalysisTypes';
import type { ConditionRoundsGroup } from '../../hooks/resultsAnalysisTypes';
import { getBaseAxisOptions, type FieldOption } from './caseResultAnalysisOptions';

type Translator = (key: string, params?: TranslationParams) => string;

export const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const getFiniteRange = (values: number[]) => {
  const finiteValues = values.filter(value => Number.isFinite(value));
  if (!finiteValues.length) return null;
  const min = Math.min(...finiteValues);
  const max = Math.max(...finiteValues);
  if (min === max) {
    const padding = Math.max(Math.abs(min) * 0.05, 1);
    return { min: min - padding, max: max + padding };
  }
  return { min, max };
};

export const formatNumber = (value: number | null) =>
  value === null || !Number.isFinite(value) ? '--' : Number(value.toFixed(4));

export const sampleRows = (rows: FlatRoundRow[], maxPoints: number) => {
  if (rows.length <= maxPoints) return rows;
  const step = Math.ceil(rows.length / maxPoints);
  return rows.filter((_, index) => index % step === 0);
};

export const getNumericValue = (row: FlatRoundRow, key: string): number | null => {
  if (key === 'roundIndex') return row.roundIndex;
  if (key === 'process') return row.process;
  if (key === 'finalResult') return row.finalResult;
  if (key.startsWith('param:')) return row.params[key.replace('param:', '')] ?? null;
  if (key.startsWith('outputOrigin:'))
    return row.outputOrigins[key.replace('outputOrigin:', '')] ?? null;
  if (key.startsWith('outputFinal:'))
    return row.outputFinals[key.replace('outputFinal:', '')] ?? null;
  if (key.startsWith('output:')) return row.outputs[key.replace('output:', '')] ?? null;
  return null;
};

export const formatThreeDTooltip = (
  params: unknown,
  xLabel: string,
  yLabel: string,
  zLabel: string
) => {
  const value = (params as { value?: unknown })?.value;
  const tuple = Array.isArray(value) ? value : [];
  return `${xLabel}: ${formatNumber(toNumber(tuple[0]))}<br/>${yLabel}: ${formatNumber(
    toNumber(tuple[1])
  )}<br/>${zLabel}: ${formatNumber(toNumber(tuple[2]))}`;
};

export const buildAxisOptions = (rows: FlatRoundRow[], t: Translator): FieldOption[] => {
  const options: FieldOption[] = getBaseAxisOptions(t);

  if (rows.some(row => row.finalResult !== null)) {
    options.push({
      value: 'finalResult',
      label: t('res.analysis.axis.final_result'),
      group: 'output',
    });
  }

  const paramKeys = new Set<string>();
  const outputOriginKeys = new Set<string>();
  const outputFinalKeys = new Set<string>();

  rows.forEach(row => {
    Object.keys(row.params).forEach(key => paramKeys.add(key));
    Object.keys(row.outputOrigins).forEach(key => outputOriginKeys.add(key));
    Object.keys(row.outputFinals).forEach(key => outputFinalKeys.add(key));
  });

  Array.from(paramKeys)
    .sort()
    .forEach(key => {
      options.push({
        value: `param:${key}`,
        label: t('res.analysis.axis.param', { name: key }),
        group: 'param',
      });
    });

  Array.from(outputOriginKeys)
    .sort()
    .forEach(key => {
      options.push({
        value: `outputOrigin:${key}`,
        label: t('res.analysis.axis.output_origin', { name: key }),
        group: 'output',
      });
    });

  Array.from(outputFinalKeys)
    .sort()
    .forEach(key => {
      options.push({
        value: `outputFinal:${key}`,
        label: t('res.analysis.axis.output_final', { name: key }),
        group: 'output',
      });
    });

  return options;
};

export const flattenCaseResultRows = (roundGroups: ConditionRoundsGroup[]): FlatRoundRow[] =>
  roundGroups.flatMap(group => {
    return group.rounds.map(round => {
      const params = Object.entries(round.paramValues || {}).reduce<Record<string, number>>(
        (acc, [key, value]) => {
          const numeric = toNumber(value);
          if (numeric !== null) acc[key] = numeric;
          return acc;
        },
        {}
      );
      const outputs = Object.entries(round.outputResults || {}).reduce<Record<string, number>>(
        (acc, [key, value]) => {
          const numeric = toNumber(value);
          if (numeric !== null) acc[key] = numeric;
          return acc;
        },
        {}
      );
      const outputOrigins = Object.entries(round.outputOriginResults || {}).reduce<
        Record<string, number>
      >((acc, [key, value]) => {
        const numeric = toNumber(value);
        if (numeric !== null) acc[key] = numeric;
        return acc;
      }, {});
      const outputFinals = Object.entries(round.outputFinalResults || {}).reduce<
        Record<string, number>
      >((acc, [key, value]) => {
        const numeric = toNumber(value);
        if (numeric !== null) acc[key] = numeric;
        return acc;
      }, {});

      return {
        id: `${group.conditionId}-${round.id}`,
        roundIndex: Number(round.roundIndex || 0),
        status: Number(round.status || 0),
        process: Number(round.progress || 0),
        finalResult: toNumber(round.finalResult),
        params,
        outputs,
        outputOrigins,
        outputFinals,
      };
    });
  });
