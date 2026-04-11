import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useStatusDefs, useUpdateStatusDef } from '@/features/config/queries/useCompositeConfigs';
import { Button, Card, useConfirmDialog } from '@/components/ui';
import { useI18n } from '@/hooks';
import { DataTable } from '@/components/tables/DataTable';
import type { StatusDef } from '@/types/config';
import { createStatusColumns } from './status/createStatusColumns';
import { StatusEditModal } from './status/StatusEditModal';
import { StatusHelpCard } from './status/StatusHelpCard';

export const StatusConfigManagement: React.FC = () => {
  const { data: statusDefs = [], isLoading, error, refetch } = useStatusDefs();
  const updateStatusDef = useUpdateStatusDef();
  const [selectedStatus, setSelectedStatus] = useState<StatusDef | null>(null);
  const [editForm, setEditForm] = useState({ name: '', colorTag: '', icon: '' });
  const [showMoreIcons, setShowMoreIcons] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const { t } = useI18n();
  const { showConfirm, ConfirmDialogComponent } = useConfirmDialog();

  useEffect(() => {
    if (!selectedStatus) {
      return;
    }
    setEditForm({
      name: selectedStatus.name || '',
      colorTag: selectedStatus.colorTag || '',
      icon: selectedStatus.icon || '',
    });
  }, [selectedStatus]);

  async function handleSave() {
    if (!selectedStatus) {
      return;
    }

    try {
      await updateStatusDef.mutateAsync({
        id: selectedStatus.id,
        data: {
          name: editForm.name,
          colorTag: editForm.colorTag,
          icon: editForm.icon,
        },
      });
      handleCloseModal();
    } catch (error) {
      console.error('保存状态配置失败:', error);
    }
  }

  function handleCloseModal() {
    setSelectedStatus(null);
    setEditForm({ name: '', colorTag: '', icon: '' });
    setShowMoreIcons(false);
    setIconSearch('');
  }

  const handleDelete = useCallback(
    (_statusId: number) => {
      showConfirm(t('common.confirm'), t('cfg.status.delete_confirm'), () => {}, 'danger');
    },
    [showConfirm, t]
  );

  const columns = useMemo(
    () =>
      createStatusColumns({
        t,
        onEdit: setSelectedStatus,
        onDelete: handleDelete,
      }),
    [handleDelete, t]
  );

  if (error) {
    return (
      <Card>
        <div className="py-8 text-center">
          <p className="mb-4 text-red-500">{t('cfg.status.load_error')}</p>
          <Button onClick={() => refetch()}>{t('common.retry')}</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white eyecare:text-foreground">
            {t('cfg.status.title')}
          </h2>
          <p className="mt-1 text-slate-500 dark:text-slate-400 eyecare:text-muted-foreground">
            {t('cfg.status.desc')}
          </p>
        </div>
        <Button icon={<Plus className="h-5 w-5" />}>{t('cfg.status.add')}</Button>
      </div>

      <Card padding="none">
        <DataTable
          data={statusDefs}
          columns={columns}
          loading={isLoading}
          searchable
          searchPlaceholder={t('cfg.status.search')}
          showCount
          containerHeight={600}
        />
      </Card>

      {selectedStatus && (
        <StatusEditModal
          status={selectedStatus}
          editForm={editForm}
          showMoreIcons={showMoreIcons}
          iconSearch={iconSearch}
          saving={updateStatusDef.isPending}
          t={t}
          onClose={handleCloseModal}
          onSave={handleSave}
          onEditFormChange={setEditForm}
          onShowMoreIconsChange={setShowMoreIcons}
          onIconSearchChange={setIconSearch}
        />
      )}

      <StatusHelpCard t={t} />
      <ConfirmDialogComponent />
    </div>
  );
};
