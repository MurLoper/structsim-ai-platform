import type { ConditionRoundsGroup } from '../../hooks/resultsAnalysisTypes';
import type { MatrixAttachment, MatrixValue, PreviewItem } from './caseResultMatrixTypes';
import { buildCaseResultAssetUrl } from './caseResultAssetUrl';

export const buildOutputKeysByCondition = (roundGroups: ConditionRoundsGroup[]) => {
  const keysByCondition = new Map<number, string[]>();
  roundGroups.forEach(group => {
    const seen = new Set<string>();
    group.rounds.forEach(round => {
      Object.keys(round.outputResults || {}).forEach(key => seen.add(key));
    });
    keysByCondition.set(group.conditionId, Array.from(seen));
  });
  return keysByCondition;
};

export const normalizeCellValue = (value: unknown): MatrixValue => {
  if (typeof value === 'number' || typeof value === 'string') return value;
  if (value === null || value === undefined) return null;
  return String(value);
};

export const getFirstPresent = (...values: unknown[]): MatrixValue => {
  const value = values.find(item => item !== undefined && item !== null && item !== '');
  return normalizeCellValue(value);
};

export const collectSortedKeys = (
  roundGroups: ConditionRoundsGroup[],
  selector: (group: ConditionRoundsGroup) => Array<Record<string, unknown> | null | undefined>
) => {
  const seen = new Set<string>();
  roundGroups.forEach(group => {
    selector(group).forEach(record => {
      Object.keys(record || {}).forEach(key => seen.add(key));
    });
  });
  return Array.from(seen);
};

export const buildPreviewItems = (attachment: MatrixAttachment | null): PreviewItem[] => {
  if (!attachment) return [];
  return [
    ...(attachment.imagePaths || []).map(path => ({
      type: 'image' as const,
      path,
      url: buildCaseResultAssetUrl(path),
    })),
    ...(attachment.aviPaths || []).map(path => ({
      type: 'gif' as const,
      path,
      url: buildCaseResultAssetUrl(path),
    })),
  ];
};
