import React, { useMemo, useState, useEffect, useRef } from 'react';
import { configApi } from '@/api';
import type { SimTypeConfig, OptParams, ParamDomain, CustomBatchSize } from '../types';
import { AlgorithmType as AlgType } from '../types';
import type { ParamDef, ConditionConfig } from '@/types/config';
import type { ParamGroup, ParamInGroup } from '@/types/configGroups';
import {
  buildDoeCombinations,
  mergeDoeFileByHeads,
  mergeDomainWithGroup,
  normalizeDoeDataByHeads,
} from './paramDrawerUtils';
import { ParamsAlgorithmSelector } from './params/ParamsAlgorithmSelector';
import { ParamsBatchConfigSection } from './params/ParamsBatchConfigSection';
import { ParamsDoeFileSection } from './params/ParamsDoeFileSection';
import { ParamsDomainSection } from './params/ParamsDomainSection';
import { ParamsGroupSection } from './params/ParamsGroupSection';
import { useDoeFileState } from '../hooks/useDoeFileState';

interface ParamsDrawerContentProps {
  config: SimTypeConfig;
  simTypeId: number;
  paramDefs: ParamDef[];
  paramGroups: ParamGroup[];
  conditionConfig?: ConditionConfig;
  onUpdate: (updates: Partial<SimTypeConfig>) => void;
  onFetchGroupParams?: (groupId: number) => Promise<ParamInGroup[]>;
  t?: (key: string) => string;
}

const tableTextInputClass =
  'w-full px-1 py-1 text-sm border-0 bg-transparent focus:ring-1 focus:ring-ring rounded';

const tableNumberInputClass = `${tableTextInputClass} text-center`;

const tableCompactNumberInputClass =
  'w-full px-1 py-1 text-xs border-0 bg-transparent focus:ring-1 focus:ring-ring rounded text-center';

const doePasteTextareaClass =
  'w-full px-2 py-2 text-xs font-mono border rounded-lg bg-background border-input';

export const ParamsDrawerContent: React.FC<ParamsDrawerContentProps> = ({
  config,
  simTypeId: _simTypeId,
  paramDefs,
  paramGroups,
  conditionConfig,
  onUpdate,
  onFetchGroupParams,
  t = (key: string) => key,
}) => {
  const [loadingGroup, setLoadingGroup] = useState(false);
  // DOE 楠岃瘉閿欒淇℃伅
  const [doeValidationError, setDoeValidationError] = useState<string | null>(null);
  // 鍙傛暟缁勯€夋嫨鐘舵€?
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(
    config.params.templateSetId || null
  );
  // 鏍搁獙鐘舵€? null=鏈牳楠? true=閫氳繃, false=澶辫触
  const [verifyStatus, setVerifyStatus] = useState<boolean | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<string>('');
  // 鑷姩搴旂敤鏍囪
  const autoAppliedRef = useRef(false);

  // 鑾峰彇褰撳墠绠楁硶绫诲瀷
  const currentAlgType = config.params.optParams?.algType ?? AlgType.DOE;

  // 鏍规嵁宸ュ喌閰嶇疆 + 绠楁硶绫诲瀷绛涢€夊弬鏁扮粍
  const filteredParamGroups = useMemo(() => {
    let groups = paramGroups;

    // 1. 鎸夊伐鍐甸厤缃繃婊?
    if (conditionConfig?.paramGroupIds?.length) {
      groups = groups.filter(g => conditionConfig.paramGroupIds.includes(g.id));
    }

    return groups;
  }, [paramGroups, conditionConfig]);

  // 鏇存柊 optParams 鐨勮緟鍔╁嚱鏁?
  const updateOptParams = (updates: Partial<OptParams>) => {
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
  };

  const {
    clearDoeFile,
    doeFileDisplayName,
    doeFileDownloadUrl,
    doeFileInputRef,
    doePasteText,
    handleDoeTextareaPaste,
    handleFileChange,
    hasDoeFile,
    setDoePasteText,
  } = useDoeFileState({
    currentAlgType,
    templateSetId: config.params.templateSetId,
    paramGroups,
    optParams: config.params.optParams,
    updateOptParams,
  });

  // 鏇存柊鍙傛暟鍩熺殑杈呭姪鍑芥暟
  const updateDomain = (index: number, updates: Partial<ParamDomain>) => {
    const currentDomain = config.params.optParams?.domain || [];
    const newDomain = [...currentDomain];
    newDomain[index] = { ...newDomain[index], ...updates };
    updateOptParams({ domain: newDomain });
  };

  // 娣诲姞鍙傛暟鍩?
  const addDomain = () => {
    const currentDomain = config.params.optParams?.domain || [];
    const newParam: ParamDomain = {
      paramName: '',
      minValue: 0,
      maxValue: 100,
      initValue: 50,
      range: '',
      rangeList: [],
    };
    updateOptParams({ domain: [...currentDomain, newParam] });
  };

  // 鍒犻櫎鍙傛暟鍩?
  const removeDomain = (index: number) => {
    const currentDomain = config.params.optParams?.domain || [];
    updateOptParams({ domain: currentDomain.filter((_, i) => i !== index) });
  };

  // 鐢熸垚 DOE 鍏ㄧ粍鍚?
  const generateDoeCombinations = () => {
    setDoeValidationError(null);
    const domain = config.params.optParams?.domain || [];

    if (domain.length === 0) {
      setDoeValidationError(t('sub.params.doe_error_no_params'));
      return;
    }

    // 妫€鏌ュ弬鏁板悕鏄惁涓虹┖
    const emptyNameIndex = domain.findIndex(d => !d.paramName || d.paramName.trim() === '');
    if (emptyNameIndex >= 0) {
      setDoeValidationError(
        t('sub.params.doe_error_empty_name').replace('{index}', String(emptyNameIndex + 1))
      );
      return;
    }

    // 妫€鏌ュ弬鏁板悕鏄惁閲嶅
    const paramNames = domain.map(d => d.paramName.trim());
    const duplicates = paramNames.filter((name, idx) => paramNames.indexOf(name) !== idx);
    if (duplicates.length > 0) {
      setDoeValidationError(
        t('sub.params.doe_error_duplicate_name').replace('{name}', duplicates[0])
      );
      return;
    }

    // 鎻愬彇琛ㄥご锛堝弬鏁板悕锛?
    const heads = paramNames;

    // 鎻愬彇姣忎釜鍙傛暟鐨勫彇鍊煎垪琛?
    const valueLists = domain.map(d => {
      if (d.rangeList && d.rangeList.length > 0) {
        return d.rangeList;
      }
      // 濡傛灉娌℃湁 rangeList锛屽皾璇曚粠 range 瀛楃涓茶В鏋?
      if (d.range) {
        return d.range
          .split(',')
          .map(v => Number(v.trim()))
          .filter(v => !isNaN(v));
      }
      return [];
    });

    // 妫€鏌ユ槸鍚︽墍鏈夊弬鏁伴兘鏈夊彇鍊?
    const emptyValueIndex = valueLists.findIndex(list => list.length === 0);
    if (emptyValueIndex >= 0) {
      setDoeValidationError(
        t('sub.params.doe_error_empty_values').replace('{name}', domain[emptyValueIndex].paramName)
      );
      return;
    }

    // 鐢熸垚绗涘崱灏旂Н锛堝叏缁勫悎锛?
    const cartesian = (...arrays: number[][]): number[][] => {
      return arrays.reduce<number[][]>(
        (acc, arr) => acc.flatMap(x => arr.map(y => [...x, y])),
        [[]]
      );
    };

    const combinations = cartesian(...valueLists);

    // 杞崲涓?Record 鏍煎紡
    const data: Record<string, number | string>[] = combinations.map(combo => {
      const row: Record<string, number | string> = {};
      heads.forEach((h, i) => {
        row[h] = combo[i];
      });
      return row;
    });

    // 鏇存柊 optParams
    updateOptParams({ doeParamHeads: heads, doeParamData: data });
  };

  // DOE 琛ㄦ牸鎿嶄綔
  const updateDoeCell = (rowIdx: number, head: string, value: string) => {
    const heads = config.params.optParams?.doeParamHeads || [];
    const data = normalizeDoeDataByHeads(heads, [...(config.params.optParams?.doeParamData || [])]);
    const numVal = parseFloat(value);
    data[rowIdx] = { ...data[rowIdx], [head]: isNaN(numVal) ? value : numVal };
    updateOptParams({ doeParamData: data });
  };

  const addDoeRow = () => {
    const heads = config.params.optParams?.doeParamHeads || [];
    const data = [...(config.params.optParams?.doeParamData || [])];
    const newRow: Record<string, number | string> = {};
    heads.forEach(h => (newRow[h] = 0));
    updateOptParams({ doeParamData: [...data, newRow] });
  };

  const removeDoeRow = (rowIdx: number) => {
    const data = config.params.optParams?.doeParamData || [];
    updateOptParams({ doeParamData: data.filter((_, i) => i !== rowIdx) });
  };

  // 鎵规閰嶇疆鐩稿叧
  const batchSizeType = config.params.optParams?.batchSizeType ?? 1;
  const batchSizeList = config.params.optParams?.batchSize || [{ value: 7 }, { value: 5 }];
  const customBatchSizeList = config.params.optParams?.customBatchSize || [];

  // 娣诲姞鎵规
  const addBatchSize = () => {
    const newList = [...batchSizeList, { value: 5 }];
    updateOptParams({ batchSize: newList, maxIter: newList.length });
  };

  // 鍒犻櫎鎵规
  const removeBatchSize = (index: number) => {
    if (batchSizeList.length <= 2) return; // 鏈€灏戜繚鐣?涓?
    const newList = batchSizeList.filter((_, i) => i !== index);
    updateOptParams({ batchSize: newList, maxIter: newList.length });
  };

  // 鏇存柊鎵规鍊?
  const updateBatchSize = (index: number, value: number) => {
    const newList = [...batchSizeList];
    newList[index] = { value };
    updateOptParams({ batchSize: newList });
  };

  // 娣诲姞鑷畾涔夋壒娆?
  const addCustomBatchSize = () => {
    const lastItem = customBatchSizeList[customBatchSizeList.length - 1];
    const startIndex = lastItem ? lastItem.endIndex + 1 : 1;
    const newItem: CustomBatchSize = { startIndex, endIndex: startIndex + 9, value: 5 };
    updateOptParams({ customBatchSize: [...customBatchSizeList, newItem] });
  };

  // 鍒犻櫎鑷畾涔夋壒娆?
  const removeCustomBatchSize = (index: number) => {
    const newList = customBatchSizeList.filter((_, i) => i !== index);
    // 閲嶆柊璋冩暣鍚庣画鎵规鐨勮捣濮嬪€硷紝纭繚杩炵画
    for (let i = index; i < newList.length; i++) {
      if (i === 0) {
        newList[i] = { ...newList[i], startIndex: 1 };
      } else {
        newList[i] = { ...newList[i], startIndex: newList[i - 1].endIndex + 1 };
      }
    }
    updateOptParams({ customBatchSize: newList });
  };

  // 鏇存柊鑷畾涔夋壒娆?
  const updateCustomBatchSize = (index: number, updates: Partial<CustomBatchSize>) => {
    const newList = [...customBatchSizeList];
    newList[index] = { ...newList[index], ...updates };

    // 濡傛灉淇敼浜嗙粨鏉熷€硷紝鑷姩璋冩暣涓嬩竴涓壒娆＄殑璧峰鍊?
    if (updates.endIndex !== undefined && index < newList.length - 1) {
      newList[index + 1] = { ...newList[index + 1], startIndex: updates.endIndex + 1 };
    }

    updateOptParams({ customBatchSize: newList });
  };

  // 搴旂敤鍙傛暟缁勶紙浠庝笅鎷夐€夋嫨鐨勭粍锛夛紝杩斿洖鐢熸垚鐨?domain 渚涘悗缁娇鐢??domain 渚涘悗缁娇鐢?
  const applyParamGroup = async (
    groupId: number,
    autoMode = false
  ): Promise<ParamDomain[] | null> => {
    if (!onFetchGroupParams) return null;

    setLoadingGroup(true);
    if (!autoMode) {
      setVerifyStatus(null);
      setVerifyMessage('');
    }
    try {
      const [params, groupResp] = await Promise.all([
        onFetchGroupParams(groupId),
        configApi
          .getParamGroup(groupId)
          .then(res => res?.data as ParamGroup)
          .catch(() => undefined),
      ]);
      if (params && params.length > 0) {
        const selectedGroup = groupResp || paramGroups.find(group => group.id === groupId);
        const defaultAlgType =
          selectedGroup?.algType === AlgType.BAYESIAN || selectedGroup?.algType === AlgType.DOE_FILE
            ? selectedGroup.algType
            : AlgType.DOE;
        const groupDomain: ParamDomain[] = params.map(p => {
          const paramDef = paramDefs.find(def => def.id === p.paramDefId);
          const defaultValStr = p.defaultValue || paramDef?.defaultVal || '';
          const defaultVal = parseFloat(defaultValStr);
          // DOE妯″紡锛氫紭鍏堜娇鐢ㄦ灇涓惧€硷紝鍚﹀垯鐢ㄩ粯璁ゅ€?
          const enumStr = p.enumValues || '';
          const useEnum = defaultAlgType === AlgType.DOE && enumStr.trim().length > 0;
          const rangeStr = useEnum ? enumStr : defaultValStr;
          const rangeList = rangeStr
            .split(',')
            .map(v => Number(v.trim()))
            .filter(v => !isNaN(v));

          return {
            paramName: paramDef?.key || p.paramKey || p.paramName || '',
            minValue: p.minVal ?? paramDef?.minVal ?? 0,
            maxValue: p.maxVal ?? paramDef?.maxVal ?? 100,
            initValue: isNaN(defaultVal) ? 50 : defaultVal,
            range: rangeStr,
            rangeList,
          };
        });

        const currentDomain = config.params.optParams?.domain || [];
        const mergedDomain = mergeDomainWithGroup(groupDomain, currentDomain);

        // DOE 妯″紡涓嬩竴娆℃€х敓鎴愬叏缁勫悎锛屽拰 domain 涓€璧峰啓鍏ワ紝閬垮厤 stale closure
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

        // 涓€娆℃€ф洿鏂?templateSetId + domain + DOE鏁版嵁
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
  };

  // DOE 鍏ㄧ粍鍚堢敓鎴愶紙鍙帴鍙楀閮?domain 鍙傛暟锛岀敤浜庤嚜鍔ㄥ簲鐢ㄥ満鏅級
  // 鑷姩搴旂敤榛樿鍙傛暟缁勶紙棣栨鍔犺浇鏃讹級
  useEffect(() => {
    if (autoAppliedRef.current) return;
    if (!onFetchGroupParams || filteredParamGroups.length === 0) return;
    // 濡傛灉宸叉湁 domain 鏁版嵁锛屼笉鑷姩瑕嗙洊
    if ((config.params.optParams?.domain || []).length > 0) return;

    autoAppliedRef.current = true;
    // 浼樺厛浣跨敤褰撳墠宸查€夊弬鏁扮粍锛屽惁鍒欏彇绗竴涓?
    const defaultGroup =
      filteredParamGroups.find(
        group => group.id === (selectedGroupId || config.params.templateSetId)
      ) || filteredParamGroups[0];
    setSelectedGroupId(defaultGroup.id);

    // applyParamGroup 鍐呴儴宸蹭竴娆℃€у畬鎴?domain + DOE 缁勫悎鐢熸垚
    applyParamGroup(defaultGroup.id, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredParamGroups, onFetchGroupParams]);

  // 鏍搁獙鍙傛暟鍩熷畬鏁存€?
  const verifyParams = () => {
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
      } else {
        // 璐濆彾鏂ā寮忔鏌?min < max
        if (d.minValue >= d.maxValue) {
          errors.push(`${d.paramName}: ${t('sub.params.verify_range_error')}`);
        }
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
  };

  const domain = config.params.optParams?.domain || [];
  const doeParamHeads = config.params.optParams?.doeParamHeads || [];
  const doeParamData = config.params.optParams?.doeParamData || [];
  return (
    <div className="space-y-5 pb-6">
      <ParamsGroupSection
        filteredParamGroups={filteredParamGroups}
        selectedGroupId={selectedGroupId}
        loadingGroup={loadingGroup}
        verifyStatus={verifyStatus}
        verifyMessage={verifyMessage}
        onChangeGroup={groupId => {
          setSelectedGroupId(groupId);
          setVerifyStatus(null);
          setVerifyMessage('');
        }}
        onApplyGroup={() => {
          if (!selectedGroupId) return;
          applyParamGroup(selectedGroupId);
        }}
        onVerify={verifyParams}
        t={t}
      />

      <ParamsAlgorithmSelector
        currentAlgType={currentAlgType}
        onChange={algType => updateOptParams({ algType })}
        t={t}
      />

      <ParamsDomainSection
        currentAlgType={currentAlgType}
        domain={domain}
        doeParamHeads={doeParamHeads}
        doeParamData={doeParamData}
        doeValidationError={doeValidationError}
        tableTextInputClass={tableTextInputClass}
        tableNumberInputClass={tableNumberInputClass}
        tableCompactNumberInputClass={tableCompactNumberInputClass}
        onAddDomain={addDomain}
        onRemoveDomain={removeDomain}
        onUpdateDomain={updateDomain}
        onGenerateDoeCombinations={generateDoeCombinations}
        onAddDoeRow={addDoeRow}
        onRemoveDoeRow={removeDoeRow}
        onUpdateDoeCell={updateDoeCell}
        t={t}
      />

      <ParamsDoeFileSection
        currentAlgType={currentAlgType}
        doeFileInputRef={doeFileInputRef}
        doeFileDisplayName={doeFileDisplayName}
        doeFileDownloadUrl={doeFileDownloadUrl}
        doePasteText={doePasteText}
        doePasteTextareaClass={doePasteTextareaClass}
        hasDoeFile={hasDoeFile}
        doeParamHeads={doeParamHeads}
        doeParamData={doeParamData}
        onFileChange={handleFileChange}
        onClearFile={clearDoeFile}
        onPasteTextChange={setDoePasteText}
        onTextareaPaste={handleDoeTextareaPaste}
        t={t}
      />

      <ParamsBatchConfigSection
        currentAlgType={currentAlgType}
        batchSizeType={batchSizeType}
        batchSizeList={batchSizeList}
        customBatchSizeList={customBatchSizeList}
        tableNumberInputClass={tableNumberInputClass}
        onBatchTypeChange={batchSizeType => updateOptParams({ batchSizeType })}
        onAddBatchSize={addBatchSize}
        onRemoveBatchSize={removeBatchSize}
        onUpdateBatchSize={updateBatchSize}
        onAddCustomBatchSize={addCustomBatchSize}
        onRemoveCustomBatchSize={removeCustomBatchSize}
        onUpdateCustomBatchSize={updateCustomBatchSize}
        t={t}
      />
    </div>
  );
};
