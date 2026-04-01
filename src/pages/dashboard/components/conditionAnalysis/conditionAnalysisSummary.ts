import type { AnalysisSummary, FlatRoundRow, NumericFieldOption } from './conditionAnalysisTypes';
import { getNumericValue } from './conditionAnalysisFields';

export const calculateCorrelation = (pairs: Array<[number, number]>) => {
  if (pairs.length < 3) return 0;
  const xAvg = pairs.reduce((sum, item) => sum + item[0], 0) / pairs.length;
  const yAvg = pairs.reduce((sum, item) => sum + item[1], 0) / pairs.length;
  let numerator = 0;
  let xDenominator = 0;
  let yDenominator = 0;

  pairs.forEach(([x, y]) => {
    const xDiff = x - xAvg;
    const yDiff = y - yAvg;
    numerator += xDiff * yDiff;
    xDenominator += xDiff * xDiff;
    yDenominator += yDiff * yDiff;
  });

  if (xDenominator <= 0 || yDenominator <= 0) return 0;
  return numerator / Math.sqrt(xDenominator * yDenominator);
};

export const buildSummary = (
  rows: FlatRoundRow[],
  yField: string,
  fieldOptions: NumericFieldOption[]
): AnalysisSummary => {
  const values = rows
    .map(row => ({ row, value: getNumericValue(row, yField) }))
    .filter((item): item is { row: FlatRoundRow; value: number } => item.value !== null);

  if (values.length === 0) {
    return {
      min: null,
      max: null,
      avg: null,
      spread: null,
      best: null,
      worst: null,
      strongestParam: null,
    };
  }

  let minEntry = values[0];
  let maxEntry = values[0];
  let total = 0;

  values.forEach(item => {
    if (item.value < minEntry.value) minEntry = item;
    if (item.value > maxEntry.value) maxEntry = item;
    total += item.value;
  });

  const paramFields = fieldOptions.filter(option => option.group === 'param');
  let strongestParam: AnalysisSummary['strongestParam'] = null;

  paramFields.forEach(field => {
    const pairs = rows
      .map(row => {
        const xValue = getNumericValue(row, field.key);
        const yValue = getNumericValue(row, yField);
        return xValue !== null && yValue !== null ? ([xValue, yValue] as [number, number]) : null;
      })
      .filter((item): item is [number, number] => Array.isArray(item));
    const score = Math.abs(calculateCorrelation(pairs));
    if (!strongestParam || score > strongestParam.score) {
      strongestParam = { key: field.key, label: field.label, score };
    }
  });

  return {
    min: minEntry.value,
    max: maxEntry.value,
    avg: total / values.length,
    spread: maxEntry.value - minEntry.value,
    best: minEntry.row,
    worst: maxEntry.row,
    strongestParam,
  };
};
