import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import type { OutputGroup } from '@/types/configGroups';
import type { OutputGroupTableRow } from './outputGroupTableRows';

interface OutputGroupsTableProps {
  loading: boolean;
  rows: OutputGroupTableRow[];
  onEdit: (group: Partial<OutputGroup>) => void;
  onDeleteGroup: (groupId: number) => void;
  onRemoveOutput: (groupId: number, outputDefId: number) => void;
}

const actionButtonClass =
  'rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground';

export const OutputGroupsTable: React.FC<OutputGroupsTableProps> = ({
  loading,
  rows,
  onEdit,
  onDeleteGroup,
  onRemoveOutput,
}) => {
  const { t } = useI18n();

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">{t('common.loading')}</div>;
  }

  if (rows.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">{t('common.noData')}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
              {t('cfg.output_group.name')}
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
              {t('common.description')}
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
              {t('cfg.output_group.output_count')}
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
              {t('cfg.outputs.name')}
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
              {t('common.code')}
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
              {t('common.unit')}
            </th>
            <th className="px-4 py-3 text-center text-sm font-medium text-foreground">
              {t('common.actions')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.group.id}-${index}`} className="border-t border-border">
              {row.rowSpan > 0 && (
                <>
                  <td className="px-4 py-3" rowSpan={row.rowSpan}>
                    <div className="font-medium text-foreground">{row.group.name}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {row.projectNames.length > 0 ? (
                        row.projectNames.map(projectName => (
                          <span
                            key={`${row.group.id}-${projectName}`}
                            className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary"
                          >
                            {projectName}
                          </span>
                        ))
                      ) : (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                          {t('cfg.param_group.global')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground" rowSpan={row.rowSpan}>
                    {row.group.description || '-'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground" rowSpan={row.rowSpan}>
                    {row.outputCount}
                  </td>
                </>
              )}

              <td className="px-4 py-3">
                {row.output && <span className="text-foreground">{row.output.outputName}</span>}
              </td>
              <td className="px-4 py-3">
                {row.output && (
                  <span className="font-mono text-xs text-muted-foreground">
                    {row.output.outputCode}
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                {row.output && (
                  <span className="text-muted-foreground">{row.output.unit || '-'}</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-1">
                  {row.isFirstRow && (
                    <>
                      <button
                        onClick={() => onEdit(row.group)}
                        className={actionButtonClass}
                        title={t('cfg.output_group.edit_group')}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteGroup(row.group.id)}
                        className={actionButtonClass}
                        title={t('cfg.output_group.delete_group')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  {row.output && (
                    <button
                      onClick={() => onRemoveOutput(row.group.id, row.output!.outputDefId)}
                      className={actionButtonClass}
                      title={t('cfg.output_group.remove_output')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
