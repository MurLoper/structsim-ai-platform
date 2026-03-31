import React, { useMemo, useRef, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { configApi } from '@/api';
import { useFormState } from '@/hooks/useFormState';
import type { ParamDef } from '@/api';
import type { ParamGroup, ParamInGroup } from '@/types/configGroups';
import {
  managementFieldClass,
  managementModalOverlayClass,
  managementModalPanelClass,
  managementPrimaryButtonDisabledClass,
  managementSearchInputClass,
  managementSecondaryButtonClass,
  managementTableInputClass,
} from '../sharedManagementStyles';

interface ParamConfigItem {
  paramDefId: number;
  defaultValue: string;
  minVal: string;
  maxVal: string;
  enumValues: string;
  sort: number;
}

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
  const initialData = useMemo(
    () => ({
      name: group?.name || '',
      description: group?.description || '',
      projectIds: group?.projectIds ?? ([] as number[]),
      algType: group?.algType ?? 2,
      doeFileName: group?.doeFileName || '',
      doeFileHeads: (group?.doeFileHeads || []) as string[],
      doeFileData: (group?.doeFileData || []) as Array<Record<string, number | string>>,
      sort: group?.sort ?? 100,
    }),
    [group]
  );

  const { formData, updateField } = useFormState(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [doePasteText, setDoePasteText] = useState('');
  const doeFileInputRef = useRef<HTMLInputElement>(null);

  const [paramConfigs, setParamConfigs] = useState<ParamConfigItem[]>(() =>
    existingParams.map((p, idx) => ({
      paramDefId: p.paramDefId,
      defaultValue: p.defaultValue || '',
      minVal: p.minVal != null ? String(p.minVal) : '',
      maxVal: p.maxVal != null ? String(p.maxVal) : '',
      enumValues: p.enumValues || '',
      sort: p.sort ?? idx * 10,
    }))
  );

  const selectedIdSet = useMemo(() => new Set(paramConfigs.map(p => p.paramDefId)), [paramConfigs]);

  const availableParams = useMemo(
    () =>
      paramDefs.filter(
        p =>
          !selectedIdSet.has(p.id) &&
          (!searchTerm ||
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.key.toLowerCase().includes(searchTerm.toLowerCase()))
      ),
    [paramDefs, searchTerm, selectedIdSet]
  );

  const addParam = (paramDefId: number) => {
    const paramDef = paramDefs.find(p => p.id === paramDefId);
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
    setParamConfigs(prev => prev.filter(p => p.paramDefId !== paramDefId));
  };

  const updateParamField = (paramDefId: number, field: keyof ParamConfigItem, value: string) => {
    setParamConfigs(prev =>
      prev.map(p => (p.paramDefId === paramDefId ? { ...p, [field]: value } : p))
    );
  };

  const getParamDef = (paramDefId: number) => paramDefs.find(p => p.id === paramDefId);

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

  const updateDoeCellValue = (rowIdx: number, head: string, value: string) => {
    const currentHeads = (formData.doeFileHeads || []) as string[];
    const currentData = (
      (formData.doeFileData || []) as Array<Record<string, number | string>>
    ).map(row => {
      const normalized: Record<string, number | string> = {};
      currentHeads.forEach(h => {
        normalized[h] = getDoeCellValue(row, h);
      });
      return normalized;
    });

    const num = Number(value);
    currentData[rowIdx] = {
      ...(currentData[rowIdx] || {}),
      [head]: value !== '' && Number.isFinite(num) ? num : value,
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
    currentHeads.forEach(h => {
      newRow[h] = '';
    });
    currentData.push(newRow);
    updateField('doeFileData', currentData);
  };

  const removeDoeRoundRow = (rowIdx: number) => {
    const currentData = (formData.doeFileData || []) as Array<Record<string, number | string>>;
    updateField(
      'doeFileData',
      currentData.filter((_, idx) => idx !== rowIdx)
    );
  };

  const handleDownloadDoeFile = () => {
    if (!group?.id) {
      showToast('warning', '请先保存参数组合后再下载DOE文件');
      return;
    }
    const url = configApi.getParamGroupDoeDownloadUrl(group.id);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const normalizeDoeMatrix = (
    matrix: Array<Array<string | number | null | undefined>>
  ): { heads: string[]; data: Array<Record<string, number | string>> } | null => {
    if (!matrix.length) return null;

    const rawHeads = (matrix[0] || []).map(v => String(v ?? '').trim());
    const heads = rawHeads.filter(Boolean);
    if (!heads.length) return null;

    const rows = matrix.slice(1).filter(row => row.some(cell => String(cell ?? '').trim() !== ''));
    if (!rows.length) return null;

    const data: Array<Record<string, number | string>> = rows.map(row => {
      const item: Record<string, number | string> = {};
      heads.forEach((head, idx) => {
        const raw = String(row[idx] ?? '').trim();
        const num = Number(raw);
        item[head] = raw !== '' && Number.isFinite(num) ? num : raw;
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
    const missingKeys = heads.filter(key => !paramDefs.some(def => def.key === key));

    setParamConfigs(prev => {
      const next = [...prev];

      heads.forEach((key, idx) => {
        const paramDef = paramDefs.find(def => def.key === key);
        if (!paramDef) return;

        const values = data
          .map(row => row[key])
          .filter(v => v !== null && v !== undefined && String(v).trim() !== '');
        const uniqueValues: string[] = [];
        values.forEach(v => {
          const text = String(v).trim();
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
            sort: (prev.length + idx + 1) * 10,
          });
        }
      });

      return next;
    });

    updateField('algType', 5);
    updateField('doeFileName', doeName);
    updateField('doeFileHeads', heads);
    updateField('doeFileData', data);

    const sourceText = source === 'upload' ? '上传doe' : '粘贴doe';
    const unknownText =
      missingKeys.length > 0
        ? `；未定义Key（${missingKeys.join(', ')}）已按自定义Key保留，不影响保存与提单`
        : '';
    showToast(
      'info',
      `识别到${sourceText}（已帮您自动保存成文件），自动帮您切换成默认算法：DOE文件${unknownText}`
    );
  };

  const parseDoeCsvText = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      showToast('warning', 'DOE 文件格式错误：至少需要表头和一行数据');
      return;
    }
    const matrix = lines.map(parseDelimitedLine);
    const parsed = normalizeDoeMatrix(matrix);
    if (!parsed) {
      showToast('warning', 'DOE 文件解析失败，请检查内容');
      return;
    }
    applyDoeToParamConfigs(
      'upload',
      formData.doeFileName || `doe_${Date.now()}.csv`,
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
          showToast('warning', 'Excel 文件为空');
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
          showToast('warning', 'Excel DOE 内容为空或格式不正确');
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
      showToast('error', '解析 DOE 文件失败');
    }
  };

  const handleDoeTextareaPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText.trim()) return;

    setDoePasteText(pastedText);
    const lines = pastedText
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      showToast('warning', '粘贴内容格式错误：至少需要表头和一行数据');
      return;
    }
    const matrix = lines.map(parseDelimitedLine);
    const parsed = normalizeDoeMatrix(matrix);
    if (!parsed) {
      showToast('warning', '粘贴内容解析失败，请检查');
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

  return (
    <div className={managementModalOverlayClass}>
      <div
        className={`${managementModalPanelClass} p-6 w-full max-w-3xl max-h-[90vh] flex flex-col`}
      >
        <h3 className="text-lg font-semibold mb-4">{group?.id ? '编辑' : '创建'}参数组合</h3>
        <div className="space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium mb-1">名称 *</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={e => updateField('name', e.target.value)}
              className={managementFieldClass}
              placeholder="输入组合名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">描述</label>
            <textarea
              value={formData.description || ''}
              onChange={e => updateField('description', e.target.value)}
              className={managementFieldClass}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                关联项目（可多选，不选=全局）
              </label>
              <div className="border rounded-lg dark:border-slate-600 max-h-[120px] overflow-y-auto p-2 space-y-1">
                {projects.length === 0 ? (
                  <span className="text-xs text-slate-400">暂无项目</span>
                ) : (
                  projects.map(p => (
                    <label
                      key={p.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 px-1 py-0.5 rounded text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={(formData.projectIds || []).includes(p.id)}
                        onChange={e => {
                          const ids = formData.projectIds || [];
                          updateField(
                            'projectIds',
                            e.target.checked
                              ? [...ids, p.id]
                              : ids.filter((id: number) => id !== p.id)
                          );
                        }}
                        className="rounded"
                      />
                      {p.name}
                    </label>
                  ))
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">排序</label>
              <input
                type="number"
                value={formData.sort ?? 100}
                onChange={e => updateField('sort', Number(e.target.value))}
                className={managementFieldClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">默认算法</label>
              <select
                value={formData.algType ?? 2}
                onChange={e => updateField('algType', Number(e.target.value))}
                className={managementFieldClass}
              >
                <option value={1}>贝叶斯</option>
                <option value={2}>DOE枚举</option>
                <option value={5}>DOE文件</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">DOE 文件导入 / 粘贴</label>
              <input
                ref={doeFileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    void handleDoeFileUpload(file);
                  }
                }}
              />
              {hasDoeFile ? (
                <div className="px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-700/60 flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                    已保存DOE文件：{formData.doeFileName}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleDownloadDoeFile}
                      className="text-xs text-blue-600 hover:text-blue-700 underline disabled:opacity-50"
                      disabled={!group?.id || !formData.doeFileName}
                    >
                      下载
                    </button>
                    <button
                      type="button"
                      onClick={clearDoeFile}
                      className="text-xs text-red-600 hover:text-red-700 underline"
                    >
                      清除
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => doeFileInputRef.current?.click()}
                    className="px-3 py-2 border rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    上传Excel/CSV
                  </button>
                  <textarea
                    value={doePasteText}
                    onChange={e => setDoePasteText(e.target.value)}
                    onPaste={handleDoeTextareaPaste}
                    rows={4}
                    className={`${managementFieldClass} font-mono text-xs`}
                    placeholder="可直接粘贴Excel表格内容：首行为参数key，第二行开始为每轮DOE数值（粘贴后自动解析）"
                  />
                </div>
              )}
            </div>
          </div>

          {Number(formData.algType ?? 2) === 5 && (formData.doeFileHeads || []).length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">DOE轮次数据</label>
                <button
                  type="button"
                  onClick={addDoeRoundRow}
                  className="text-xs px-2 py-1 border rounded hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  新增轮次
                </button>
              </div>
              <div className="border rounded-lg dark:border-slate-600 overflow-auto max-h-56">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-2 py-1 text-left w-12">#</th>
                      {((formData.doeFileHeads || []) as string[]).map(head => (
                        <th key={head} className="px-2 py-1 text-left font-mono">
                          {head}
                        </th>
                      ))}
                      <th className="px-2 py-1 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-600">
                    {((formData.doeFileData || []) as Array<Record<string, number | string>>).map(
                      (row, rowIdx) => (
                        <tr key={rowIdx}>
                          <td className="px-2 py-1 text-slate-500">{rowIdx + 1}</td>
                          {((formData.doeFileHeads || []) as string[]).map(head => (
                            <td key={`${head}-${rowIdx}`} className="px-2 py-1">
                              <input
                                type="text"
                                value={getDoeCellValue(row, head)}
                                onChange={e => updateDoeCellValue(rowIdx, head, e.target.value)}
                                className="w-full px-1.5 py-1 border rounded dark:bg-slate-600 dark:border-slate-500"
                              />
                            </td>
                          ))}
                          <td className="px-2 py-1">
                            <button
                              type="button"
                              onClick={() => removeDoeRoundRow(rowIdx)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                    {((formData.doeFileData || []) as Array<Record<string, number | string>>)
                      .length === 0 && (
                      <tr>
                        <td
                          colSpan={((formData.doeFileHeads || []) as string[]).length + 2}
                          className="px-3 py-3 text-center text-slate-400"
                        >
                          暂无DOE轮次数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">已选参数</label>
              <span className="text-xs text-slate-500">{paramConfigs.length} 个参数</span>
            </div>
            {paramConfigs.length > 0 ? (
              <div className="border rounded-lg dark:border-slate-600 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700 text-xs uppercase">
                    <tr>
                      <th className="px-2 py-2 text-left">参数名</th>
                      <th className="px-2 py-2 text-left">Key</th>
                      <th className="px-2 py-2 text-left">单位</th>
                      <th className="px-2 py-2 text-left">下限</th>
                      <th className="px-2 py-2 text-left">上限</th>
                      <th className="px-2 py-2 text-left">默认值</th>
                      <th className="px-2 py-2 text-left">枚举值(DOE)</th>
                      <th className="px-2 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-600">
                    {paramConfigs.map(pc => {
                      const def = getParamDef(pc.paramDefId);
                      return (
                        <tr
                          key={pc.paramDefId}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        >
                          <td className="px-2 py-1.5 font-medium text-xs">{def?.name || '-'}</td>
                          <td className="px-2 py-1.5 font-mono text-xs text-slate-500">
                            {def?.key || '-'}
                          </td>
                          <td className="px-2 py-1.5 text-slate-400 text-xs">{def?.unit || '-'}</td>
                          <td className="px-2 py-1">
                            <input
                              type="text"
                              value={pc.minVal}
                              onChange={e =>
                                updateParamField(pc.paramDefId, 'minVal', e.target.value)
                              }
                              placeholder={def?.minVal != null ? String(def.minVal) : '-'}
                              className={managementTableInputClass}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="text"
                              value={pc.maxVal}
                              onChange={e =>
                                updateParamField(pc.paramDefId, 'maxVal', e.target.value)
                              }
                              placeholder={def?.maxVal != null ? String(def.maxVal) : '-'}
                              className={managementTableInputClass}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="text"
                              value={pc.defaultValue}
                              onChange={e =>
                                updateParamField(pc.paramDefId, 'defaultValue', e.target.value)
                              }
                              placeholder={def?.defaultVal || '无'}
                              className={managementTableInputClass}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="text"
                              value={pc.enumValues}
                              onChange={e =>
                                updateParamField(pc.paramDefId, 'enumValues', e.target.value)
                              }
                              placeholder="如: 0,15,30,45,60"
                              className={managementTableInputClass}
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <button
                              onClick={() => removeParam(pc.paramDefId)}
                              className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border rounded-lg dark:border-slate-600 p-4 text-center text-slate-400 text-sm">
                尚未选择参数，请从下方列表添加
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">添加参数</label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索参数名或Key..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={managementSearchInputClass}
              />
            </div>
            <div className="border rounded-lg dark:border-slate-600 max-h-[200px] overflow-y-auto">
              {availableParams.length === 0 ? (
                <div className="px-3 py-4 text-center text-slate-400 text-sm">
                  {searchTerm
                    ? '未找到匹配参数'
                    : paramDefs.length === 0
                      ? '暂无参数定义，请先在「参数定义」中创建参数'
                      : '所有参数已添加'}
                </div>
              ) : (
                availableParams.map(param => (
                  <button
                    key={param.id}
                    onClick={() => addParam(param.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b last:border-b-0 dark:border-slate-600 text-left transition-colors"
                  >
                    <Plus className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{param.name}</div>
                      <div className="text-xs text-slate-500">{param.key}</div>
                    </div>
                    {param.unit && (
                      <span className="text-xs text-slate-400 flex-shrink-0">{param.unit}</span>
                    )}
                    {(param.minVal != null || param.maxVal != null) && (
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        [{param.minVal ?? '−∞'}, {param.maxVal ?? '+∞'}]
                      </span>
                    )}
                    {param.defaultVal && (
                      <span className="text-xs text-blue-400 flex-shrink-0">
                        默认: {param.defaultVal}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t dark:border-slate-700">
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
                    Number(formData.algType ?? 2) === 5
                      ? (formData.doeFileName as string) || ''
                      : '',
                  doeFileHeads:
                    Number(formData.algType ?? 2) === 5
                      ? (formData.doeFileHeads as string[]) || []
                      : [],
                  doeFileData:
                    Number(formData.algType ?? 2) === 5
                      ? (formData.doeFileData as Array<Record<string, number | string>>) || []
                      : [],
                },
                paramConfigs.map(p => ({
                  paramDefId: p.paramDefId,
                  defaultValue: p.defaultValue || undefined,
                  minVal: p.minVal ? Number(p.minVal) : undefined,
                  maxVal: p.maxVal ? Number(p.maxVal) : undefined,
                  enumValues: p.enumValues || undefined,
                  sort: p.sort,
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
