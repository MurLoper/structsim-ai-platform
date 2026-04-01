import { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { paramGroupsApi, outputGroupsApi } from '@/api/config/groups';
import type { ParamDef } from '@/types/config';
import type { ParamGroup, ParamInGroup, OutputInGroup } from '@/types/configGroups';
import { AlgorithmType } from '../types';
import type { OptParams, SimTypeConfig } from '../types';
import type { SelectedSimType } from './submissionStateUtils';
import {
  buildDoeCombinations,
  buildParamDomainsFromGroupParams,
  buildRespDetailsFromGroupOutputs,
  normalizeDoeDataByHeads,
  resolveGroupAlgorithmType,
} from './submissionStateUtils';

interface UseSubmissionTemplatePrefillOptions {
  selectedSimTypes: SelectedSimType[];
  simTypeConfigs: Record<number, SimTypeConfig>;
  setSimTypeConfigs: Dispatch<SetStateAction<Record<number, SimTypeConfig>>>;
  paramDefs: ParamDef[];
  safeParamGroups: ParamGroup[];
}

export const useSubmissionTemplatePrefill = ({
  selectedSimTypes,
  simTypeConfigs,
  setSimTypeConfigs,
  paramDefs,
  safeParamGroups,
}: UseSubmissionTemplatePrefillOptions) => {
  const paramGroupPrefillRef = useRef<Set<string>>(new Set());
  const outputGroupPrefillRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    selectedSimTypes.forEach(item => {
      const config = simTypeConfigs[item.conditionId];
      if (!config) {
        return;
      }

      const templateSetId = config.params.templateSetId;
      const domain = config.params.optParams?.domain || [];
      if (config.params.mode === 'template' && templateSetId && domain.length === 0) {
        const prefillKey = `${item.conditionId}:${templateSetId}`;
        if (!paramGroupPrefillRef.current.has(prefillKey)) {
          paramGroupPrefillRef.current.add(prefillKey);

          void (async () => {
            try {
              const response = await paramGroupsApi.getParamGroupParams(templateSetId);
              const groupParams = (response.data as ParamInGroup[]) || [];
              if (groupParams.length === 0) {
                return;
              }

              const groupMeta = safeParamGroups.find(group => group.id === templateSetId);
              const groupAlgType = resolveGroupAlgorithmType(groupMeta?.algType);
              const nextDomain = buildParamDomainsFromGroupParams(groupParams, paramDefs);

              setSimTypeConfigs(prev => {
                const current = prev[item.conditionId];
                if (!current || (current.params.optParams?.domain || []).length > 0) {
                  return prev;
                }

                const baseOpt: OptParams = current.params.optParams || {
                  algType: groupAlgType,
                  domain: [],
                  batchSize: [{ value: 5 }],
                  maxIter: 1,
                };
                const finalAlgType = baseOpt.algType ?? groupAlgType;
                const doeExtras =
                  finalAlgType === AlgorithmType.DOE ? buildDoeCombinations(nextDomain) : {};
                const doeFileExtras =
                  finalAlgType === AlgorithmType.DOE_FILE
                    ? {
                        doeParamHeads: groupMeta?.doeFileHeads || [],
                        doeParamData: normalizeDoeDataByHeads(
                          groupMeta?.doeFileHeads || [],
                          groupMeta?.doeFileData || []
                        ),
                        doeParamCsvPath: groupMeta?.doeFileName || undefined,
                      }
                    : {};

                return {
                  ...prev,
                  [item.conditionId]: {
                    ...current,
                    params: {
                      ...current.params,
                      algorithm: finalAlgType === AlgorithmType.BAYESIAN ? 'bayesian' : 'doe',
                      optParams: {
                        ...baseOpt,
                        algType: finalAlgType,
                        domain: nextDomain,
                        ...doeExtras,
                        ...doeFileExtras,
                      },
                    },
                  },
                };
              });
            } catch (error) {
              console.error('自动加载参数组失败:', error);
            }
          })();
        }
      }

      const outputSetId = config.output.outputSetId;
      const respDetails = config.output.respDetails || [];
      if (config.output.mode === 'template' && outputSetId && respDetails.length === 0) {
        const prefillKey = `${item.conditionId}:${outputSetId}`;
        if (!outputGroupPrefillRef.current.has(prefillKey)) {
          outputGroupPrefillRef.current.add(prefillKey);

          void (async () => {
            try {
              const response = await outputGroupsApi.getOutputGroupOutputs(outputSetId);
              const groupOutputs = (response.data as OutputInGroup[]) || [];
              if (groupOutputs.length === 0) {
                return;
              }

              const nextRespDetails = buildRespDetailsFromGroupOutputs(groupOutputs);

              setSimTypeConfigs(prev => {
                const current = prev[item.conditionId];
                if (!current || (current.output.respDetails || []).length > 0) {
                  return prev;
                }

                return {
                  ...prev,
                  [item.conditionId]: {
                    ...current,
                    output: {
                      ...current.output,
                      respDetails: nextRespDetails,
                    },
                  },
                };
              });
            } catch (error) {
              console.error('自动加载输出组失败:', error);
            }
          })();
        }
      }
    });
  }, [paramDefs, safeParamGroups, selectedSimTypes, setSimTypeConfigs, simTypeConfigs]);
};
