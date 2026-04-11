import { useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Input, Modal, NumberInput, Select, Textarea } from '@/components/ui';
import { useI18n } from '@/hooks';
import type { PlatformAnnouncement, PlatformAnnouncementPayload } from '@/types';

interface PlatformAnnouncementModalProps {
  isOpen: boolean;
  title: string;
  initialAnnouncement?: PlatformAnnouncement | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: PlatformAnnouncementPayload) => void;
}

type AnnouncementFormState = {
  title: string;
  content: string;
  level: PlatformAnnouncementPayload['level'];
  isActive: boolean;
  dismissible: boolean;
  sort: number;
  startAt: string;
  endAt: string;
  linkText: string;
  linkUrl: string;
};

const toDatetimeLocal = (timestamp?: number | null) => {
  if (!timestamp) {
    return '';
  }
  const date = new Date(timestamp * 1000);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
};

const toTimestamp = (value: string) => {
  if (!value) {
    return null;
  }
  return Math.floor(new Date(value).getTime() / 1000);
};

const createInitialState = (announcement?: PlatformAnnouncement | null): AnnouncementFormState => ({
  title: announcement?.title || '',
  content: announcement?.content || '',
  level: announcement?.level || 'info',
  isActive: announcement?.isActive ?? true,
  dismissible: announcement?.dismissible ?? true,
  sort: announcement?.sort ?? 100,
  startAt: toDatetimeLocal(announcement?.startAt),
  endAt: toDatetimeLocal(announcement?.endAt),
  linkText: announcement?.linkText || '',
  linkUrl: announcement?.linkUrl || '',
});

export function PlatformAnnouncementModal({
  isOpen,
  title,
  initialAnnouncement,
  isSubmitting = false,
  onClose,
  onSubmit,
}: PlatformAnnouncementModalProps) {
  const { t } = useI18n();
  const [form, setForm] = useState<AnnouncementFormState>(() =>
    createInitialState(initialAnnouncement)
  );

  const levelOptions = useMemo(
    () => [
      { value: 'info', label: t('platform.content.announcement.level.info') },
      { value: 'success', label: t('platform.content.announcement.level.success') },
      { value: 'warning', label: t('platform.content.announcement.level.warning') },
      { value: 'error', label: t('platform.content.announcement.level.error') },
    ],
    [t]
  );

  useEffect(() => {
    if (isOpen) {
      setForm(createInitialState(initialAnnouncement));
    }
  }, [initialAnnouncement, isOpen]);

  const updateField = <T extends keyof AnnouncementFormState>(
    key: T,
    value: AnnouncementFormState[T]
  ) => {
    setForm(previous => ({ ...previous, [key]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <div className="space-y-4">
        <Input
          label={t('platform.content.announcement.field.title')}
          value={form.title}
          onChange={event => updateField('title', event.target.value)}
        />
        <Textarea
          value={form.content}
          onChange={event => updateField('content', event.target.value)}
          placeholder={t('platform.content.announcement.placeholder.content')}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label={t('platform.content.announcement.field.level')}
            value={form.level}
            onChange={event =>
              updateField('level', event.target.value as PlatformAnnouncementPayload['level'])
            }
            options={levelOptions}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t('platform.content.announcement.field.sort')}
            </label>
            <NumberInput value={form.sort} onChange={value => updateField('sort', value ?? 100)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t('platform.content.announcement.field.start_at')}
            </label>
            <Input
              type="datetime-local"
              value={form.startAt}
              onChange={event => updateField('startAt', event.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t('platform.content.announcement.field.end_at')}
            </label>
            <Input
              type="datetime-local"
              value={form.endAt}
              onChange={event => updateField('endAt', event.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label={t('platform.content.announcement.field.link_text')}
            value={form.linkText}
            onChange={event => updateField('linkText', event.target.value)}
          />
          <Input
            label={t('platform.content.announcement.field.link_url')}
            value={form.linkUrl}
            onChange={event => updateField('linkUrl', event.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-6">
          <Checkbox
            checked={form.isActive}
            onChange={event => updateField('isActive', event.target.checked)}
            label={t('platform.content.announcement.field.active')}
          />
          <Checkbox
            checked={form.dismissible}
            onChange={event => updateField('dismissible', event.target.checked)}
            label={t('platform.content.announcement.field.dismissible')}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() =>
              onSubmit({
                title: form.title.trim(),
                content: form.content.trim(),
                level: form.level,
                isActive: form.isActive,
                dismissible: form.dismissible,
                sort: form.sort,
                startAt: toTimestamp(form.startAt),
                endAt: toTimestamp(form.endAt),
                linkText: form.linkText.trim() || null,
                linkUrl: form.linkUrl.trim() || null,
              })
            }
            disabled={isSubmitting || !form.title.trim() || !form.content.trim()}
          >
            {isSubmitting ? t('common.saving') : t('platform.content.announcement.save')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
