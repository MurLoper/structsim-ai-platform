import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  DocumentArrowUpIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { FormItem, Alert, Button } from '@/components/ui';
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
  // 参数组选择状态
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(
    config.params.templateSetId || null
  );
  // 核验状态: null=未核验, true=通过, false=失败
  const [verifyStatus, setVerifyStatus] = useState<boolean | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<string>('');
  // 自动应用标记
  const autoAppliedRef = useRef(false);

  // 获取当前算法类型
  const currentAlgType = config.params.optParams?.algType ?? AlgType.DOE;

  // 根据工况配置 + 算法类型筛选参数组
  const filteredParamGroups = useMemo(() => {
    let groups = paramGroups;

    // 1. 按工况配置过滤
    if (conditionConfig?.paramGroupIds?.length) {
      groups = groups.filter(g => conditionConfig.paramGroupIds.includes(g.id));
    }

    return groups;
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

  // 应用参数组（从下拉选择的组），返回生成的 domain 供后续使用
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
      const params = await onFetchGroupParams(groupId);
      if (params && params.length > 0) {
        const algType = config.params.optParams?.algType ?? AlgType.DOE;
        const domain: ParamDomain[] = params.map(p => {
          const paramDef = paramDefs.find(def => def.id === p.paramDefId);
          const defaultValStr = p.defaultValue || paramDef?.defaultVal || '';
          const defaultVal = parseFloat(defaultValStr);
          // DOE模式：优先使用枚举值，否则用默认值
          const enumStr = p.enumValues || '';
          const useEnum = algType === AlgType.DOE && enumStr.trim().length > 0;
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
        // 同步更新 templateSetId + domain
        onUpdate({
          params: {
            ...config.params,
            templateSetId: groupId,
            optParams: {
              ...(config.params.optParams || {
                algType: AlgType.DOE,
                domain: [],
                batchSize: [{ value: 5 }],
                maxIter: 1,
              }),
              domain,
            },
          },
        });
        return domain;
      }
    } catch (error) {
      console.error('Failed to fetch param group:', error);
    } finally {
      setLoadingGroup(false);
    }
    return null;
  };

  // DOE 全组合生成（可接受外部 domain 参数，用于自动应用场景）
  const generateDoeCombinationsFromDomain = (domainInput?: ParamDomain[]) => {
    setDoeValidationError(null);
    const domain = domainInput || config.params.optParams?.domain || [];
    if (domain.length === 0) return;

    const heads = domain.map(d => d.paramName.trim()).filter(Boolean);
    if (heads.length !== domain.length) return;

    const valueLists = domain.map(d => {
      if (d.rangeList && d.rangeList.length > 0) return d.rangeList;
      if (d.range) {
        return d.range
          .split(',')
          .map(v => Number(v.trim()))
          .filter(v => !isNaN(v));
      }
      return [];
    });
    if (valueLists.some(list => list.length === 0)) return;

    const cartesian = (...arrays: number[][]): number[][] =>
      arrays.reduce<number[][]>((acc, arr) => acc.flatMap(x => arr.map(y => [...x, y])), [[]]);
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

  // 自动应用默认参数组（首次加载时）
  useEffect(() => {
    if (autoAppliedRef.current) return;
    if (!onFetchGroupParams || filteredParamGroups.length === 0) return;
    // 如果已有 domain 数据，不自动覆盖
    if ((config.params.optParams?.domain || []).length > 0) return;

    autoAppliedRef.current = true;
    // 选择第一个参数组作为默认
    const defaultGroup = filteredParamGroups[0];
    setSelectedGroupId(defaultGroup.id);

    applyParamGroup(defaultGroup.id, true).then(domain => {
      // DOE 模式下自动生成全组合
      if (domain && (config.params.optParams?.algType ?? AlgType.DOE) === AlgType.DOE) {
        // 延迟一帧确保 state 已更新
        setTimeout(() => generateDoeCombinationsFromDomain(domain), 0);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredParamGroups, onFetchGroupParams]);

  // 核验参数域完整性
  const verifyParams = () => {
    const domain = config.params.optParams?.domain || [];
    if (domain.length === 0) {
      setVerifyStatus(false);
      setVerifyMessage(t('sub.params.verify_empty') || '参数域为空，请先应用参数组或手动添加参数');
      return;
    }

    const errors: string[] = [];
    domain.forEach((d, idx) => {
      if (!d.paramName.trim()) {
        errors.push(`#${idx + 1}: ${t('sub.params.verify_no_name') || '参数名为空'}`);
      }
      if (currentAlgType === AlgType.DOE) {
        if (!d.range && (!d.rangeList || d.rangeList.length === 0)) {
          errors.push(
            `${d.paramName || '#' + (idx + 1)}: ${t('sub.params.verify_no_values') || '取值为空'}`
          );
        }
      } else {
        // 贝叶斯模式检查 min < max
        if (d.minValue >= d.maxValue) {
          errors.push(`${d.paramName}: ${t('sub.params.verify_range_error') || 'min >= max'}`);
        }
      }
    });

    if (errors.length > 0) {
      setVerifyStatus(false);
      setVerifyMessage(errors.join('；'));
    } else {
      setVerifyStatus(true);
      setVerifyMessage(
        `${t('sub.params.verify_pass') || '核验通过'}：${domain.length} ${t('sub.params.verify_params_count') || '个参数'}`
      );
    }
  };

  return (
    <div className="space-y-5 pb-6">
      {/* 参数组选择+应用+核验 */}
      {filteredParamGroups.length > 0 && (
        <FormItem label={t('sub.params.apply_group')}>
          <div className="flex gap-2 items-center">
            <select
              className="flex-1 p-2.5 border rounded-lg bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              value={selectedGroupId || ''}
              onChange={e => {
                const id = Number(e.target.value) || null;
                setSelectedGroupId(id);
                setVerifyStatus(null);
                setVerifyMessage('');
              }}
            >
              <option value="">-- {t('sub.params.select_group') || '选择参数组'} --</option>
              {filteredParamGroups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="primary"
              disabled={!selectedGroupId || loadingGroup}
              onClick={() => {
                if (!selectedGroupId) return;
                applyParamGroup(selectedGroupId).then(domain => {
                  if (domain && (config.params.optParams?.algType ?? AlgType.DOE) === AlgType.DOE) {
                    setTimeout(() => generateDoeCombinationsFromDomain(domain), 0);
                  }
                });
              }}
            >
              {loadingGroup ? t('sub.loading') || '加载中...' : t('sub.params.apply') || '应用'}
            </Button>
            <Button size="sm" variant="outline" onClick={verifyParams}>
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              {t('sub.params.verify') || '核验'}
            </Button>
          </div>
          {/* 核验结果提示 */}
          {verifyStatus !== null && (
            <div
              className={`mt-2 text-xs px-3 py-2 rounded-lg ${
                verifyStatus
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }`}
            >
              {verifyStatus ? '✓ ' : '✗ '}
              {verifyMessage}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">{t('sub.params.apply_group_hint')}</p>
        </FormItem>
      )}

      {/* 优化算法选择 */}
      <FormItem label={t('sub.params.alg_type')}>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => updateOptParams({ algType: AlgType.BAYESIAN })}
            className={`p-3 rounded-lg border-2 transition-all ${
              currentAlgType === AlgType.BAYESIAN
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="text-sm font-bold text-primary">{t('sub.params.bayesian')}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {t('sub.params.bayesian_desc')}
            </div>
          </button>
          <button
            onClick={() => updateOptParams({ algType: AlgType.DOE })}
            className={`p-3 rounded-lg border-2 transition-all ${
              currentAlgType === AlgType.DOE
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="text-sm font-bold text-primary">{t('sub.params.doe')}</div>
            <div className="text-xs text-muted-foreground mt-1">{t('sub.params.doe_desc')}</div>
          </button>
          <button
            onClick={() => updateOptParams({ algType: AlgType.DOE_FILE })}
            className={`p-3 rounded-lg border-2 transition-all ${
              currentAlgType === AlgType.DOE_FILE
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="text-sm font-bold text-primary">{t('sub.params.doe_file')}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {t('sub.params.doe_file_desc')}
            </div>
          </button>
        </div>
      </FormItem>

      {/* 参数域配置 - 贝叶斯和 DOE 模式显示 */}
      {(currentAlgType === AlgType.BAYESIAN || currentAlgType === AlgType.DOE) && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-foreground">{t('sub.params.domain')}</span>
            <button
              onClick={addDomain}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
            >
              <PlusIcon className="w-4 h-4" />
              {t('sub.params.add_param')}
            </button>
          </div>

          {/* 表格形式展示 */}
          <div className="border border-border rounded-lg overflow-hidden">
            {/* 表头 */}
            <div
              className={`grid ${currentAlgType === AlgType.DOE ? 'grid-cols-[100px_1fr_40px]' : 'grid-cols-[100px_1fr_1fr_1fr_40px]'} bg-muted text-xs font-medium text-muted-foreground`}
            >
              <div className="px-2 py-2 border-r border-border">{t('sub.params.param_name')}</div>
              {currentAlgType === AlgType.DOE ? (
                <div className="px-2 py-2 border-r border-border">{t('sub.values')}</div>
              ) : (
                <>
                  <div className="px-2 py-2 border-r border-border text-center">{t('sub.min')}</div>
                  <div className="px-2 py-2 border-r border-border text-center">{t('sub.max')}</div>
                  <div className="px-2 py-2 border-r border-border text-center">
                    {t('sub.params.init')}
                  </div>
                </>
              )}
              <div className="px-2 py-2"></div>
            </div>

            {/* 表格内容 */}
            <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
              {(config.params.optParams?.domain || []).length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  {t('sub.params.add_param')}
                </div>
              ) : (
                (config.params.optParams?.domain || []).map((domain, idx) => (
                  <div
                    key={idx}
                    className={`grid ${currentAlgType === AlgType.DOE ? 'grid-cols-[100px_1fr_40px]' : 'grid-cols-[100px_1fr_1fr_1fr_40px]'} border-t border-border hover:bg-muted/50`}
                  >
                    <div className="px-1 py-1 border-r border-border">
                      <input
                        type="text"
                        className="w-full px-1 py-1 text-sm border-0 bg-transparent focus:ring-1 focus:ring-ring rounded"
                        placeholder="name"
                        value={domain.paramName}
                        onChange={e => updateDomain(idx, { paramName: e.target.value })}
                      />
                    </div>
                    {currentAlgType === AlgType.DOE ? (
                      <div className="px-1 py-1 border-r border-border">
                        <input
                          type="text"
                          className="w-full px-1 py-1 text-sm border-0 bg-transparent focus:ring-1 focus:ring-ring rounded"
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
                        <div className="px-1 py-1 border-r border-border">
                          <input
                            type="number"
                            className="w-full px-1 py-1 text-sm border-0 bg-transparent focus:ring-1 focus:ring-ring rounded text-center"
                            value={domain.minValue}
                            onChange={e => updateDomain(idx, { minValue: Number(e.target.value) })}
                          />
                        </div>
                        <div className="px-1 py-1 border-r border-border">
                          <input
                            type="number"
                            className="w-full px-1 py-1 text-sm border-0 bg-transparent focus:ring-1 focus:ring-ring rounded text-center"
                            value={domain.maxValue}
                            onChange={e => updateDomain(idx, { maxValue: Number(e.target.value) })}
                          />
                        </div>
                        <div className="px-1 py-1 border-r border-border">
                          <input
                            type="number"
                            className="w-full px-1 py-1 text-sm border-0 bg-transparent focus:ring-1 focus:ring-ring rounded text-center"
                            value={domain.initValue}
                            onChange={e => updateDomain(idx, { initValue: Number(e.target.value) })}
                          />
                        </div>
                      </>
                    )}
                    <div className="px-1 py-1 flex items-center justify-center">
                      <button
                        onClick={() => removeDomain(idx)}
                        className="p-1 text-destructive hover:bg-destructive/10 rounded"
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
              <Button
                onClick={generateDoeCombinations}
                disabled={(config.params.optParams?.domain || []).length === 0}
                className="w-full"
              >
                <CheckCircleIcon className="w-4 h-4" />
                {t('sub.params.doe_verify_btn')}
              </Button>
              {doeValidationError && <Alert type="error">{doeValidationError}</Alert>}

              {/* DOE 参数组合表格 - 内联显示 */}
              {config.params.optParams?.doeParamData &&
                config.params.optParams?.doeParamData.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-primary">
                        {t('sub.params.doe_total')}: {config.params.optParams?.doeParamData.length}{' '}
                        {t('sub.params.doe_rounds')}
                      </div>
                      <button
                        onClick={addDoeRow}
                        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
                      >
                        <PlusIcon className="w-4 h-4" />
                        {t('sub.params.doe_add_row')}
                      </button>
                    </div>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <div className="max-h-[300px] overflow-auto custom-scrollbar">
                        <div
                          className="grid gap-px bg-border"
                          style={{
                            gridTemplateColumns: `50px repeat(${config.params.optParams?.doeParamHeads?.length || 0}, minmax(80px, 1fr)) 40px`,
                          }}
                        >
                          {/* 表头 */}
                          <div className="bg-muted px-2 py-2 text-xs font-medium text-center">
                            #
                          </div>
                          {(config.params?.optParams?.doeParamHeads || []).map(h => (
                            <div
                              key={h}
                              className="bg-muted px-2 py-2 text-xs font-medium text-center"
                            >
                              {h}
                            </div>
                          ))}
                          <div className="bg-muted"></div>

                          {/* 数据行 */}
                          {config.params.optParams?.doeParamData.map((row, rowIdx) => (
                            <React.Fragment key={rowIdx}>
                              <div className="bg-card px-2 py-1 text-xs text-center text-muted-foreground">
                                {rowIdx + 1}
                              </div>
                              {(config.params?.optParams?.doeParamHeads || []).map(h => (
                                <div key={h} className="bg-card p-0.5">
                                  <input
                                    type="text"
                                    className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:ring-1 focus:ring-ring rounded text-center"
                                    value={row[h] ?? ''}
                                    onChange={e => updateDoeCell(rowIdx, h, e.target.value)}
                                  />
                                </div>
                              ))}
                              <div className="bg-card flex items-center justify-center">
                                <button
                                  onClick={() => removeDoeRow(rowIdx)}
                                  className="p-1 text-destructive hover:bg-destructive/10 rounded"
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
        <FormItem label={t('sub.params.doe_file_upload')}>
          <label className="block border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors">
            <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            <DocumentArrowUpIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t('sub.params.doe_file_hint')}</p>
            {doeFileName && <p className="text-sm text-primary mt-2">{doeFileName}</p>}
          </label>

          {/* DOE 文件解析表格 - 只读显示 */}
          {config.params.optParams?.doeParamData &&
            config.params.optParams?.doeParamData.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-sm text-primary">
                  {t('sub.params.doe_total')}: {config.params.optParams?.doeParamData.length}{' '}
                  {t('sub.params.doe_rounds')}
                </div>
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="max-h-[300px] overflow-auto custom-scrollbar">
                    <div
                      className="grid gap-px bg-border"
                      style={{
                        gridTemplateColumns: `50px repeat(${config.params.optParams?.doeParamHeads?.length || 0}, minmax(80px, 1fr))`,
                      }}
                    >
                      {/* 表头 */}
                      <div className="bg-muted px-2 py-2 text-xs font-medium text-center">#</div>
                      {(config.params.optParams?.doeParamHeads || []).map(h => (
                        <div key={h} className="bg-muted px-2 py-2 text-xs font-medium text-center">
                          {h}
                        </div>
                      ))}

                      {/* 数据行 - 只读 */}
                      {config.params.optParams?.doeParamData.map((row, rowIdx) => (
                        <React.Fragment key={rowIdx}>
                          <div className="bg-card px-2 py-1 text-xs text-center text-muted-foreground">
                            {rowIdx + 1}
                          </div>
                          {(config.params?.optParams?.doeParamHeads || []).map(h => (
                            <div key={h} className="bg-card px-2 py-1 text-xs text-center">
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
        </FormItem>
      )}

      {/* 批次配置 - 仅贝叶斯模式显示 */}
      {currentAlgType === AlgType.BAYESIAN && (
        <div>
          <FormItem label={t('sub.params.batch_config')}>
            {/* 批次类型切换 */}
            <div className="flex bg-muted rounded-lg p-1 mb-3">
              <button
                onClick={() => updateOptParams({ batchSizeType: 1 })}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  batchSizeType === 1 ? 'bg-card shadow text-primary' : 'text-muted-foreground'
                }`}
              >
                {t('sub.params.batch_fixed')}
              </button>
              <button
                onClick={() => updateOptParams({ batchSizeType: 2 })}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  batchSizeType === 2 ? 'bg-card shadow text-primary' : 'text-muted-foreground'
                }`}
              >
                {t('sub.params.batch_custom')}
              </button>
            </div>

            {/* 固定批次配置 - 表格形式 */}
            {batchSizeType === 1 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-muted-foreground">
                    {t('sub.params.batch_list')}
                  </span>
                  <button
                    onClick={addBatchSize}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
                  >
                    <PlusIcon className="w-4 h-4" />
                    {t('sub.params.add_batch')}
                  </button>
                </div>
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-[60px_1fr_40px] bg-muted text-xs font-medium text-muted-foreground">
                    <div className="px-2 py-2 border-r border-border text-center">
                      {t('sub.params.batch_round')}
                    </div>
                    <div className="px-2 py-2 border-r border-border text-center">
                      {t('sub.params.batch_size')}
                    </div>
                    <div className="px-2 py-2"></div>
                  </div>
                  <div className="max-h-[150px] overflow-y-auto custom-scrollbar">
                    {batchSizeList.map((item, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-[60px_1fr_40px] border-t border-border"
                      >
                        <div className="px-2 py-1 border-r border-border text-center text-sm text-muted-foreground">
                          {idx + 1}
                        </div>
                        <div className="px-1 py-1 border-r border-border">
                          <input
                            type="number"
                            min="1"
                            className="w-full px-1 py-1 text-sm border-0 bg-transparent focus:ring-1 focus:ring-ring rounded text-center"
                            value={item.value}
                            onChange={e => updateBatchSize(idx, Number(e.target.value) || 1)}
                          />
                        </div>
                        <div className="px-1 py-1 flex items-center justify-center">
                          <button
                            onClick={() => removeBatchSize(idx)}
                            disabled={batchSizeList.length <= 2}
                            className="p-1 text-destructive hover:bg-destructive/10 rounded disabled:opacity-30 disabled:cursor-not-allowed"
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
                  <span className="text-xs text-muted-foreground">
                    {t('sub.params.custom_batch_list')}
                  </span>
                  <button
                    onClick={addCustomBatchSize}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
                  >
                    <PlusIcon className="w-4 h-4" />
                    {t('sub.params.add_batch')}
                  </button>
                </div>
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-[70px_70px_1fr_40px] bg-muted text-xs font-medium text-muted-foreground">
                    <div className="px-2 py-2 border-r border-border text-center">
                      {t('sub.params.start_idx')}
                    </div>
                    <div className="px-2 py-2 border-r border-border text-center">
                      {t('sub.params.end_idx')}
                    </div>
                    <div className="px-2 py-2 border-r border-border text-center">
                      {t('sub.params.batch_size')}
                    </div>
                    <div className="px-2 py-2"></div>
                  </div>
                  <div className="max-h-[150px] overflow-y-auto custom-scrollbar">
                    {customBatchSizeList.length === 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                        {t('sub.params.add_batch')}
                      </div>
                    ) : (
                      customBatchSizeList.map((item, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-[70px_70px_1fr_40px] border-t border-border"
                        >
                          <div className="px-1 py-1 border-r border-border">
                            <input
                              type="number"
                              min="0"
                              className="w-full px-1 py-1 text-sm border-0 bg-transparent focus:ring-1 focus:ring-ring rounded text-center"
                              value={item.startIndex}
                              onChange={e =>
                                updateCustomBatchSize(idx, {
                                  startIndex: Number(e.target.value) || 0,
                                })
                              }
                            />
                          </div>
                          <div className="px-1 py-1 border-r border-border">
                            <input
                              type="number"
                              min="0"
                              className="w-full px-1 py-1 text-sm border-0 bg-transparent focus:ring-1 focus:ring-ring rounded text-center"
                              value={item.endIndex}
                              onChange={e =>
                                updateCustomBatchSize(idx, {
                                  endIndex: Number(e.target.value) || 0,
                                })
                              }
                            />
                          </div>
                          <div className="px-1 py-1 border-r border-border">
                            <input
                              type="number"
                              min="1"
                              className="w-full px-1 py-1 text-sm border-0 bg-transparent focus:ring-1 focus:ring-ring rounded text-center"
                              value={item.value}
                              onChange={e =>
                                updateCustomBatchSize(idx, { value: Number(e.target.value) || 1 })
                              }
                            />
                          </div>
                          <div className="px-1 py-1 flex items-center justify-center">
                            <button
                              onClick={() => removeCustomBatchSize(idx)}
                              className="p-1 text-destructive hover:bg-destructive/10 rounded"
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
          </FormItem>
        </div>
      )}
    </div>
  );
};
