import React from 'react';
import clsx from 'clsx';
import { ChevronDown, ChevronUp, Search, XIcon } from 'lucide-react';
import {
  Button,
  EXTENDED_LUCIDE_ICONS,
  PRESET_LUCIDE_ICONS,
  StatusBadge,
  getLucideIconByName,
} from '@/components/ui';
import type { StatusDef } from '@/types/config';
import { STATUS_PRESET_COLORS } from './statusConfigData';

type StatusEditForm = {
  name: string;
  colorTag: string;
  icon: string;
};

type StatusEditModalProps = {
  status: StatusDef;
  editForm: StatusEditForm;
  showMoreIcons: boolean;
  iconSearch: string;
  saving: boolean;
  t: (key: string) => string;
  onClose: () => void;
  onSave: () => void;
  onEditFormChange: (updater: (prev: StatusEditForm) => StatusEditForm) => void;
  onShowMoreIconsChange: (next: boolean) => void;
  onIconSearchChange: (value: string) => void;
};

export const StatusEditModal: React.FC<StatusEditModalProps> = ({
  status,
  editForm,
  showMoreIcons,
  iconSearch,
  saving,
  t,
  onClose,
  onSave,
  onEditFormChange,
  onShowMoreIconsChange,
  onIconSearchChange,
}) => {
  const iconOptions = (
    showMoreIcons ? [...PRESET_LUCIDE_ICONS, ...EXTENDED_LUCIDE_ICONS] : PRESET_LUCIDE_ICONS
  ).filter(item => {
    if (!iconSearch.trim()) {
      return true;
    }
    const normalizedSearch = iconSearch.toLowerCase();
    return item.name.toLowerCase().includes(normalizedSearch) || item.label.includes(iconSearch);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-lg bg-white shadow-xl dark:bg-slate-800 eyecare:bg-card">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700 eyecare:border-border">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white eyecare:text-foreground">
            {t('cfg.status.edit')}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t('cfg.status.form.id_readonly')}
            </label>
            <input
              type="text"
              value={status.id}
              disabled
              className="w-full cursor-not-allowed rounded-md border border-input bg-muted px-3 py-2 text-muted-foreground"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t('cfg.status.form.code_readonly')}
            </label>
            <input
              type="text"
              value={status.code}
              disabled
              className="w-full cursor-not-allowed rounded-md border border-input bg-muted px-3 py-2 font-mono text-muted-foreground"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t('cfg.status.form.name')}
            </label>
            <input
              type="text"
              value={editForm.name}
              onChange={event =>
                onEditFormChange(prev => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-ring focus:ring-2 focus:ring-ring"
              placeholder={t('cfg.status.form.name')}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t('cfg.status.form.color')}
            </label>
            <div className="mb-3 flex items-center gap-2">
              <div className="relative">
                <input
                  type="color"
                  value={editForm.colorTag || '#3b82f6'}
                  onChange={event =>
                    onEditFormChange(prev => ({
                      ...prev,
                      colorTag: event.target.value,
                    }))
                  }
                  className="h-12 w-12 cursor-pointer rounded-lg border-2 border-input transition-colors hover:border-primary"
                  style={{ padding: '2px' }}
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={editForm.colorTag}
                  onChange={event =>
                    onEditFormChange(prev => ({
                      ...prev,
                      colorTag: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground focus:border-ring focus:ring-2 focus:ring-ring"
                  placeholder="#000000"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('cfg.status.color_picker_hint')}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUS_PRESET_COLORS.map(color => (
                <button
                  key={color.value}
                  onClick={() =>
                    onEditFormChange(prev => ({
                      ...prev,
                      colorTag: color.value,
                    }))
                  }
                  className={clsx(
                    'h-8 w-8 rounded-md border-2 transition-all hover:scale-110',
                    editForm.colorTag === color.value
                      ? 'border-foreground ring-2 ring-primary ring-offset-1'
                      : 'border-transparent hover:border-muted-foreground/50'
                  )}
                  style={{ backgroundColor: color.value }}
                  title={t(color.labelKey)}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t('cfg.status.form.icon')}
            </label>
            <div className="mb-2 flex items-center gap-2">
              <div
                className="flex h-10 w-10 items-center justify-center rounded border border-input bg-muted"
                style={{ color: editForm.colorTag || undefined }}
              >
                {(() => {
                  const IconComponent = editForm.icon ? getLucideIconByName(editForm.icon) : null;
                  return IconComponent ? (
                    <IconComponent className="h-5 w-5" />
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  );
                })()}
              </div>
              <input
                type="text"
                value={editForm.icon}
                onChange={event =>
                  onEditFormChange(prev => ({
                    ...prev,
                    icon: event.target.value,
                  }))
                }
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground focus:border-ring focus:ring-2 focus:ring-ring"
                placeholder={t('cfg.status.form.icon_placeholder')}
              />
            </div>

            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={iconSearch}
                onChange={event => onIconSearchChange(event.target.value)}
                className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground focus:border-ring focus:ring-2 focus:ring-ring"
                placeholder={t('cfg.status.icon_search')}
              />
            </div>

            <div className="grid max-h-48 grid-cols-6 gap-2 overflow-y-auto p-1">
              {iconOptions.map(item => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() =>
                      onEditFormChange(prev => ({
                        ...prev,
                        icon: item.name,
                      }))
                    }
                    className={clsx(
                      'flex flex-col items-center justify-center rounded border p-2 transition-all',
                      editForm.icon === item.name
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-accent hover:text-accent-foreground'
                    )}
                    title={item.label}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span className="mt-1 w-full truncate text-center text-[10px]">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onShowMoreIconsChange(!showMoreIcons)}
              className="mt-2 flex w-full items-center justify-center gap-1 rounded border border-border py-1.5 text-sm transition-all hover:bg-accent"
            >
              {showMoreIcons ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  {t('cfg.status.hide_more_icons')}
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  {t('cfg.status.show_more_icons')}
                </>
              )}
            </button>

            <button
              onClick={() =>
                onEditFormChange(prev => ({
                  ...prev,
                  icon: '',
                }))
              }
              className={clsx(
                'mt-2 w-full rounded border py-1.5 text-sm transition-all',
                editForm.icon === ''
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {t('cfg.status.form.default_icon')}
            </button>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t('cfg.status.form.preview')}
            </label>
            <div className="rounded-md bg-muted p-3">
              <StatusBadge
                statusCode={status.code}
                statusName={editForm.name || status.name}
                statusColor={editForm.colorTag}
                statusIcon={editForm.icon}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </div>
    </div>
  );
};
