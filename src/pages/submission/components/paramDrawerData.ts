import type { ParamDomain } from '../types';

export type DoeRow = Record<string, number | string>;

export const toCamelKey = (key: string): string =>
  key.replace(/_([a-zA-Z])/g, (_, ch: string) => ch.toUpperCase());

export const getDoeCellValue = (row: DoeRow, head: string): string => {
  const direct = row[head];
  if (direct !== undefined && direct !== null) return String(direct);
  const camel = row[toCamelKey(head)];
  if (camel !== undefined && camel !== null) return String(camel);
  return '';
};

export const normalizeDoeDataByHeads = (
  heads: string[],
  rows: Array<DoeRow | Array<string | number>>
): DoeRow[] =>
  rows.map(row => {
    const normalized: DoeRow = {};
    heads.forEach((head, idx) => {
      if (Array.isArray(row)) {
        const cell = row[idx];
        normalized[head] = cell === undefined || cell === null ? '' : String(cell);
        return;
      }
      normalized[head] = getDoeCellValue(row, head);
    });
    return normalized;
  });

export const buildDoeCombinations = (domain: ParamDomain[]) => {
  const heads = domain.map(d => d.paramName.trim()).filter(Boolean);
  if (heads.length !== domain.length) return null;

  const valueLists = domain.map(d => {
    if (d.rangeList && d.rangeList.length > 0) return d.rangeList;
    if (d.range) {
      return d.range
        .split(',')
        .map((value: string) => Number(value.trim()))
        .filter((value: number) => !isNaN(value));
    }
    return [];
  });
  if (valueLists.some(list => list.length === 0)) return null;

  const cartesian = (...arrays: number[][]): number[][] =>
    arrays.reduce<number[][]>((acc, arr) => acc.flatMap(x => arr.map(y => [...x, y])), [[]]);
  const combinations = cartesian(...valueLists);
  const data: DoeRow[] = combinations.map(combo => {
    const row: DoeRow = {};
    heads.forEach((head, index) => {
      row[head] = combo[index];
    });
    return row;
  });

  return { doeParamHeads: heads, doeParamData: data };
};

export const parseDoeText = (text: string): { heads: string[]; data: DoeRow[] } | null => {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return null;

  const splitLine = (line: string): string[] => {
    const delimiter = line.includes('\t') ? '\t' : ',';
    return line.split(delimiter).map(item => item.trim());
  };

  const heads = splitLine(lines[0]).filter(Boolean);
  if (heads.length === 0) return null;

  const data: DoeRow[] = lines.slice(1).map(line => {
    const values = splitLine(line);
    const row: DoeRow = {};
    heads.forEach((head, idx) => {
      const raw = values[idx] ?? '';
      const num = Number(raw);
      row[head] = raw !== '' && Number.isFinite(num) ? num : raw;
    });
    return row;
  });

  return { heads, data: normalizeDoeDataByHeads(heads, data) };
};

export const mergeDomainWithGroup = (groupDomain: ParamDomain[], currentDomain: ParamDomain[]) => {
  const groupKeySet = new Set(groupDomain.map(item => item.paramName.trim()).filter(Boolean));
  const customDomain = currentDomain.filter(item => {
    const key = item.paramName.trim();
    return key && !groupKeySet.has(key);
  });
  return [...groupDomain, ...customDomain];
};

export const mergeDoeFileByHeads = (
  baseHeads: string[],
  baseData: DoeRow[],
  currentHeads: string[],
  currentData: DoeRow[]
) => {
  const normalizedBaseHeads = baseHeads.map(h => h.trim()).filter(Boolean);
  const normalizedCurrentHeads = currentHeads.map(h => h.trim()).filter(Boolean);
  const mergedHeads = [
    ...normalizedBaseHeads,
    ...normalizedCurrentHeads.filter(h => !normalizedBaseHeads.includes(h)),
  ];
  const rowCount = Math.max(baseData.length, currentData.length);
  const mergedData: DoeRow[] = [];

  for (let index = 0; index < rowCount; index += 1) {
    const baseRow = baseData[index] || {};
    const currentRow = currentData[index] || {};
    const row: DoeRow = {};
    mergedHeads.forEach(head => {
      const hasBase = Object.prototype.hasOwnProperty.call(baseRow, head);
      if (hasBase) {
        row[head] = baseRow[head];
        return;
      }
      if (Object.prototype.hasOwnProperty.call(currentRow, head)) {
        row[head] = currentRow[head];
        return;
      }
      row[head] = '';
    });
    mergedData.push(row);
  }

  return { mergedHeads, mergedData };
};
