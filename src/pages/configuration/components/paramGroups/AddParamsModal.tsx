import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { configApi } from '@/api';
import type { ParamDef } from '@/api';
import type { SearchParamResult } from '@/types/configGroups';
import {
  managementInlineInputClass,
  managementModalOverlayClass,
  managementModalPanelClass,
  managementPrimaryButtonDisabledClass,
  managementSearchInputClass,
  managementSecondaryButtonClass,
} from '../sharedManagementStyles';

type AddParamsModalProps = {
  groupId: number;
  groupName: string;
  paramDefs: ParamDef[];
  existingParamIds: Set<number>;
  onAdd: (groupId: number, paramDefIds: number[]) => void;
  onClose: () => void;
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
};

export const AddParamsModal: React.FC<AddParamsModalProps> = ({
  groupId,
  groupName,
  paramDefs,
  existingParamIds,
  onAdd,
  onClose,
  onRefresh,
  showToast,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchParamResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newParamData, setNewParamData] = useState({ key: '', name: '', unit: '' });
  const [creating, setCreating] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const availableParams = paramDefs.filter(p => !existingParamIds.has(p.id));
  const filteredParams = availableParams.filter(
    p =>
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = useCallback(
    async (keyword: string) => {
      if (!keyword.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await configApi.searchParams(keyword, groupId);
        setSearchResults(res?.data?.params || []);
      } catch (error) {
        console.error('搜索参数失败:', error);
      } finally {
        setIsSearching(false);
      }
    },
    [groupId]
  );

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (searchTerm.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch(searchTerm);
      }, 300);
    } else {
      setSearchResults([]);
    }
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, handleSearch]);

  const toggleParam = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredParams.map(p => p.id)));
  };

  const clearAll = () => {
    setSelectedIds(new Set());
  };

  const handleCreateAndAdd = async () => {
    if (!newParamData.key.trim()) {
      showToast('warning', '参数Key不能为空');
      return;
    }
    setCreating(true);
    try {
      const res = await configApi.createAndAddParam(groupId, {
        key: newParamData.key.trim(),
        name: newParamData.name.trim() || newParamData.key.trim(),
        unit: newParamData.unit.trim() || undefined,
      });
      if (res?.data?.added) {
        showToast(
          'success',
          `参数「${res.data.param.paramName}」${res.data.created ? '创建并' : ''}添加成功`
        );
        setNewParamData({ key: '', name: '', unit: '' });
        setShowCreateForm(false);
        await onRefresh();
        if (searchTerm.trim().length >= 2) {
          handleSearch(searchTerm);
        }
      } else if (res?.data?.reason) {
        showToast('warning', res.data.reason);
      }
    } catch (error: unknown) {
      console.error('创建参数失败:', error);
      const errMsg = (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      showToast('error', errMsg || '创建失败');
    } finally {
      setCreating(false);
    }
  };

  const displayParams =
    searchTerm.trim().length >= 2 && searchResults.length > 0
      ? searchResults.filter(p => !p.inGroup)
      : filteredParams;

  return (
    <div className={managementModalOverlayClass}>
      <div
        className={`${managementModalPanelClass} w-full max-w-lg mx-4 max-h-[80vh] flex flex-col`}
      >
        <div className="p-4 border-b dark:border-slate-700">
          <h3 className="text-lg font-bold">添加参数到 {groupName}</h3>
          <p className="text-sm text-slate-500 mt-1">选择要添加的参数，或快速创建新参数</p>
        </div>

        <div className="p-4 border-b dark:border-slate-700 space-y-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索参数名称或 Key（输入2个字符开始搜索）..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={managementSearchInputClass}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">已选择 {selectedIds.size} 个参数</span>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-blue-600 hover:underline">
                全选
              </button>
              <button onClick={clearAll} className="text-slate-500 hover:underline">
                清空
              </button>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="text-green-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                快速创建
              </button>
            </div>
          </div>
        </div>

        {showCreateForm && (
          <div className="p-4 border-b dark:border-slate-700 bg-green-50 dark:bg-green-900/20">
            <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-3">
              快速创建新参数
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="参数Key *"
                value={newParamData.key}
                onChange={e => setNewParamData(prev => ({ ...prev, key: e.target.value }))}
                className={managementInlineInputClass}
              />
              <input
                type="text"
                placeholder="参数名称"
                value={newParamData.name}
                onChange={e => setNewParamData(prev => ({ ...prev, name: e.target.value }))}
                className={managementInlineInputClass}
              />
              <input
                type="text"
                placeholder="单位"
                value={newParamData.unit}
                onChange={e => setNewParamData(prev => ({ ...prev, unit: e.target.value }))}
                className={managementInlineInputClass}
              />
            </div>
            <div className="flex justify-end mt-2">
              <button
                onClick={handleCreateAndAdd}
                disabled={creating || !newParamData.key.trim()}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {creating ? '创建中...' : '创建并添加'}
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {displayParams.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {searchTerm ? (
                <div>
                  <p>未找到匹配的参数</p>
                  <button
                    onClick={() => {
                      setNewParamData(prev => ({ ...prev, key: searchTerm }));
                      setShowCreateForm(true);
                    }}
                    className="mt-2 text-green-600 hover:underline"
                  >
                    点击创建「{searchTerm}」
                  </button>
                </div>
              ) : (
                '没有可添加的参数'
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {displayParams.map(param => {
                const paramId = 'paramDefId' in param ? param.paramDefId : (param as ParamDef).id;
                const paramName = 'paramName' in param ? param.paramName : (param as ParamDef).name;
                const paramKey = 'paramKey' in param ? param.paramKey : (param as ParamDef).key;
                return (
                  <label
                    key={paramId}
                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedIds.has(paramId)
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                        : 'bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 eyecare:hover:bg-muted border-2 border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(paramId)}
                      onChange={() => toggleParam(paramId)}
                      className="rounded mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{paramName}</div>
                      <div className="text-xs text-slate-500 font-mono">{paramKey}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t dark:border-slate-700">
          <button onClick={onClose} className={managementSecondaryButtonClass}>
            取消
          </button>
          <button
            onClick={() => onAdd(groupId, Array.from(selectedIds))}
            disabled={selectedIds.size === 0}
            className={managementPrimaryButtonDisabledClass}
          >
            添加 ({selectedIds.size})
          </button>
        </div>
      </div>
    </div>
  );
};
