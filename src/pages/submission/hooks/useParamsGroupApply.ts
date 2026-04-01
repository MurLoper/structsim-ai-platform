import { useCallback, useEffect, useRef, useState } from 'react';
import { configApi } from '@/api';
import type { ParamDef, ConditionConfig } from '@/types/config';
import type { ParamGroup, ParamInGroup } from '@/types/configGroups';
import type { SimTypeConfig, OptParams, ParamDomain } from '../types';
import { AlgorithmType as AlgType } from '../types';
import {
  buildDoeCombinations,
  mergeDoeFileByHeads,
  mergeDomainWithGroup,
  normalizeDoeDataByHeads,
} from '../components/paramDrawerData';

interface UseParamsGroupApplyOptions {
  config: SimTypeConfig;
  paramDefs: ParamDef[];
  paramGroups: ParamGroup[];
  conditionConfig?: ConditionConfig;
  onUpdate: (updates: Partial<SimTypeConfig>) => void;
  onFetchGroupParams?: (groupId: number) => Promise<ParamInGroup[]>;
}

export const useParamsGroupApply = ({
  config,
  paramDefs,
  paramGroups,
  conditionConfig,
  onUpdate,
  onFetchGroupParams,
}: UseParamsGroupApplyOptions) => {
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<boolean | null>(null);
  const [verifyMessage, setVerifyMessage] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(
    config.params.templateSetId || null
  );
  const autoAppliedRef = useRef(false);

  const currentAlgType = config.params.optParams?.algType ?? AlgType.DOE;

  const filteredParamGroups = paramGroups.filter(group => {
    if (!conditionConfig?.paramGroupIds?.length) return true;
    return conditionConfig.paramGroupIds.includes(group.id);
  });

  const updateOptParams = useCallback(
    (updates: Partial<OptParams>) => {
      const currentOptParams = config.params.optParams || {
        algType: AlgType.DOE,
        domain: [],
        batchSize: [{ value: 5 }],
        maxIter: 1,
      };
      onUpdate({
        params: {
          ...config.params,
          optParams: { ...currentOptParams, ...updates },
        },
      });
    },
    [config.params, onUpdate]
  );

  const applyParamGroup = useCallback(
    async (groupId: number, autoMode = false): Promise<ParamDomain[] | null> => {
      if (!onFetchGroupParams) return null;

      setLoadingGroup(true);
      if (!autoMode) {
        setVerifyStatus(null);
        setVerifyMessage('');
      }

      try {
        const [params, groupResp] = await Promise.all([
          onFetchGroupParams(groupId),
          configApi.getParamGroup(groupId).then(res => res?.data as ParamGroup),
        ]);

        const selectedGroup = groupResp;
        const defaultAlgType =
          (selectedGroup?.algType as AlgType | undefined) ?? currentAlgType ?? AlgType.DOE;

        if (params.length > 0) {
          const groupDomain: ParamDomain[] = params.map(param => {
            const paramDef = paramDefs.find(def => def.id === param.paramDefId);
            const rangeList = (param.enumValues || '')
              .split(',')
              .map((value: string) => Number(value.trim()))
              .filter((value: number) => !isNaN(value));

            return {
              paramName: paramDef?.key || `param_${param.paramDefId}`,
              minValue: Number(param.minVal ?? 0),
              maxValue: Number(param.maxVal ?? 100),
              initValue:
                param.defaultValue !== null && param.defaultValue !== undefined
                  ? Number(param.defaultValue)
                  : Number(param.minVal ?? 0),
              range: param.enumValues || '',
              rangeList,
            };
          });

          const currentDomain = config.params.optParams?.domain || [];
          const mergedDomain = mergeDomainWithGroup(groupDomain, currentDomain);

          let doeExtras: Partial<OptParams> = {};
          if (defaultAlgType === AlgType.DOE) {
            const result = buildDoeCombinations(mergedDomain);
            if (result) {
              doeExtras = result;
            }
          }

          const doeFileExtras: Partial<OptParams> =
            defaultAlgType === AlgType.DOE_FILE
              ? (() => {
                  const groupDoeHeads = selectedGroup?.doeFileHeads || [];
                  const groupDoeData = normalizeDoeDataByHeads(
                    groupDoeHeads,
                    (selectedGroup?.doeFileData || []) as Array<
                      Record<string, number | string> | Array<string | number>
                    >
                  );
                  const mergedDoe = mergeDoeFileByHeads(
                    groupDoeHeads,
                    groupDoeData,
                    config.params.optParams?.doeParamHeads || [],
                    config.params.optParams?.doeParamData || []
                  );
                  const normalizedData = normalizeDoeDataByHeads(
                    mergedDoe.mergedHeads,
                    mergedDoe.mergedData
                  );
                  return {
                    doeParamHeads: mergedDoe.mergedHeads,
                    doeParamData: normalizedData,
                    doeParamCsvPath:
                      selectedGroup?.doeFileName || config.params.optParams?.doeParamCsvPath,
                  };
                })()
              : {
                  doeParamHeads: undefined,
                  doeParamData: undefined,
                  doeParamCsvPath: undefined,
                };

          onUpdate({
            params: {
              ...config.params,
              templateSetId: groupId,
              algorithm: defaultAlgType === AlgType.BAYESIAN ? 'bayesian' : 'doe',
              optParams: {
                ...(config.params.optParams || {
                  algType: defaultAlgType,
                  domain: [],
                  batchSize: [{ value: 5 }],
                  maxIter: 1,
                }),
                algType: defaultAlgType,
                domain: mergedDomain,
                ...doeExtras,
                ...doeFileExtras,
              },
            },
          });
          return mergedDomain;
        }
      } catch (error) {
        console.error('Failed to fetch param group:', error);
      } finally {
        setLoadingGroup(false);
      }
      return null;
    },
    [config.params, currentAlgType, onFetchGroupParams, onUpdate, paramDefs]
  );

  useEffect(() => {
    if (autoAppliedRef.current) return;
    if (!onFetchGroupParams || filteredParamGroups.length === 0) return;
    if ((config.params.optParams?.domain || []).length > 0) return;

    autoAppliedRef.current = true;
    const defaultGroup =
      filteredParamGroups.find(
        group => group.id === (selectedGroupId || config.params.templateSetId)
      ) || filteredParamGroups[0];
    setSelectedGroupId(defaultGroup.id);
    void applyParamGroup(defaultGroup.id, true);
  }, [
    applyParamGroup,
    config.params.optParams?.domain,
    config.params.templateSetId,
    filteredParamGroups,
    onFetchGroupParams,
    selectedGroupId,
  ]);

  const verifyParams = useCallback(
    (t: (key: string) => string) => {
      const domain = config.params.optParams?.domain || [];
      if (domain.length === 0) {
        setVerifyStatus(false);
        setVerifyMessage(t('sub.params.verify_empty'));
        return;
      }

      const errors: string[] = [];
      domain.forEach((d, idx) => {
        if (!d.paramName.trim()) {
          errors.push(`#${idx + 1}: ${t('sub.params.verify_no_name')}`);
        }
        if (currentAlgType === AlgType.DOE) {
          if (!d.range && (!d.rangeList || d.rangeList.length === 0)) {
            errors.push(`${d.paramName || '#' + (idx + 1)}: ${t('sub.params.verify_no_values')}`);
          }
        } else if (d.minValue >= d.maxValue) {
          errors.push(`${d.paramName}: ${t('sub.params.verify_range_error')}`);
        }
      });

      if (errors.length > 0) {
        setVerifyStatus(false);
        setVerifyMessage(errors.join('; '));
      } else {
        setVerifyStatus(true);
        setVerifyMessage(
          `${t('sub.params.verify_pass')}: ${domain.length} ${t('sub.params.verify_params_count')}`
        );
      }
    },
    [config.params.optParams?.domain, currentAlgType]
  );

  return {
    loadingGroup,
    verifyStatus,
    verifyMessage,
    selectedGroupId,
    setSelectedGroupId,
    filteredParamGroups,
    currentAlgType,
    updateOptParams,
    applyParamGroup,
    verifyParams,
  };
};
