import { AlgorithmType } from '../types';
import type { FoldType, SimType, ConditionConfig } from '@/types/config';
import type { ParamDomain, OptParams } from '../types';

type ConditionTreeSimType = SimType & {
  isDefault: boolean;
  relSort: number;
  conditionId: number;
};

export interface FoldTypeWithSimTypes {
  id: number;
  name: string;
  code?: string;
  angle?: number;
  simTypes: ConditionTreeSimType[];
}

export interface SelectedSimType {
  conditionId: number;
  foldTypeId: number;
  simTypeId: number;
}

export const resolveGroupAlgorithmType = (algType?: number) => {
  if (algType === AlgorithmType.BAYESIAN || algType === AlgorithmType.DOE_FILE) {
    return algType;
  }
  return AlgorithmType.DOE;
};

export const toCamelKey = (key: string) =>
  key.replace(/_([a-zA-Z])/g, (_, ch: string) => ch.toUpperCase());

export const normalizeDoeDataByHeads = (
  heads: string[],
  rows: Array<Record<string, number | string>>
): Array<Record<string, number | string>> =>
  rows.map(row => {
    const normalized: Record<string, number | string> = {};
    heads.forEach(head => {
      if (row[head] !== undefined) {
        normalized[head] = row[head];
      } else if (row[toCamelKey(head)] !== undefined) {
        normalized[head] = row[toCamelKey(head)];
      } else {
        normalized[head] = '';
      }
    });
    return normalized;
  });

export const buildFoldTypeTree = (
  foldTypes: FoldType[],
  simTypes: SimType[],
  conditionConfigs: ConditionConfig[]
): FoldTypeWithSimTypes[] => {
  if (!foldTypes.length || !simTypes.length) return [];

  const simTypesById = new Map(simTypes.map(simType => [simType.id, simType]));

  return foldTypes.map(foldType => {
    const simTypesForFoldType = conditionConfigs
      .filter(config => config.foldTypeId === foldType.id)
      .sort((a, b) => a.sort - b.sort)
      .flatMap((config, index) => {
        const simType = simTypesById.get(config.simTypeId);
        if (!simType) {
          return [];
        }

        return [
          {
            ...simType,
            isDefault: config.isDefault === 1,
            relSort: config.sort || index * 10,
            conditionId: config.id,
          },
        ];
      });

    return {
      id: foldType.id,
      name: foldType.name,
      code: foldType.code,
      angle: foldType.angle,
      simTypes: simTypesForFoldType,
    };
  });
};

export const collectSafeSimTypes = (
  foldTypeIds: number[],
  conditionTree: FoldTypeWithSimTypes[]
): ConditionTreeSimType[] => {
  if (foldTypeIds.length === 0) {
    return [];
  }

  const foldTypeMap = new Map(conditionTree.map(foldType => [foldType.id, foldType]));
  const seenConditionIds = new Set<number>();
  const mergedSimTypes: ConditionTreeSimType[] = [];

  foldTypeIds.forEach(foldTypeId => {
    const foldType = foldTypeMap.get(foldTypeId);
    if (!foldType) {
      return;
    }

    foldType.simTypes.forEach(simType => {
      if (seenConditionIds.has(simType.conditionId)) {
        return;
      }

      seenConditionIds.add(simType.conditionId);
      mergedSimTypes.push(simType);
    });
  });

  return mergedSimTypes;
};

export const buildDoeCombinations = (domain: ParamDomain[]): Partial<OptParams> => {
  const heads = domain.map(item => item.paramName.trim()).filter(Boolean);
  if (heads.length !== domain.length) {
    return {};
  }

  const valueLists = domain.map(item => {
    if (item.rangeList && item.rangeList.length > 0) {
      return item.rangeList;
    }

    if (item.range) {
      return item.range
        .split(',')
        .map(value => Number(value.trim()))
        .filter(value => !isNaN(value));
    }

    return [];
  });

  if (valueLists.some(list => list.length === 0)) {
    return {};
  }

  const cartesian = (...arrays: number[][]): number[][] =>
    arrays.reduce<number[][]>(
      (acc, array) => acc.flatMap(item => array.map(value => [...item, value])),
      [[]]
    );

  const doeParamData = cartesian(...valueLists).map(combination => {
    const row: Record<string, number | string> = {};
    heads.forEach((head, index) => {
      row[head] = combination[index];
    });
    return row;
  });

  return {
    doeParamHeads: heads,
    doeParamData,
  };
};
