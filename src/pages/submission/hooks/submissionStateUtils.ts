import { AlgorithmType, TargetType } from '../types';
import type { FoldType, SimType, ConditionConfig, ParamDef, Solver } from '@/types/config';
import type { ParamGroup, ParamInGroup, OutputInGroup } from '@/types/configGroups';
import type { ParamDomain, OptParams, RespDetail, SimTypeConfig } from '../types';

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

export const buildInitialSimTypeConfig = ({
  conditionId,
  foldTypeId,
  simTypeId,
  simTypes,
  safeSolvers,
  safeParamGroups,
  conditionConfig,
}: {
  conditionId: number;
  foldTypeId: number;
  simTypeId: number;
  simTypes: SimType[];
  safeSolvers: Solver[];
  safeParamGroups: ParamGroup[];
  conditionConfig?: ConditionConfig;
}): SimTypeConfig | null => {
  const simType = simTypes.find(item => item.id === simTypeId);
  if (!simType) {
    return null;
  }

  const defaultParamGroupId = conditionConfig?.defaultParamGroupId || simType.defaultParamGroupId;
  const defaultOutputGroupId =
    conditionConfig?.defaultOutputGroupId || simType.defaultOutputGroupId;
  const defaultSolverId = conditionConfig?.defaultSolverId || simType.defaultSolverId;
  const defaultSolver = safeSolvers.find(item => item.id === defaultSolverId) || safeSolvers[0];
  const defaultParamGroup = safeParamGroups.find(item => item.id === defaultParamGroupId);
  const defaultAlgType = resolveGroupAlgorithmType(defaultParamGroup?.algType);

  return {
    conditionId,
    foldTypeId,
    simTypeId,
    params: {
      mode: 'template',
      templateSetId: defaultParamGroupId || null,
      templateItemId: null,
      algorithm: defaultAlgType === AlgorithmType.BAYESIAN ? 'bayesian' : 'doe',
      customValues: {},
      optParams: {
        algType: defaultAlgType,
        domain: [],
        doeParamHeads:
          defaultAlgType === AlgorithmType.DOE_FILE ? defaultParamGroup?.doeFileHeads || [] : [],
        doeParamData:
          defaultAlgType === AlgorithmType.DOE_FILE
            ? normalizeDoeDataByHeads(
                defaultParamGroup?.doeFileHeads || [],
                defaultParamGroup?.doeFileData || []
              )
            : [],
        doeParamCsvPath:
          defaultAlgType === AlgorithmType.DOE_FILE
            ? defaultParamGroup?.doeFileName || undefined
            : undefined,
        batchSize: [{ value: 5 }],
        maxIter: 1,
      },
    },
    output: {
      mode: 'template',
      outputSetId: defaultOutputGroupId || null,
      selectedConditionIds: [],
      conditionValues: {},
      selectedOutputIds: [],
    },
    solver: {
      solverId: defaultSolver?.id || 1,
      solverVersion: defaultSolver?.version || '2024',
      cpuType: 1,
      cpuCores: defaultSolver?.cpuCoreDefault || 16,
      double: 0,
      applyGlobal: null,
      useGlobalConfig: 0,
      resourceId: null,
    },
    careDeviceIds: [],
    conditionRemark: '',
  };
};

export const buildParamDomainsFromGroupParams = (
  groupParams: ParamInGroup[],
  paramDefs: ParamDef[]
): ParamDomain[] =>
  groupParams.map(groupParam => {
    const paramDef = paramDefs.find(item => item.id === groupParam.paramDefId);
    const defaultValue = groupParam.defaultValue || paramDef?.defaultVal || '';
    const parsedDefaultValue = parseFloat(defaultValue);
    const enumValues = groupParam.enumValues || '';
    const range = enumValues.trim().length > 0 ? enumValues : defaultValue;
    const rangeList = range
      .split(',')
      .map(value => Number(value.trim()))
      .filter(value => !isNaN(value));

    return {
      paramName: paramDef?.key || groupParam.paramKey || groupParam.paramName || '',
      minValue: groupParam.minVal ?? paramDef?.minVal ?? 0,
      maxValue: groupParam.maxVal ?? paramDef?.maxVal ?? 100,
      initValue: isNaN(parsedDefaultValue) ? 50 : parsedDefaultValue,
      range,
      rangeList,
    };
  });

export const mapOutputTargetType = (value?: number): TargetType => {
  if (value === 1) return TargetType.MAX;
  if (value === 2) return TargetType.MIN;
  if (value === 3) return TargetType.TARGET;
  return TargetType.MAX;
};

export const buildRespDetailsFromGroupOutputs = (groupOutputs: OutputInGroup[]): RespDetail[] =>
  groupOutputs.map(groupOutput => ({
    set: groupOutput.setName || 'push',
    outputType: groupOutput.outputCode || 'RF3',
    component: groupOutput.component || '18',
    integrationPoint: groupOutput.sectionPoint || undefined,
    stepName: groupOutput.stepName || undefined,
    specialOutputSet: groupOutput.specialOutputSet || undefined,
    description: groupOutput.description || groupOutput.outputName || '',
    lowerLimit: groupOutput.lowerLimit ?? null,
    upperLimit: groupOutput.upperLimit ?? null,
    weight: groupOutput.weight ?? 1,
    multiple: groupOutput.multiple ?? 1,
    targetValue: groupOutput.targetValue ?? null,
    targetType: mapOutputTargetType(groupOutput.targetType),
  }));

export const collectDefaultSelections = (conditionTree: FoldTypeWithSimTypes[]) => {
  const selectedSimTypes = conditionTree.flatMap(foldType =>
    foldType.simTypes
      .filter(simType => simType.isDefault)
      .map(simType => ({
        conditionId: simType.conditionId,
        foldTypeId: foldType.id,
        simTypeId: simType.id,
      }))
  );

  return {
    selectedSimTypes,
    foldTypeIds: [...new Set(selectedSimTypes.map(item => item.foldTypeId))],
  };
};

export const calculateProjectNodeY = (conditionTree: FoldTypeWithSimTypes[]) => {
  if (conditionTree.length === 0) {
    return 300;
  }

  const totalSimTypes = conditionTree.reduce(
    (sum, foldType) => sum + Math.max(foldType.simTypes.length, 1),
    0
  );
  const foldTypeGaps = Math.max(conditionTree.length - 1, 0);
  const startY = 100;
  const simTypeSpacing = 240;
  const foldTypeGap = 60;
  const totalHeight = (totalSimTypes - 1) * simTypeSpacing + foldTypeGaps * foldTypeGap;

  return startY + totalHeight / 2;
};
