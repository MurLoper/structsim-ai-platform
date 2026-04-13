import React, { useState } from 'react';
import type { SimTypeConfig, ParamDomain, CustomBatchSize } from '../types';
import type { ParamDef, ConditionConfig } from '@/types/config';
import type { ParamGroup, ParamInGroup } from '@/types/configGroups';
import { normalizeDoeDataByHeads } from './paramDrawerData';
import { ParamsAlgorithmSelector } from './params/ParamsAlgorithmSelector';
import { ParamsBatchConfigSection } from './params/ParamsBatchConfigSection';
import { ParamsDoeFileSection } from './params/ParamsDoeFileSection';
import { ParamsDomainSection } from './params/ParamsDomainSection';
import { ParamsGroupSection } from './params/ParamsGroupSection';
import { ParamsAutomationOptionsSection } from './params/ParamsAutomationOptionsSection';
import { useDoeFileState } from '../hooks/useDoeFileState';
import { useParamsGroupApply } from '../hooks/useParamsGroupApply';

interface ParamsDrawerContentProps {
  config: SimTypeConfig;
  simTypeId: number;
  paramDefs: ParamDef[];
  paramGroups: ParamGroup[];
  conditionConfig?: ConditionConfig;
  globalParams: { applyToAll: boolean; rotateDropFlag: boolean };
  onUpdate: (updates: Partial<SimTypeConfig>) => void;
  onGlobalParamsChange: (updates: { applyToAll?: boolean; rotateDropFlag?: boolean }) => void;
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
  globalParams,
  onUpdate,
  onGlobalParamsChange,
  onFetchGroupParams,
  t = (key: string) => key,
}) => {
  const [doeValidationError, setDoeValidationError] = useState<string | null>(null);

  const {
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
  } = useParamsGroupApply({
    config,
    paramDefs,
    paramGroups,
    conditionConfig,
    onUpdate,
    onFetchGroupParams,
  });

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

  const updateDomain = (index: number, updates: Partial<ParamDomain>) => {
    const currentDomain = config.params.optParams?.domain || [];
    const newDomain = [...currentDomain];
    newDomain[index] = { ...newDomain[index], ...updates };
    updateOptParams({ domain: newDomain });
  };

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

  const removeDomain = (index: number) => {
    const currentDomain = config.params.optParams?.domain || [];
    updateOptParams({ domain: currentDomain.filter((_, i) => i !== index) });
  };

  const generateDoeCombinations = () => {
    setDoeValidationError(null);
    const domain = config.params.optParams?.domain || [];

    if (domain.length === 0) {
      setDoeValidationError(t('sub.params.doe_error_no_params'));
      return;
    }

    const emptyNameIndex = domain.findIndex(d => !d.paramName || d.paramName.trim() === '');
    if (emptyNameIndex >= 0) {
      setDoeValidationError(
        t('sub.params.doe_error_empty_name').replace('{index}', String(emptyNameIndex + 1))
      );
      return;
    }

    const paramNames = domain.map(d => d.paramName.trim());
    const duplicates = paramNames.filter((name, idx) => paramNames.indexOf(name) !== idx);
    if (duplicates.length > 0) {
      setDoeValidationError(
        t('sub.params.doe_error_duplicate_name').replace('{name}', duplicates[0])
      );
      return;
    }

    const heads = paramNames;
    const valueLists = domain.map(d => {
      if (d.rangeList && d.rangeList.length > 0) {
        return d.rangeList;
      }
      if (d.range) {
        return d.range
          .split(',')
          .map(v => Number(v.trim()))
          .filter(v => !isNaN(v));
      }
      return [];
    });

    const emptyValueIndex = valueLists.findIndex(list => list.length === 0);
    if (emptyValueIndex >= 0) {
      setDoeValidationError(
        t('sub.params.doe_error_empty_values').replace('{name}', domain[emptyValueIndex].paramName)
      );
      return;
    }

    const cartesian = (...arrays: number[][]): number[][] => {
      return arrays.reduce<number[][]>(
        (acc, arr) => acc.flatMap(x => arr.map(y => [...x, y])),
        [[]]
      );
    };

    const combinations = cartesian(...valueLists);
    const data: Record<string, number | string>[] = combinations.map(combo => {
      const row: Record<string, number | string> = {};
      heads.forEach((h, i) => {
        row[h] = combo[i];
      });
      return row;
    });

    updateOptParams({ doeParamHeads: heads, doeParamData: data });
  };

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

  const batchSizeType = config.params.optParams?.batchSizeType ?? 1;
  const batchSizeList = config.params.optParams?.batchSize || [{ value: 7 }, { value: 5 }];
  const customBatchSizeList = config.params.optParams?.customBatchSize || [];

  const addBatchSize = () => {
    const newList = [...batchSizeList, { value: 5 }];
    updateOptParams({ batchSize: newList, maxIter: newList.length });
  };

  const removeBatchSize = (index: number) => {
    if (batchSizeList.length <= 2) return;
    const newList = batchSizeList.filter((_, i) => i !== index);
    updateOptParams({ batchSize: newList, maxIter: newList.length });
  };

  const updateBatchSize = (index: number, value: number) => {
    const newList = [...batchSizeList];
    newList[index] = { value };
    updateOptParams({ batchSize: newList });
  };

  const addCustomBatchSize = () => {
    const lastItem = customBatchSizeList[customBatchSizeList.length - 1];
    const startIndex = lastItem ? lastItem.endIndex + 1 : 1;
    const newItem: CustomBatchSize = { startIndex, endIndex: startIndex + 9, value: 5 };
    updateOptParams({ customBatchSize: [...customBatchSizeList, newItem] });
  };

  const removeCustomBatchSize = (index: number) => {
    const newList = customBatchSizeList.filter((_, i) => i !== index);
    for (let i = index; i < newList.length; i++) {
      if (i === 0) {
        newList[i] = { ...newList[i], startIndex: 1 };
      } else {
        newList[i] = { ...newList[i], startIndex: newList[i - 1].endIndex + 1 };
      }
    }
    updateOptParams({ customBatchSize: newList });
  };

  const updateCustomBatchSize = (index: number, updates: Partial<CustomBatchSize>) => {
    const newList = [...customBatchSizeList];
    newList[index] = { ...newList[index], ...updates };

    if (updates.endIndex !== undefined && index < newList.length - 1) {
      newList[index + 1] = { ...newList[index + 1], startIndex: updates.endIndex + 1 };
    }

    updateOptParams({ customBatchSize: newList });
  };

  const domain = config.params.optParams?.domain || [];
  const doeParamHeads = config.params.optParams?.doeParamHeads || [];
  const doeParamData = config.params.optParams?.doeParamData || [];

  return (
    <div className="space-y-5 pb-6">
      <ParamsAutomationOptionsSection
        applyToAll={globalParams.applyToAll}
        rotateDropFlag={globalParams.rotateDropFlag}
        perConditionRotateDropFlag={Boolean(
          (config.params as typeof config.params & { rotateDropFlag?: boolean }).rotateDropFlag
        )}
        onGlobalChange={updates => onGlobalParamsChange(updates)}
        onConditionRotateDropChange={rotateDropFlag =>
          onUpdate({ params: { ...config.params, rotateDropFlag } as typeof config.params })
        }
        t={t}
      />

      <ParamsGroupSection
        filteredParamGroups={filteredParamGroups}
        selectedGroupId={selectedGroupId}
        loadingGroup={loadingGroup}
        verifyStatus={verifyStatus}
        verifyMessage={verifyMessage}
        onChangeGroup={groupId => {
          setSelectedGroupId(groupId);
        }}
        onApplyGroup={() => {
          if (!selectedGroupId) return;
          void applyParamGroup(selectedGroupId);
        }}
        onVerify={() => verifyParams(t)}
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
