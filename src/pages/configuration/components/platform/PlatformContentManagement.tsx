import { useEffect, useMemo, useState } from 'react';
import { Bell, ClipboardList, ShieldCheck } from 'lucide-react';
import { Button, Card, Checkbox, Input, NumberInput, Textarea, useToast } from '@/components/ui';
import {
  useCreatePlatformAnnouncement,
  useDeletePlatformAnnouncement,
  usePlatformAdminContent,
  useUpdatePlatformAdminContent,
  useUpdatePlatformAnnouncement,
} from '@/features/platform/queries/usePlatformAdminContent';
import {
  trackAnnouncementDelete,
  trackAnnouncementSave,
  trackConfigurationSave,
} from '@/features/platform/tracking/domains/configurationTracking';
import type {
  PlatformAdminContent,
  PlatformAnnouncement,
  PlatformAnnouncementPayload,
  PlatformSettingsUpdatePayload,
} from '@/types';
import { PlatformAnnouncementModal } from './PlatformAnnouncementModal';

const defaultSettings: PlatformAdminContent['settings'] = {
  announcementPollIntervalSeconds: 60,
  trackingEnabled: true,
  privacyPolicyRequired: true,
  privacyPolicyTitle: '隐私协议',
  privacyPolicyVersion: '1.0.0',
  privacyPolicySummary: '',
  privacyPolicyContent: '',
};

export function PlatformContentManagement() {
  const { showToast } = useToast();
  const { data, isLoading } = usePlatformAdminContent();
  const updateSettingsMutation = useUpdatePlatformAdminContent();
  const createAnnouncementMutation = useCreatePlatformAnnouncement();
  const updateAnnouncementMutation = useUpdatePlatformAnnouncement();
  const deleteAnnouncementMutation = useDeletePlatformAnnouncement();

  const [settings, setSettings] = useState(defaultSettings);
  const [editingAnnouncement, setEditingAnnouncement] = useState<PlatformAnnouncement | null>(null);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);

  useEffect(() => {
    if (data?.settings) {
      setSettings({ ...defaultSettings, ...data.settings });
    }
  }, [data?.settings]);

  const announcements = useMemo(() => data?.announcements || [], [data?.announcements]);
  const isAnnouncementSubmitting =
    createAnnouncementMutation.isPending || updateAnnouncementMutation.isPending;
  const modalTitle = editingAnnouncement ? '编辑公告' : '新建公告';

  const summaryCards = useMemo(
    () => [
      {
        title: '启用中的公告',
        value: announcements.filter(item => item.isActive).length,
        icon: Bell,
      },
      {
        title: '当前轮询周期',
        value: `${settings.announcementPollIntervalSeconds} 秒`,
        icon: ClipboardList,
      },
      {
        title: '隐私协议版本',
        value: settings.privacyPolicyVersion || '--',
        icon: ShieldCheck,
      },
    ],
    [announcements, settings.announcementPollIntervalSeconds, settings.privacyPolicyVersion]
  );

  const updateField = <T extends keyof typeof settings>(key: T, value: (typeof settings)[T]) => {
    setSettings(previous => ({ ...previous, [key]: value }));
  };

  const handleSaveSettings = async () => {
    const payload: PlatformSettingsUpdatePayload = {
      announcementPollIntervalSeconds: settings.announcementPollIntervalSeconds,
      trackingEnabled: settings.trackingEnabled,
      privacyPolicyRequired: settings.privacyPolicyRequired,
      privacyPolicyTitle: settings.privacyPolicyTitle.trim(),
      privacyPolicyVersion: settings.privacyPolicyVersion.trim(),
      privacyPolicySummary: settings.privacyPolicySummary.trim(),
      privacyPolicyContent: settings.privacyPolicyContent.trim(),
    };

    try {
      await updateSettingsMutation.mutateAsync(payload);
      trackConfigurationSave('configuration.platform.settings', 'success');
      showToast('success', '平台配置已更新');
    } catch (error) {
      trackConfigurationSave('configuration.platform.settings', 'failure');
      const message = error instanceof Error ? error.message : '平台配置更新失败';
      showToast('error', message);
    }
  };

  const handleSubmitAnnouncement = async (payload: PlatformAnnouncementPayload) => {
    try {
      if (editingAnnouncement) {
        await updateAnnouncementMutation.mutateAsync({
          announcementId: editingAnnouncement.id,
          payload,
        });
        trackAnnouncementSave('update', editingAnnouncement.id);
        showToast('success', '公告已更新');
      } else {
        const created = await createAnnouncementMutation.mutateAsync(payload);
        trackAnnouncementSave('create', created.id);
        showToast('success', '公告已创建');
      }
      setAnnouncementModalOpen(false);
      setEditingAnnouncement(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : '公告保存失败';
      showToast('error', message);
    }
  };

  const handleDeleteAnnouncement = async (announcement: PlatformAnnouncement) => {
    if (!window.confirm(`确认删除公告“${announcement.title}”吗？`)) {
      return;
    }

    try {
      await deleteAnnouncementMutation.mutateAsync(announcement.id);
      trackAnnouncementDelete(announcement.id);
      showToast('success', '公告已删除');
    } catch (error) {
      const message = error instanceof Error ? error.message : '公告删除失败';
      showToast('error', message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-3">
        {summaryCards.map(card => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">{card.title}</div>
                  <div className="mt-2 text-2xl font-semibold text-foreground">{card.value}</div>
                </div>
                <div className="rounded-2xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-900/20 dark:text-brand-300">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">平台内容配置</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              配置公告轮询、埋点开关和隐私协议内容。
            </p>
          </div>
          <Button
            onClick={handleSaveSettings}
            disabled={updateSettingsMutation.isPending || isLoading}
          >
            {updateSettingsMutation.isPending ? '保存中...' : '保存平台配置'}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              公告轮询周期（秒）
            </label>
            <NumberInput
              min={15}
              max={3600}
              value={settings.announcementPollIntervalSeconds}
              onChange={value => updateField('announcementPollIntervalSeconds', value ?? 60)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-6 pt-7">
            <Checkbox
              checked={settings.trackingEnabled}
              onChange={event => updateField('trackingEnabled', event.target.checked)}
              label="启用前端埋点"
            />
            <Checkbox
              checked={settings.privacyPolicyRequired}
              onChange={event => updateField('privacyPolicyRequired', event.target.checked)}
              label="强制同意隐私协议"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input
            label="隐私协议标题"
            value={settings.privacyPolicyTitle}
            onChange={event => updateField('privacyPolicyTitle', event.target.value)}
          />
          <Input
            label="隐私协议版本"
            value={settings.privacyPolicyVersion}
            onChange={event => updateField('privacyPolicyVersion', event.target.value)}
          />
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-foreground">隐私协议摘要</label>
          <Textarea
            value={settings.privacyPolicySummary}
            onChange={event => updateField('privacyPolicySummary', event.target.value)}
          />
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-foreground">隐私协议正文</label>
          <Textarea
            className="min-h-[220px]"
            value={settings.privacyPolicyContent}
            onChange={event => updateField('privacyPolicyContent', event.target.value)}
          />
        </div>
      </Card>

      <Card className="rounded-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">公告管理</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              公告支持轮询展示、排序，以及启用和停用。
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingAnnouncement(null);
              setAnnouncementModalOpen(true);
            }}
          >
            新建公告
          </Button>
        </div>

        <div className="space-y-3">
          {announcements.length === 0 ? (
            <div className="rounded-2xl bg-muted/40 px-4 py-10 text-center text-sm text-muted-foreground">
              暂无公告
            </div>
          ) : (
            announcements.map(announcement => (
              <div
                key={announcement.id}
                className="rounded-2xl border border-border bg-background px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-semibold text-foreground">
                        {announcement.title}
                      </h4>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                        {announcement.level}
                      </span>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                        排序 {announcement.sort}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {announcement.content}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingAnnouncement(announcement);
                        setAnnouncementModalOpen(true);
                      }}
                    >
                      编辑
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteAnnouncement(announcement)}
                      disabled={deleteAnnouncementMutation.isPending}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <PlatformAnnouncementModal
        isOpen={announcementModalOpen}
        title={modalTitle}
        initialAnnouncement={editingAnnouncement}
        isSubmitting={isAnnouncementSubmitting}
        onClose={() => {
          setAnnouncementModalOpen(false);
          setEditingAnnouncement(null);
        }}
        onSubmit={handleSubmitAnnouncement}
      />
    </div>
  );
}
