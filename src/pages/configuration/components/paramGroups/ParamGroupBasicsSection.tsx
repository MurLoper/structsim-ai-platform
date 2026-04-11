import React from 'react';
import { useI18n } from '@/hooks/useI18n';
import type { ParamGroupFormData } from './types';
import { managementFieldClass } from '../managementSurfaceTokens';

type ProjectOption = { id: number; name: string };

type ParamGroupBasicsSectionProps = {
  formData: ParamGroupFormData;
  projects: ProjectOption[];
  hasDoeFile: boolean;
  doePasteText: string;
  doeFileInputRef: React.RefObject<HTMLInputElement | null>;
  onFieldChange: (field: keyof ParamGroupFormData, value: unknown) => void;
  onDoePasteTextChange: (value: string) => void;
  onDoeTextareaPaste: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onDoeFileSelected: (file: File) => void;
  onDownloadDoeFile: () => void;
  onClearDoeFile: () => void;
};

export const ParamGroupBasicsSection: React.FC<ParamGroupBasicsSectionProps> = ({
  formData,
  projects,
  hasDoeFile,
  doePasteText,
  doeFileInputRef,
  onFieldChange,
  onDoePasteTextChange,
  onDoeTextareaPaste,
  onDoeFileSelected,
  onDownloadDoeFile,
  onClearDoeFile,
}) => {
  const { t } = useI18n();

  return (
    <>
      <div>
        <label className="mb-1 block text-sm font-medium">{t('common.name')} *</label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={event => onFieldChange('name', event.target.value)}
          className={managementFieldClass}
          placeholder={t('cfg.placeholder.name')}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t('common.description')}</label>
        <textarea
          value={formData.description || ''}
          onChange={event => onFieldChange('description', event.target.value)}
          className={managementFieldClass}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t('cfg.param_group.related_projects')}
          </label>
          <div className="max-h-[120px] space-y-1 overflow-y-auto rounded-lg border p-2 dark:border-slate-600">
            {projects.length === 0 ? (
              <span className="text-xs text-slate-400">{t('cfg.output_group.no_projects')}</span>
            ) : (
              projects.map(project => (
                <label
                  key={project.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <input
                    type="checkbox"
                    checked={(formData.projectIds || []).includes(project.id)}
                    onChange={event => {
                      const projectIds = formData.projectIds || [];
                      onFieldChange(
                        'projectIds',
                        event.target.checked
                          ? [...projectIds, project.id]
                          : projectIds.filter(id => id !== project.id)
                      );
                    }}
                    className="rounded"
                  />
                  {project.name}
                </label>
              ))
            )}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t('common.sort')}</label>
          <input
            type="number"
            value={formData.sort ?? 100}
            onChange={event => onFieldChange('sort', Number(event.target.value))}
            className={managementFieldClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t('cfg.param_group.default_algorithm')}
          </label>
          <select
            value={formData.algType ?? 2}
            onChange={event => onFieldChange('algType', Number(event.target.value))}
            className={managementFieldClass}
          >
            <option value={1}>{t('cfg.param_group.algorithm.bayesian')}</option>
            <option value={2}>{t('cfg.param_group.algorithm.doe_enum')}</option>
            <option value={5}>{t('cfg.param_group.algorithm.doe_file')}</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t('cfg.param_group.doe_import')}
          </label>
          <input
            ref={doeFileInputRef}
            type="file"
            accept=".csv,.xls,.xlsx"
            className="hidden"
            onChange={event => {
              const file = event.target.files?.[0];
              if (file) onDoeFileSelected(file);
            }}
          />
          {hasDoeFile ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border bg-slate-50 px-3 py-2 dark:bg-slate-700/60">
              <p className="truncate text-xs text-slate-600 dark:text-slate-300">
                {t('cfg.param_group.doe_saved', { name: formData.doeFileName })}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={onDownloadDoeFile}
                  className="text-xs text-blue-600 underline hover:text-blue-700"
                >
                  {t('common.download')}
                </button>
                <button
                  type="button"
                  onClick={onClearDoeFile}
                  className="text-xs text-red-600 underline hover:text-red-700"
                >
                  {t('common.clear')}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => doeFileInputRef.current?.click()}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                {t('cfg.param_group.upload_excel_csv')}
              </button>
              <textarea
                value={doePasteText}
                onChange={event => onDoePasteTextChange(event.target.value)}
                onPaste={onDoeTextareaPaste}
                rows={4}
                className={`${managementFieldClass} font-mono text-xs`}
                placeholder={t('cfg.param_group.doe_paste_placeholder')}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
