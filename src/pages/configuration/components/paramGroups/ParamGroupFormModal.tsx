import React, { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { configApi } from '@/api';
import type { ParamDef } from '@/api';
import { useFormState } from '@/hooks/useFormState';
import type { ParamGroup, ParamInGroup } from '@/types/configGroups';
import {
  managementModalOverlayClass,
  managementModalPanelClass,
  managementPrimaryButtonDisabledClass,
  managementSecondaryButtonClass,
} from '../managementSurfaceTokens';
import { ParamGroupAvailableParamList } from './ParamGroupAvailableParamList';
import { ParamGroupBasicsSection } from './ParamGroupBasicsSection';
import { ParamGroupDoeRoundsTable } from './ParamGroupDoeRoundsTable';
import { ParamGroupSelectedParamsTable } from './ParamGroupSelectedParamsTable';
import type { ParamConfigItem, ParamGroupFormData } from './types';

type ParamGroupSavePayload = Array<{
  paramDefId: number;
  defaultValue?: string;
  minVal?: number;
  maxVal?: number;
  enumValues?: string;
  sort?: number;
}>;

type ParamGroupFormModalProps = {
  group: Partial<ParamGroup> | null;
  paramDefs: ParamDef[];
  projects: Array<{ id: number; name: string }>;
  existingParams?: ParamInGroup[];
  onSave: (data: Partial<ParamGroup>, paramConfigs: ParamGroupSavePayload) => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  onClose: () => void;
};

export const ParamGroupFormModal: React.FC<ParamGroupFormModalProps> = ({
  group,
  paramDefs,
  projects,
  existingParams = [],
  onSave,
  showToast,
  onClose,
}) => {
  const initialData = useMemo<ParamGroupFormData>(
    () => ({
      name: group?.name || '',
      description: group?.description || '',
      projectIds: group?.projectIds ?? [],
      algType: group?.algType ?? 2,
      doeFileName: group?.doeFileName || '',
      doeFileHeads: (group?.doeFileHeads || []) as string[],
      doeFileData: (group?.doeFileData || []) as Array<Record<string, number | string>>,
      sort: group?.sort ?? 100,
      id: group?.id,
    }),
    [group]
  );

  const { formData, updateField } = useFormState<ParamGroupFormData>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [doePasteText, setDoePasteText] = useState('');
  const doeFileInputRef = useRef<HTMLInputElement>(null);

  const [paramConfigs, setParamConfigs] = useState<ParamConfigItem[]>(() =>
    existingParams.map((item, index) => ({
      paramDefId: item.paramDefId,
      defaultValue: item.defaultValue || '',
      minVal: item.minVal != null ? String(item.minVal) : '',
      maxVal: item.maxVal != null ? String(item.maxVal) : '',
      enumValues: item.enumValues || '',
      sort: item.sort ?? index * 10,
    }))
  );

  const selectedIdSet = useMemo(
    () => new Set(paramConfigs.map(item => item.paramDefId)),
    [paramConfigs]
  );

  const availableParams = useMemo(
    () =>
      paramDefs.filter(
        param =>
          !selectedIdSet.has(param.id) &&
          (!searchTerm ||
            param.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            param.key.toLowerCase().includes(searchTerm.toLowerCase()))
      ),
    [paramDefs, searchTerm, selectedIdSet]
  );

  const addParam = (paramDefId: number) => {
    const paramDef = paramDefs.find(param => param.id === paramDefId);
    setParamConfigs(prev => [
      ...prev,
      {
        paramDefId,
        defaultValue: paramDef?.defaultVal || '',
        minVal: paramDef?.minVal != null ? String(paramDef.minVal) : '',
        maxVal: paramDef?.maxVal != null ? String(paramDef.maxVal) : '',
        enumValues: '',
        sort: (prev.length + 1) * 10,
      },
    ]);
  };

  const removeParam = (paramDefId: number) => {
    setParamConfigs(prev => prev.filter(item => item.paramDefId !== paramDefId));
  };

  const updateParamField = (paramDefId: number, field: keyof ParamConfigItem, value: string) => {
    setParamConfigs(prev =>
      prev.map(item => (item.paramDefId === paramDefId ? { ...item, [field]: value } : item))
    );
  };

  const getParamDef = (paramDefId: number) => paramDefs.find(param => param.id === paramDefId);

  const parseDelimitedLine = (line: string): string[] => {
    const delimiter = line.includes('\t') ? '\t' : ',';
    return line.split(delimiter).map(item => String(item).trim());
  };

  const toCamelKey = (key: string): string =>
    key.replace(/_([a-zA-Z])/g, (_, ch: string) => ch.toUpperCase());

  const getDoeCellValue = (row: Record<string, number | string>, head: string): string => {
    const direct = row[head];
    if (direct !== undefined && direct !== null) return String(direct);
    const camel = row[toCamelKey(head)];
    if (camel !== undefined && camel !== null) return String(camel);
    return '';
  };

  const updateDoeCellValue = (rowIndex: number, head: string, value: string) => {
    const currentHeads = (formData.doeFileHeads || []) as string[];
    const currentData = (
      (formData.doeFileData || []) as Array<Record<string, number | string>>
    ).map(row => {
      const normalized: Record<string, number | string> = {};
      currentHeads.forEach(key => {
        normalized[key] = getDoeCellValue(row, key);
      });
      return normalized;
    });

    const numericValue = Number(value);
    currentData[rowIndex] = {
      ...(currentData[rowIndex] || {}),
      [head]: value !== '' && Number.isFinite(numericValue) ? numericValue : value,
    };
    updateField('doeFileData', currentData);
  };

  const addDoeRoundRow = () => {
    const currentHeads = (formData.doeFileHeads || []) as string[];
    if (currentHeads.length === 0) return;
    const currentData = (
      (formData.doeFileData || []) as Array<Record<string, number | string>>
    ).slice();
    const newRow: Record<string, number | string> = {};
    currentHeads.forEach(head => {
      newRow[head] = '';
    });
    currentData.push(newRow);
    updateField('doeFileData', currentData);
  };

  const removeDoeRoundRow = (rowIndex: number) => {
    const currentData = (formData.doeFileData || []) as Array<Record<string, number | string>>;
    updateField(
      'doeFileData',
      currentData.filter((_, index) => index !== rowIndex)
    );
  };

  const handleDownloadDoeFile = () => {
    if (!group?.id) {
      showToast('warning', '请先保存参数组合，再下载 DOE 文件。');
      return;
    }
    const url = configApi.getParamGroupDoeDownloadUrl(group.id);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const normalizeDoeMatrix = (
    matrix: Array<Array<string | number | null | undefined>>
  ): { heads: string[]; data: Array<Record<string, number | string>> } | null => {
    if (!matrix.length) return null;

    const rawHeads = (matrix[0] || []).map(value => String(value ?? '').trim());
    const heads = rawHeads.filter(Boolean);
    if (!heads.length) return null;

    const rows = matrix.slice(1).filter(row => row.some(cell => String(cell ?? '').trim() !== ''));
    if (!rows.length) return null;

    const data: Array<Record<string, number | string>> = rows.map(row => {
      const item: Record<string, number | string> = {};
      heads.forEach((head, index) => {
        const raw = String(row[index] ?? '').trim();
        const numericValue = Number(raw);
        item[head] = raw !== '' && Number.isFinite(numericValue) ? numericValue : raw;
      });
      return item;
    });

    return { heads, data };
  };

  const applyDoeToParamConfigs = (
    source: 'upload' | 'paste',
    doeName: string,
    heads: string[],
    data: Array<Record<string, number | string>>
  ) => {
    const missingKeys = heads.filter(key => !paramDefs.some(definition => definition.key === key));

    setParamConfigs(prev => {
      const next = [...prev];

      heads.forEach((key, index) => {
        const paramDef = paramDefs.find(definition => definition.key === key);
        if (!paramDef) return;

        const values = data
          .map(row => row[key])
          .filter(value => value !== null && value !== undefined && String(value).trim() !== '');

        const uniqueValues: string[] = [];
        values.forEach(value => {
          const text = String(value).trim();
          if (text && !uniqueValues.includes(text)) uniqueValues.push(text);
        });

        const enumValues = uniqueValues.join(',');
        const existingIndex = next.findIndex(item => item.paramDefId === paramDef.id);

        if (existingIndex >= 0) {
          next[existingIndex] = { ...next[existingIndex], enumValues };
        } else {
          next.push({
            paramDefId: paramDef.id,
            defaultValue: paramDef.defaultVal || '',
            minVal: paramDef.minVal != null ? String(paramDef.minVal) : '',
            maxVal: paramDef.maxVal != null ? String(paramDef.maxVal) : '',
            enumValues,
            sort: (prev.length + index + 1) * 10,
          });
        }
      });

      return next;
    });

    updateField('algType', 5);
    updateField('doeFileName', doeName);
    updateField('doeFileHeads', heads);
    updateField('doeFileData', data);

    const sourceLabel = source === 'upload' ? '上传 DOE' : '粘贴 DOE';
    const unknownKeyText =
      missingKeys.length > 0
        ? `；未定义 Key：${missingKeys.join(', ')}，已按自定义 Key 保留，不影响保存。`
        : '';

    showToast('info', `已识别${sourceLabel}内容，并自动切换默认算法为 DOE 文件。${unknownKeyText}`);
  };

  const parseDoeCsvText = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      showToast('warning', 'DOE 文件格式错误：至少需要表头和一行数据。');
      return;
    }

    const matrix = lines.map(parseDelimitedLine);
    const parsed = normalizeDoeMatrix(matrix);
    if (!parsed) {
      showToast('warning', 'DOE 文件解析失败，请检查内容。');
      return;
    }

    applyDoeToParamConfigs(
      'upload',
      String(formData.doeFileName || `doe_${Date.now()}.csv`),
      parsed.heads,
      parsed.data
    );
  };

  const handleDoeFileUpload = async (file: File) => {
    const lowerName = file.name.toLowerCase();

    try {
      if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          showToast('warning', 'Excel 文件为空。');
          return;
        }
        const sheet = workbook.Sheets[firstSheetName];
        const matrix = XLSX.utils.sheet_to_json<Array<string | number>>(sheet, {
          header: 1,
          raw: true,
          defval: '',
        });
        const parsed = normalizeDoeMatrix(matrix);
        if (!parsed) {
          showToast('warning', 'Excel DOE 内容为空或格式不正确。');
          return;
        }
        applyDoeToParamConfigs('upload', file.name, parsed.heads, parsed.data);
        return;
      }

      const text = await file.text();
      updateField('doeFileName', file.name);
      parseDoeCsvText(text);
    } catch (error) {
      console.error('解析 DOE 文件失败:', error);
      showToast('error', '解析 DOE 文件失败。');
    }
  };

  const handleDoeTextareaPaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = event.clipboardData.getData('text');
    if (!pastedText.trim()) return;

    setDoePasteText(pastedText);
    const lines = pastedText
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      showToast('warning', '粘贴内容格式错误：至少需要表头和一行数据。');
      return;
    }

    const matrix = lines.map(parseDelimitedLine);
    const parsed = normalizeDoeMatrix(matrix);
    if (!parsed) {
      showToast('warning', '粘贴内容解析失败，请检查格式。');
      return;
    }

    applyDoeToParamConfigs('paste', `pasted_doe_${Date.now()}.csv`, parsed.heads, parsed.data);
  };

  const clearDoeFile = () => {
    updateField('doeFileName', '');
    updateField('doeFileHeads', []);
    updateField('doeFileData', []);
    setDoePasteText('');
    if (doeFileInputRef.current) {
      doeFileInputRef.current.value = '';
    }
  };

  const hasDoeFile =
    Number(formData.algType ?? 2) === 5 && Boolean(String(formData.doeFileName || '').trim());
  const doeHeads = (formData.doeFileHeads || []) as string[];
  const doeData = (formData.doeFileData || []) as Array<Record<string, number | string>>;

  return (
    <div className={managementModalOverlayClass}>
      <div
        className={`${managementModalPanelClass} flex max-h-[90vh] w-full max-w-3xl flex-col p-6`}
      >
        <h3 className="mb-4 text-lg font-semibold">{group?.id ? '编辑' : '创建'}参数组合</h3>

        <div className="flex-1 space-y-4 overflow-y-auto">
          <ParamGroupBasicsSection
            formData={formData as ParamGroupFormData}
            projects={projects}
            hasDoeFile={hasDoeFile}
            doePasteText={doePasteText}
            doeFileInputRef={doeFileInputRef}
            onFieldChange={updateField as (field: keyof ParamGroupFormData, value: unknown) => void}
            onDoePasteTextChange={setDoePasteText}
            onDoeTextareaPaste={handleDoeTextareaPaste}
            onDoeFileSelected={file => {
              void handleDoeFileUpload(file);
            }}
            onDownloadDoeFile={handleDownloadDoeFile}
            onClearDoeFile={clearDoeFile}
          />

          {Number(formData.algType ?? 2) === 5 && doeHeads.length > 0 && (
            <ParamGroupDoeRoundsTable
              heads={doeHeads}
              data={doeData}
              getDoeCellValue={getDoeCellValue}
              onAddRow={addDoeRoundRow}
              onRemoveRow={removeDoeRoundRow}
              onCellChange={updateDoeCellValue}
            />
          )}

          <ParamGroupSelectedParamsTable
            paramConfigs={paramConfigs}
            getParamDef={getParamDef}
            onFieldChange={updateParamField}
            onRemoveParam={removeParam}
          />

          <ParamGroupAvailableParamList
            searchTerm={searchTerm}
            paramDefs={paramDefs}
            availableParams={availableParams}
            onSearchTermChange={setSearchTerm}
            onAddParam={addParam}
          />
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t pt-4 dark:border-slate-700">
          <button onClick={onClose} className={managementSecondaryButtonClass}>
            取消
          </button>
          <button
            onClick={() =>
              onSave(
                {
                  ...formData,
                  algType: Number(formData.algType ?? 2),
                  doeFileName:
                    Number(formData.algType ?? 2) === 5 ? String(formData.doeFileName || '') : '',
                  doeFileHeads: Number(formData.algType ?? 2) === 5 ? doeHeads : [],
                  doeFileData: Number(formData.algType ?? 2) === 5 ? doeData : [],
                },
                paramConfigs.map(config => ({
                  paramDefId: config.paramDefId,
                  defaultValue: config.defaultValue || undefined,
                  minVal: config.minVal ? Number(config.minVal) : undefined,
                  maxVal: config.maxVal ? Number(config.maxVal) : undefined,
                  enumValues: config.enumValues || undefined,
                  sort: config.sort,
                }))
              )
            }
            disabled={!formData.name?.trim()}
            className={managementPrimaryButtonDisabledClass}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
