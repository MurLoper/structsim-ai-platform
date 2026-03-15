import React, { useMemo, useState } from 'react';
import {
  DocumentArrowUpIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import type { SimTypeConfig, OptParams, ParamDomain, CustomBatchSize } from '../types';
import { AlgorithmType as AlgType } from '../types';
import type { ParamDef, ConditionConfig } from '@/types/config';
import type { ParamGroup, ParamInGroup } from '@/types/configGroups';

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
  // DOE 文件上传状态
  const [doeFileName, setDoeFileName] = useState<string>('');
  const [loadingGroup, setLoadingGroup] = useState(false);
  // DOE 验证错误信息
  const [doeValidationError, setDoeValidationError] = useState<string | null>(null);

  // 获取当前算法类型
  const currentAlgType = config.params.optParams?.algType ?? AlgType.DOE;

  // 根据工况配置筛选参数组
  const filteredParamGroups = useMemo(() => {
    if (conditionConfig?.paramGroupIds?.length) {
      return paramGroups.filter(g => conditionConfig.paramGroupIds.includes(g.id));
    }
    // 如果没有工况配置，返回所有参数组
    return paramGroups;
  }, [paramGroups, conditionConfig]);

  // 更新 optParams 的辅助函数
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

  // 更新参数域的辅助函数
  const updateDomain = (index: number, updates: Partial<ParamDomain>) => {
    const currentDomain = config.params.optParams?.domain || [];
    const newDomain = [...currentDomain];
    newDomain[index] = { ...newDomain[index], ...updates };
    updateOptParams({ domain: newDomain });
  };

  // 添加参数域
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

  // 删除参数域
  const removeDomain = (index: number) => {
    const currentDomain = config.params.optParams?.domain || [];
    updateOptParams({ domain: currentDomain.filter((_, i) => i !== index) });
  };

  // 生成 DOE 全组合
  const generateDoeCombinations = () => {
    setDoeValidationError(null);
    const domain = config.params.optParams?.domain || [];

    if (domain.length === 0) {
      setDoeValidationError(t('sub.params.doe_error_no_params'));
      return;
    }

    // 检查参数名是否为空
    const emptyNameIndex = domain.findIndex(d => !d.paramName || d.paramName.trim() === '');
    if (emptyNameIndex >= 0) {
      setDoeValidationError(
        t('sub.params.doe_error_empty_name').replace('{index}', String(emptyNameIndex + 1))
      );
      return;
    }

    // 检查参数名是否重复
    const paramNames = domain.map(d => d.paramName.trim());
    const duplicates = paramNames.filter((name, idx) => paramNames.indexOf(name) !== idx);
    if (duplicates.length > 0) {
      setDoeValidationError(
        t('sub.params.doe_error_duplicate_name').replace('{name}', duplicates[0])
      );
      return;
    }

    // 提取表头（参数名）
    const heads = paramNames;

    // 提取每个参数的取值列表
    const valueLists = domain.map(d => {
      if (d.rangeList && d.rangeList.length > 0) {
        return d.rangeList;
      }
      // 如果没有 rangeList，尝试从 range 字符串解析
      if (d.range) {
        return d.range
          .split(',')
          .map(v => Number(v.trim()))
          .filter(v => !isNaN(v));
      }
      return [];
    });

    // 检查是否所有参数都有取值
    const emptyValueIndex = valueLists.findIndex(list => list.length === 0);
    if (emptyValueIndex >= 0) {
      setDoeValidationError(
        t('sub.params.doe_error_empty_values').replace('{name}', domain[emptyValueIndex].paramName)
      );
      return;
    }

    // 生成笛卡尔积（全组合）
    const cartesian = (...arrays: number[][]): number[][] => {
      return arrays.reduce<number[][]>(
        (acc, arr) => acc.flatMap(x => arr.map(y => [...x, y])),
        [[]]
      );
    };

    const combinations = cartesian(...valueLists);

    // 转换为 Record 格式
    const data: Record<string, number | string>[] = combinations.map(combo => {
      const row: Record<string, number | string> = {};
      heads.forEach((h, i) => {
        row[h] = combo[i];
      });
      return row;
    });

    // 更新 optParams
    updateOptParams({ doeParamHeads: heads, doeParamData: data });
  };

  // 处理 DOE 核验确认
  const handleDoeConfirm = (heads: string[], data: Record<string, number | string>[]) => {
    updateOptParams({ doeParamHeads: heads, doeParamData: data });
  };

  // DOE 表格操作
  const updateDoeCell = (rowIdx: number, head: string, value: string) => {
    const data = [...(config.params.optParams?.doeParamData || [])];
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

  // 批次配置相关
  const batchSizeType = config.params.optParams?.batchSizeType ?? 1;
  const batchSizeList = config.params.optParams?.batchSize || [{ value: 7 }, { value: 5 }];
  const customBatchSizeList = config.params.optParams?.customBatchSize || [];

  // 添加批次
  const addBatchSize = () => {
    const newList = [...batchSizeList, { value: 5 }];
    updateOptParams({ batchSize: newList, maxIter: newList.length });
  };

  // 删除批次
  const removeBatchSize = (index: number) => {
    if (batchSizeList.length <= 2) return; // 最少保留2个
    const newList = batchSizeList.filter((_, i) => i !== index);
    updateOptParams({ batchSize: newList, maxIter: newList.length });
  };

  // 更新批次值
  const updateBatchSize = (index: number, value: number) => {
    const newList = [...batchSizeList];
    newList[index] = { value };
    updateOptParams({ batchSize: newList });
  };

  // 添加自定义批次
  const addCustomBatchSize = () => {
    const lastItem = customBatchSizeList[customBatchSizeList.length - 1];
    const startIndex = lastItem ? lastItem.endIndex + 1 : 1;
    const newItem: CustomBatchSize = { startIndex, endIndex: startIndex + 9, value: 5 };
    updateOptParams({ customBatchSize: [...customBatchSizeList, newItem] });
  };

  // 删除自定义批次
  const removeCustomBatchSize = (index: number) => {
    const newList = customBatchSizeList.filter((_, i) => i !== index);
    // 重新调整后续批次的起始值，确保连续
    for (let i = index; i < newList.length; i++) {
      if (i === 0) {
        newList[i] = { ...newList[i], startIndex: 1 };
      } else {
        newList[i] = { ...newList[i], startIndex: newList[i - 1].endIndex + 1 };
      }
    }
    updateOptParams({ customBatchSize: newList });
  };

  // 更新自定义批次
  const updateCustomBatchSize = (index: number, updates: Partial<CustomBatchSize>) => {
    const newList = [...customBatchSizeList];
    newList[index] = { ...newList[index], ...updates };

    // 如果修改了结束值，自动调整下一个批次的起始值
    if (updates.endIndex !== undefined && index < newList.length - 1) {
      newList[index + 1] = { ...newList[index + 1], startIndex: updates.endIndex + 1 };
    }

    updateOptParams({ customBatchSize: newList });
  };

  // 解析 CSV 文件
  const parseCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.trim().split('\n');
      if (lines.length < 2) return;

      // 解析表头
      const heads = lines[0].split(',').map(h => h.trim());

      // 解析数据行
      const data: Record<string, number | string>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: Record<string, number | string> = {};
        heads.forEach((h, idx) => {
          const numVal = parseFloat(values[idx]);
          row[h] = isNaN(numVal) ? values[idx] : numVal;
        });
        data.push(row);
      }

      // 更新状态
      setDoeFileName(file.name);
      updateOptParams({ doeParamHeads: heads, doeParamData: data });
    };
    reader.readAsText(file);
  };

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseCsvFile(file);
    }
  };

  // 应用参数组
  const applyParamGroup = async (groupId: number) => {
    if (!onFetchGroupParams) return;

    setLoadingGroup(true);
    try {
      const params = await onFetchGroupParams(groupId);
      if (params && params.length > 0) {
        // 将参数组中的参数转换为 domain 格式
        // 使用参数 key 作为参数名，默认值填入 range 字段
        const domain: ParamDomain[] = params.map(p => {
          // 从 paramDefs 中查找对应的参数定义
          const paramDef = paramDefs.find(def => def.id === p.paramDefId);
          // 优先使用参数组中的默认值，其次使用参数定义的默认值
          const defaultValStr = p.defaultValue || paramDef?.defaultVal || '';
          const defaultVal = parseFloat(defaultValStr);

          return {
            // 使用参数 key 作为参数名
            paramName: paramDef?.key || p.paramKey || p.paramName || '',
            minValue: paramDef?.minVal ?? 0,
            maxValue: paramDef?.maxVal ?? 100,
            initValue: isNaN(defaultVal) ? 50 : defaultVal,
            // 将默认值填入 range，作为 DOE 的唯一取值
            range: defaultValStr,
            rangeList: isNaN(defaultVal) ? [] : [defaultVal],
          };
        });
        updateOptParams({ domain });
      }
    } catch (error) {
      console.error('Failed to fetch param group:', error);
    } finally {
      setLoadingGroup(false);
    }
  };

  return (
    <div className="space-y-5 pb-6">
      {/* 参数组快速应用 */}
      {filteredParamGroups.length > 0 && (
        <div>
          <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300 eyecare:text-foreground">
            {t('sub.params.apply_group')}
          </label>
          <div className="flex flex-wrap gap-2">
            {filteredParamGroups.map(group => (
              <button
                key={group.id}
                onClick={() => applyParamGroup(group.id)}
                disabled={loadingGroup}
                className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 eyecare:bg-muted hover:bg-brand-100 dark:hover:bg-brand-900/30 text-slate-700 dark:text-slate-300 eyecare:text-foreground rounded-lg transition-colors disabled:opacity-50"
              >
                {group.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-1">{t('sub.params.apply_group_hint')}</p>
        </div>
      )}

      {/* 优化算法选择 */}
      <div>
        <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300 eyecare:text-foreground">
          {t('sub.params.alg_type')}
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => updateOptParams({ algType: AlgType.BAYESIAN })}
            className={`p-3 rounded-lg border-2 transition-all ${
              currentAlgType === AlgType.BAYESIAN
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-slate-200 dark:border-slate-600 eyecare:border-border'
            }`}
          >
            <div className="text-sm font-bold text-purple-600">{t('sub.params.bayesian')}</div>
            <div className="text-xs text-slate-500 mt-1">{t('sub.params.bayesian_desc')}</div>
          </button>
          <button
            onClick={() => updateOptParams({ algType: AlgType.DOE })}
            className={`p-3 rounded-lg border-2 transition-all ${
              currentAlgType === AlgType.DOE
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-slate-200 dark:border-slate-600 eyecare:border-border'
            }`}
          >
            <div className="text-sm font-bold text-blue-600">{t('sub.params.doe')}</div>
            <div className="text-xs text-slate-500 mt-1">{t('sub.params.doe_desc')}</div>
          </button>
          <button
            onClick={() => updateOptParams({ algType: AlgType.DOE_FILE })}
            className={`p-3 rounded-lg border-2 transition-all ${
              currentAlgType === AlgType.DOE_FILE
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-slate-200 dark:border-slate-600 eyecare:border-border'
            }`}
          >
            <div className="text-sm font-bold text-green-600">{t('sub.params.doe_file')}</div>
            <div className="text-xs text-slate-500 mt-1">{t('sub.params.doe_file_desc')}</div>
          </button>
        </div>
      </div>

      {/* 参数域配置 - 贝叶斯和 DOE 模式显示 */}
      {(currentAlgType === AlgType.BAYESIAN || currentAlgType === AlgType.DOE) && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 eyecare:text-foreground">
              {t('sub.params.domain')}
            </label>
            <button
              onClick={addDomain}
              className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
            >
              <PlusIcon className="w-4 h-4" />
              {t('sub.params.add_param')}
            </button>
          </div>

          {/* 表格形式展示 */}
          <div className="border rounded-lg dark:border-slate-600 overflow-hidden">
            {/* 表头 */}
            <div
              className={`grid ${currentAlgType === AlgType.DOE ? 'grid-cols-[100px_1fr_40px]' : 'grid-cols-[100px_1fr_1fr_1fr_40px]'} bg-slate-100 dark:bg-slate-700 eyecare:bg-muted text-xs font-medium text-slate-600 dark:text-slate-300`}
            >
              <div className="px-2 py-2 border-r dark:border-slate-600">
                {t('sub.params.param_name')}
              </div>
              {currentAlgType === AlgType.DOE ? (
                <div className="px-2 py-2 border-r dark:border-slate-600">{t('sub.values')}</div>
              ) : (
                <>
                  <div className="px-2 py-2 border-r dark:border-slate-600 text-center">
                    {t('sub.min')}
                  </div>
                  <div className="px-2 py-2 border-r dark:border-slate-600 text-center">
                    {t('sub.max')}
                  </div>
                  <div className="px-2 py-2 border-r dark:border-slate-600 text-center">
                    {t('sub.params.init')}
                  </div>
                </>
              )}
              <div className="px-2 py-2"></div>
            </div>

            {/* 表格内容 */}
            <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
              {(config.params.optParams?.domain || []).length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-slate-400">
                  {t('sub.params.add_param')}
                </div>
              ) : (
                (config.params.optParams?.domain || []).map((domain, idx) => (
                  <div
                    key={idx}
                    className={`grid ${currentAlgType === AlgType.DOE ? 'grid-cols-[100px_1fr_40px]' : 'grid-cols-[100px_1fr_1fr_1fr_40px]'} border-t dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50`}
                  >
                    <div className="px-1 py-1 border-r dark:border-slate-600">
                      <input
                        type="text"
                        className="w-full px-1 py-1 text-sm border-0 bg-transparent focus:ring-1 focus:ring-brand-500 rounded"
                        placeholder="name"
                        value={domain.paramName}
                        onChange={e => updateDomain(idx, { paramName: e.target.value })}
                      />
                    </div>
                    {currentAlgType === AlgType.DOE ? (
                      <div className="px-1 py-1 border-r dark:border-slate-600">
                        <input
                          type="text"
                          className="w-full px-1 py-1 text-sm border-0 bg-transparent focus:ring-1 focus:ring-brand-500 rounded"
                          placeholder="0,15,30,45,60,75,90"
                          value={domain.range}
                          onChange={e => {
                            const range = e.target.value;
                            const rangeList = range
                              .split(',')
                              .map(v => Number(v.trim()))
                              .filter(v => !isNaN(v));
                            updateDomain(idx, { range, rangeList });
                          }}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="px-1 py-1 border-r dark:border-slate-600">
                          <input
                            type="number"
                            className="w-full px-1 py-1 text-sm border-0 bg-transparent focus:ring-1 focus:ring-brand-500 rounded text-center"
                            value={domain.minValue}
                            onChange={e => updateDomain(idx, { minValue: Number(e.target.value) })}
                          />
                        </div>
                        <div className="px-1 py-1 border-r dark:border-slate-600">
                          <input
                            type="number"
                            className="w-full px-1 py-1 text-sm border-0 bg-transparent focus:ring-1 focus:ring-brand-500 rounded text-center"
                            value={domain.maxValue}
                            onChange={e => updateDomain(idx, { maxValue: Number(e.target.value) })}
                          />
                        </div>
                        <div className="px-1 py-1 border-r dark:border-slate-600">
                          <input
                            type="number"
                            className="w-full px-1 py-1 text-sm border-0 bg-transparent focus:ring-1 focus:ring-brand-500 rounded text-center"
                            value={domain.initValue}
                            onChange={e => updateDomain(idx, { initValue: Number(e.target.value) })}
                          />
                        </div>
                      </>
                    )}
                    <div className="px-1 py-1 flex items-center justify-center">
                      <button
                        onClick={() => removeDomain(idx)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* DOE 操作区 - 仅 DOE 模式显示 */}
          {currentAlgType === AlgType.DOE && (
            <div className="mt-3 space-y-3">
              <button
                onClick={generateDoeCombinations}
                disabled={(config.params.optParams?.domain || []).length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <CheckCircleIcon className="w-4 h-4" />
                {t('sub.params.doe_verify_btn')}
              </button>
              {doeValidationError && (
                <div className="px-3 py-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
                  {doeValidationError}
                </div>
              )}

              {/* DOE 参数组合表格 - 内联显示 */}
              {config.params.optParams?.doeParamData &&
                config.params.optParams.doeParamData.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-green-600 dark:text-green-400">
                        {t('sub.params.doe_total')}: {config.params.optParams.doeParamData.length}{' '}
                        {t('sub.params.doe_rounds')}
                      </div>
                      <button
                        onClick={addDoeRow}
                        className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
                      >
                        <PlusIcon className="w-4 h-4" />
                        {t('sub.params.doe_add_row')}
                      </button>
                    </div>
                    <div className="border rounded-lg dark:border-slate-600 overflow-hidden">
                      <div className="max-h-[300px] overflow-auto custom-scrollbar">
                        <div
                          className="grid gap-px bg-slate-200 dark:bg-slate-600 eyecare:bg-border"
                          style={{
                            gridTemplateColumns: `50px repeat(${config.params.optParams.doeParamHeads?.length || 0}, minmax(80px, 1fr)) 40px`,
                          }}
                        >
                          {/* 表头 */}
                          <div className="bg-slate-100 dark:bg-slate-700 eyecare:bg-muted px-2 py-2 text-xs font-medium text-center">
                            #
                          </div>
                          {(config.params.optParams.doeParamHeads || []).map(h => (
                            <div
                              key={h}
                              className="bg-slate-100 dark:bg-slate-700 eyecare:bg-muted px-2 py-2 text-xs font-medium text-center"
                            >
                              {h}
                            </div>
                          ))}
                          <div className="bg-slate-100 dark:bg-slate-700 eyecare:bg-muted"></div>

                          {/* 数据行 */}
                          {config.params.optParams.doeParamData.map((row, rowIdx) => (
                            <React.Fragment key={rowIdx}>
                              <div className="bg-white dark:bg-slate-800 eyecare:bg-card px-2 py-1 text-xs text-center text-slate-500">
                                {rowIdx + 1}
                              </div>
                              {(config.params.optParams.doeParamHeads || []).map(h => (
                                <div
                                  key={h}
                                  className="bg-white dark:bg-slate-800 eyecare:bg-card p-0.5"
                                >
                                  <input
                                    type="text"
                                    className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:ring-1 focus:ring-brand-500 rounded text-center"
                                    value={row[h] ?? ''}
                                    onChange={e => updateDoeCell(rowIdx, h, e.target.value)}
                                  />
                                </div>
                              ))}
                              <div className="bg-white dark:bg-slate-800 eyecare:bg-card flex items-center justify-center">
                                <button
                                  onClick={() => removeDoeRow(rowIdx)}
                                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                >
                                  <TrashIcon className="w-3 h-3" />
                                </button>
                              </div>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      )}

      {/* DOE 文件上传 - 仅 DOE_FILE 模式显示 */}
      {currentAlgType === AlgType.DOE_FILE && (
        <div>
          <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300 eyecare:text-foreground">
            {t('sub.params.doe_file_upload')}
          </label>
          <label className="block border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 text-center cursor-pointer hover:border-brand-400 transition-colors">
            <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            <DocumentArrowUpIcon className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-sm text-slate-500">{t('sub.params.doe_file_hint')}</p>
            {doeFileName && <p className="text-sm text-brand-600 mt-2">{doeFileName}</p>}
          </label>

          {/* DOE 文件解析表格 - 只读显示 */}
          {config.params.optParams?.doeParamData &&
            config.params.optParams.doeParamData.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-sm text-green-600 dark:text-green-400">
                  {t('sub.params.doe_total')}: {config.params.optParams.doeParamData.length}{' '}
                  {t('sub.params.doe_rounds')}
                </div>
                <div className="border rounded-lg dark:border-slate-600 overflow-hidden">
                  <div className="max-h-[300px] overflow-auto custom-scrollbar">
                    <div
                      className="grid gap-px bg-slate-200 dark:bg-slate-600 eyecare:bg-border"
                      style={{
                        gridTemplateColumns: `50px repeat(${config.params.optParams.doeParamHeads?.length || 0}, minmax(80px, 1fr))`,
                      }}
                    >
                      {/* 表头 */}
                      <div className="bg-slate-100 dark:bg-slate-700 eyecare:bg-muted px-2 py-2 text-xs font-medium text-center">
                        #
                      </div>
                      {(config.params.optParams.doeParamHeads || []).map(h => (
                        <div
                          key={h}
                          className="bg-slate-100 dark:bg-slate-700 eyecare:bg-muted px-2 py-2 text-xs font-medium text-center"
                        >
                          {h}
                        </div>
                      ))}

                      {/* 数据行 - 只读 */}
                      {config.params.optParams.doeParamData.map((row, rowIdx) => (
                        <React.Fragment key={rowIdx}>
                          <div className="bg-white dark:bg-slate-800 eyecare:bg-card px-2 py-1 text-xs text-center text-slate-500">
                            {rowIdx + 1}
                          </div>
                          {(config.params.optParams.doeParamHeads || []).map(h => (
                            <div
                              key={h}
                              className="bg-white dark:bg-slate-800 eyecare:bg-card px-2 py-1 text-xs text-center"
                            >
                              {row[h]}
                            </div>
                          ))}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      )}

      {/* 批次配置 - 仅贝叶斯模式显示 */}
      {currentAlgType === AlgType.BAYESIAN && (
        <div>
          <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300 eyecare:text-foreground">
            {t('sub.params.batch_config')}
          </label>

          {/* 批次类型切换 */}
          <div className="flex bg-slate-100 dark:bg-slate-700 eyecare:bg-muted rounded-lg p-1 mb-3">
            <button
              onClick={() => updateOptParams({ batchSizeType: 1 })}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                batchSizeType === 1
                  ? 'bg-white dark:bg-slate-600 shadow text-brand-600'
                  : 'text-slate-500'
              }`}
            >
              {t('sub.params.batch_fixed')}
            </button>
            <button
              onClick={() => updateOptParams({ batchSizeType: 2 })}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                batchSizeType === 2
                  ? 'bg-white dark:bg-slate-600 shadow text-brand-600'
                  : 'text-slate-500'
              }`}
            >
              {t('sub.params.batch_custom')}
            </button>
          </div>

          {/* 固定批次配置 - 表格形式 */}
          {batchSizeType === 1 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-500">{t('sub.params.batch_list')}</span>
                <button
                  onClick={addBatchSize}
                  className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
                >
                  <PlusIcon className="w-4 h-4" />
                  {t('sub.params.add_batch')}
                </button>
              </div>
              <div className="border rounded-lg dark:border-slate-600 overflow-hidden">
                <div className="grid grid-cols-[60px_1fr_40px] bg-slate-100 dark:bg-slate-700 eyecare:bg-muted text-xs font-medium text-slate-600 dark:text-slate-300">
                  <div className="px-2 py-2 border-r dark:border-slate-600 text-center">
                    {t('sub.params.batch_round')}
                  </div>
                  <div className="px-2 py-2 border-r dark:border-slate-600 text-center">
                    {t('sub.params.batch_size')}
                  </div>
                  <div className="px-2 py-2"></div>
                </div>
                <div className="max-h-[150px] overflow-y-auto custom-scrollbar">
                  {batchSizeList.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-[60px_1fr_40px] border-t dark:border-slate-600"
                    >
                      <div className="px-2 py-1 border-r dark:border-slate-600 text-center text-sm text-slate-500">
                        {idx + 1}
                      </div>
                      <div className="px-1 py-1 border-r dark:border-slate-600">
                        <input
                          type="number"
                          min="1"
                          className="w-full px-1 py-1 text-sm border-0 bg-transparent focus:ring-1 focus:ring-brand-500 rounded text-center"
                          value={item.value}
                          onChange={e => updateBatchSize(idx, Number(e.target.value) || 1)}
                        />
                      </div>
                      <div className="px-1 py-1 flex items-center justify-center">
                        <button
                          onClick={() => removeBatchSize(idx)}
                          disabled={batchSizeList.length <= 2}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 自定义批次配置 - 表格形式 */}
          {batchSizeType === 2 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-500">{t('sub.params.custom_batch_list')}</span>
                <button
                  onClick={addCustomBatchSize}
                  className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
                >
                  <PlusIcon className="w-4 h-4" />
                  {t('sub.params.add_batch')}
                </button>
              </div>
              <div className="border rounded-lg dark:border-slate-600 overflow-hidden">
                <div className="grid grid-cols-[70px_70px_1fr_40px] bg-slate-100 dark:bg-slate-700 eyecare:bg-muted text-xs font-medium text-slate-600 dark:text-slate-300">
                  <div className="px-2 py-2 border-r dark:border-slate-600 text-center">
                    {t('sub.params.start_idx')}
                  </div>
                  <div className="px-2 py-2 border-r dark:border-slate-600 text-center">
                    {t('sub.params.end_idx')}
                  </div>
                  <div className="px-2 py-2 border-r dark:border-slate-600 text-center">
                    {t('sub.params.batch_size')}
                  </div>
                  <div className="px-2 py-2"></div>
                </div>
                <div className="max-h-[150px] overflow-y-auto custom-scrollbar">
                  {customBatchSizeList.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm text-slate-400">
                      {t('sub.params.add_batch')}
                    </div>
                  ) : (
                    customBatchSizeList.map((item, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-[70px_70px_1fr_40px] border-t dark:border-slate-600"
                      >
                        <div className="px-1 py-1 border-r dark:border-slate-600">
                          <input
                            type="number"
                            min="0"
                            className="w-full px-1 py-1 text-sm border-0 bg-transparent focus:ring-1 focus:ring-brand-500 rounded text-center"
                            value={item.startIndex}
                            onChange={e =>
                              updateCustomBatchSize(idx, {
                                startIndex: Number(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div className="px-1 py-1 border-r dark:border-slate-600">
                          <input
                            type="number"
                            min="0"
                            className="w-full px-1 py-1 text-sm border-0 bg-transparent focus:ring-1 focus:ring-brand-500 rounded text-center"
                            value={item.endIndex}
                            onChange={e =>
                              updateCustomBatchSize(idx, { endIndex: Number(e.target.value) || 0 })
                            }
                          />
                        </div>
                        <div className="px-1 py-1 border-r dark:border-slate-600">
                          <input
                            type="number"
                            min="1"
                            className="w-full px-1 py-1 text-sm border-0 bg-transparent focus:ring-1 focus:ring-brand-500 rounded text-center"
                            value={item.value}
                            onChange={e =>
                              updateCustomBatchSize(idx, { value: Number(e.target.value) || 1 })
                            }
                          />
                        </div>
                        <div className="px-1 py-1 flex items-center justify-center">
                          <button
                            onClick={() => removeCustomBatchSize(idx)}
                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
