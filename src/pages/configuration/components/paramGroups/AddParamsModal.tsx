import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { configApi } from '@/api';
import type { ParamDef } from '@/api';
import { useI18n } from '@/hooks/useI18n';
import type { SearchParamResult } from '@/types/configGroups';
import {
  managementInlineInputClass,
  managementModalOverlayClass,
  managementModalPanelClass,
  managementPrimaryButtonDisabledClass,
  managementSearchInputClass,
  managementSecondaryButtonClass,
} from '../managementSurfaceTokens';

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
  const { t } = useI18n();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchParamResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newParamData, setNewParamData] = useState({ key: '', name: '', unit: '' });
  const [creating, setCreating] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const availableParams = paramDefs.filter(param => !existingParamIds.has(param.id));
  const filteredParams = availableParams.filter(
    param =>
      !searchTerm ||
      param.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      param.key.toLowerCase().includes(searchTerm.toLowerCase())
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
        console.error('Failed to search parameters:', error);
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
    const nextSelectedIds = new Set(selectedIds);
    if (nextSelectedIds.has(id)) {
      nextSelectedIds.delete(id);
    } else {
      nextSelectedIds.add(id);
    }
    setSelectedIds(nextSelectedIds);
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredParams.map(param => param.id)));
  };

  const clearAll = () => {
    setSelectedIds(new Set());
  };

  const handleCreateAndAdd = async () => {
    if (!newParamData.key.trim()) {
      showToast('warning', t('cfg.param_group.key_required'));
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
          t('cfg.param_group.create_add_success', {
            name: res.data.param.paramName,
            createdText: res.data.created ? t('cfg.param_group.created_text') : '',
          })
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
      console.error('Failed to create parameter:', error);
      const errMsg = (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      showToast('error', errMsg || t('cfg.param_group.create_failed'));
    } finally {
      setCreating(false);
    }
  };

  const displayParams =
    searchTerm.trim().length >= 2 && searchResults.length > 0
      ? searchResults.filter(param => !param.inGroup)
      : filteredParams;

  return (
    <div className={managementModalOverlayClass}>
      <div
        className={`${managementModalPanelClass} mx-4 flex max-h-[80vh] w-full max-w-lg flex-col`}
      >
        <div className="border-b p-4 dark:border-slate-700">
          <h3 className="text-lg font-bold">
            {t('cfg.param_group.add_params_title', { name: groupName })}
          </h3>
          <p className="mt-1 text-sm text-slate-500">{t('cfg.param_group.add_params_desc')}</p>
        </div>

        <div className="space-y-3 border-b p-4 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('cfg.param_group.search_placeholder')}
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              className={managementSearchInputClass}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">
              {t('cfg.param_group.selected_count', { count: selectedIds.size })}
            </span>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-blue-600 hover:underline">
                {t('cfg.param_group.select_all')}
              </button>
              <button onClick={clearAll} className="text-slate-500 hover:underline">
                {t('common.clear')}
              </button>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-1 text-green-600 hover:underline"
              >
                <Plus className="h-3 w-3" />
                {t('cfg.param_group.quick_create')}
              </button>
            </div>
          </div>
        </div>

        {showCreateForm && (
          <div className="border-b bg-green-50 p-4 dark:border-slate-700 dark:bg-green-900/20">
            <h4 className="mb-3 text-sm font-medium text-green-700 dark:text-green-400">
              {t('cfg.param_group.quick_create_title')}
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder={`${t('common.key')} *`}
                value={newParamData.key}
                onChange={event => setNewParamData(prev => ({ ...prev, key: event.target.value }))}
                className={managementInlineInputClass}
              />
              <input
                type="text"
                placeholder={t('common.name')}
                value={newParamData.name}
                onChange={event => setNewParamData(prev => ({ ...prev, name: event.target.value }))}
                className={managementInlineInputClass}
              />
              <input
                type="text"
                placeholder={t('common.unit')}
                value={newParamData.unit}
                onChange={event => setNewParamData(prev => ({ ...prev, unit: event.target.value }))}
                className={managementInlineInputClass}
              />
            </div>
            <div className="mt-2 flex justify-end">
              <button
                onClick={handleCreateAndAdd}
                disabled={creating || !newParamData.key.trim()}
                className="rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50"
              >
                {creating ? t('cfg.param_group.creating') : t('cfg.param_group.create_and_add')}
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {displayParams.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              {searchTerm ? (
                <div>
                  <p>{t('cfg.param_group.no_match')}</p>
                  <button
                    onClick={() => {
                      setNewParamData(prev => ({ ...prev, key: searchTerm }));
                      setShowCreateForm(true);
                    }}
                    className="mt-2 text-green-600 hover:underline"
                  >
                    {t('cfg.param_group.create_keyword', { keyword: searchTerm })}
                  </button>
                </div>
              ) : (
                t('cfg.param_group.no_available')
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
                    className={`flex cursor-pointer items-center rounded-lg p-3 transition-colors ${
                      selectedIds.has(paramId)
                        ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-2 border-transparent bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 eyecare:hover:bg-muted'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(paramId)}
                      onChange={() => toggleParam(paramId)}
                      className="mr-3 rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{paramName}</div>
                      <div className="font-mono text-xs text-slate-500">{paramKey}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t p-4 dark:border-slate-700">
          <button onClick={onClose} className={managementSecondaryButtonClass}>
            {t('common.cancel')}
          </button>
          <button
            onClick={() => onAdd(groupId, Array.from(selectedIds))}
            disabled={selectedIds.size === 0}
            className={managementPrimaryButtonDisabledClass}
          >
            {t('common.add')} ({selectedIds.size})
          </button>
        </div>
      </div>
    </div>
  );
};
