import { useEffect, useState } from 'react';
import { Button, Checkbox, Input, Modal, NumberInput, Select, Textarea } from '@/components/ui';
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
  const [form, setForm] = useState<AnnouncementFormState>(() =>
    createInitialState(initialAnnouncement)
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
          label="公告标题"
          value={form.title}
          onChange={event => updateField('title', event.target.value)}
        />
        <Textarea
          value={form.content}
          onChange={event => updateField('content', event.target.value)}
          placeholder="请输入公告正文"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="公告级别"
            value={form.level}
            onChange={event =>
              updateField('level', event.target.value as PlatformAnnouncementPayload['level'])
            }
            options={[
              { value: 'info', label: '普通' },
              { value: 'success', label: '成功' },
              { value: 'warning', label: '提醒' },
              { value: 'error', label: '警告' },
            ]}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">排序值</label>
            <NumberInput value={form.sort} onChange={value => updateField('sort', value ?? 100)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">生效开始时间</label>
            <Input
              type="datetime-local"
              value={form.startAt}
              onChange={event => updateField('startAt', event.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">生效结束时间</label>
            <Input
              type="datetime-local"
              value={form.endAt}
              onChange={event => updateField('endAt', event.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="链接文案"
            value={form.linkText}
            onChange={event => updateField('linkText', event.target.value)}
          />
          <Input
            label="链接地址"
            value={form.linkUrl}
            onChange={event => updateField('linkUrl', event.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-6">
          <Checkbox
            checked={form.isActive}
            onChange={event => updateField('isActive', event.target.checked)}
            label="启用公告"
          />
          <Checkbox
            checked={form.dismissible}
            onChange={event => updateField('dismissible', event.target.checked)}
            label="允许用户关闭"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>
            取消
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
            {isSubmitting ? '保存中...' : '保存公告'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
