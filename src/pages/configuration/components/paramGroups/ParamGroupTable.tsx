import React from 'react';
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import type { ParamGroup, ParamInGroup } from '@/types/configGroups';
import type { ParamGroupTableRow } from './paramGroupTableRows';

type ProjectOption = {
  id: number;
  name: string;
};

type ParamGroupTableProps = {
  loading: boolean;
  rows: ParamGroupTableRow[];
  projects: ProjectOption[];
  groupParamsMap: Map<number, ParamInGroup[]>;
  searchTerm: string;
  onEditGroup: (group: ParamGroup) => void;
  onDeleteGroup: (groupId: number) => void;
  onOpenParamModal: (groupId: number) => void;
  onClearParams: (groupId: number) => void;
  onRemoveParam: (groupId: number, paramDefId: number) => void;
};

const headerClass =
  'px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 eyecare:text-foreground';

export const ParamGroupTable: React.FC<ParamGroupTableProps> = ({
  loading,
  rows,
  projects,
  groupParamsMap,
  searchTerm,
  onEditGroup,
  onDeleteGroup,
  onOpenParamModal,
  onClearParams,
  onRemoveParam,
}) => {
  const { t } = useI18n();

  if (loading) {
    return <div className="p-12 text-center text-slate-500">{t('cfg.param_group.loading')}</div>;
  }

  if (rows.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        {searchTerm ? t('cfg.param_group.empty_match') : t('cfg.param_group.empty')}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-700/50">
            <th className={`${headerClass} w-56`}>{t('cfg.param_group.name')}</th>
            <th className={`${headerClass} w-40`}>{t('cfg.param_group.param_key')}</th>
            <th className={`${headerClass} w-40`}>{t('cfg.param_group.param_name')}</th>
            <th className={`${headerClass} w-24`}>{t('cfg.param_group.default_value')}</th>
            <th className={`${headerClass} w-20`}>{t('common.unit')}</th>
            <th className={`${headerClass} w-24`}>{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {rows.map((row, index) => {
            const rowParam = row.param;
            return (
              <tr
                key={`${row.group.id}-${rowParam?.paramDefId || 'empty'}-${index}`}
                className="hover:bg-slate-50 dark:hover:bg-slate-700 eyecare:hover:bg-muted/30"
              >
                {row.rowSpan > 0 && (
                  <td
                    rowSpan={row.rowSpan}
                    className="border-r px-4 py-3 align-top dark:border-slate-700"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-white eyecare:text-foreground">
                          {row.group.name}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {(row.group.projectIds || []).length > 0 ? (
                            (row.group.projectIds || []).map(projectId => (
                              <span
                                key={projectId}
                                className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                              >
                                {projects.find(project => project.id === projectId)?.name ||
                                  `Project #${projectId}`}
                              </span>
                            ))
                          ) : (
                            <span className="rounded bg-slate-50 px-1.5 py-0.5 text-xs text-slate-500 dark:bg-slate-600/30 dark:text-slate-400">
                              {t('cfg.param_group.global')}
                            </span>
                          )}
                        </div>
                        {row.group.description && (
                          <div className="mt-1 text-xs text-slate-500">{row.group.description}</div>
                        )}
                        <div className="mt-1 text-xs text-slate-400">
                          {t('cfg.param_group.count', {
                            count: groupParamsMap.get(row.group.id)?.length || 0,
                          })}
                        </div>
                      </div>

                      <div className="ml-2 flex items-center gap-1">
                        <button
                          onClick={() => onOpenParamModal(row.group.id)}
                          className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          title={t('cfg.param_group.add_param')}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onClearParams(row.group.id)}
                          className="rounded-lg p-1.5 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30"
                          title={t('cfg.param_group.clear_params')}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEditGroup(row.group)}
                          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 eyecare:hover:bg-muted"
                          title={t('cfg.param_group.edit')}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteGroup(row.group.id)}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                          title={t('cfg.param_group.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </td>
                )}

                <td className="px-4 py-3">
                  {rowParam ? (
                    <span className="font-mono text-xs text-slate-600 dark:text-slate-400 eyecare:text-muted-foreground">
                      {rowParam.paramKey}
                    </span>
                  ) : (
                    <span className="text-sm italic text-slate-400">
                      {t('cfg.param_group.no_params')}
                    </span>
                  )}
                </td>

                <td className="px-4 py-3">
                  {rowParam && (
                    <span className="text-slate-900 dark:text-white eyecare:text-foreground">
                      {rowParam.paramName}
                    </span>
                  )}
                </td>

                <td className="px-4 py-3">
                  {rowParam && (
                    <span className="text-slate-500">{rowParam.defaultValue || '-'}</span>
                  )}
                </td>

                <td className="px-4 py-3">
                  {rowParam && <span className="text-slate-500">{rowParam.unit || '-'}</span>}
                </td>

                <td className="px-4 py-3">
                  {rowParam && (
                    <button
                      onClick={() => onRemoveParam(row.group.id, rowParam.paramDefId)}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                      title={t('cfg.param_group.remove_param')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
