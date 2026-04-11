import { useMemo, useState } from 'react';
import { BarChart3, Download, Plus, Upload } from 'lucide-react';
import { Card, SearchBar, useConfirmDialog, useToast } from '@/components/ui';
import { baseConfigApi } from '@/api';
import { usePaginatedOutputDefs } from '@/features/config/queries';
import { useI18n } from '@/hooks';
import type { OutputDef } from '@/types';
import { ActionButtons, EditModal, FormInput, FormSelect } from '../components';
import { OutputDefsUploadModal } from './outputDefs/OutputDefsUploadModal';

export const OutputDefsTab = () => {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingItem, setEditingItem] = useState<OutputDef | null>(null);
  const [formData, setFormData] = useState<Partial<OutputDef>>({});
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();
  const { showConfirm, ConfirmDialogComponent } = useConfirmDialog();
  const {
    data: outputDefsPage,
    isFetching,
    refetch,
  } = usePaginatedOutputDefs({
    page,
    pageSize,
    keyword,
  });

  const outputDataTypeOptions = useMemo(
    () => [
      { value: 'float', label: t('cfg.data_type.float') },
      { value: 'int', label: t('cfg.data_type.int') },
      { value: 'string', label: t('cfg.data_type.string') },
    ],
    [t]
  );
  const outputDefs = outputDefsPage?.items ?? [];
  const total = outputDefsPage?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);
  const loading = isFetching && !outputDefsPage;

  const handleSearch = () => {
    setPage(1);
    setKeyword(searchInput.trim());
  };

  const openEditModal = (item?: OutputDef) => {
    setEditingItem(item || null);
    setFormData(item ? { ...item } : { dataType: 'float', sort: 100 });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!formData.code?.trim() || !formData.name?.trim()) {
      showToast('error', t('cfg.defs.required_name_code'));
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        await baseConfigApi.updateOutputDef(editingItem.id, formData);
        showToast('success', t('common.update_success'));
      } else {
        await baseConfigApi.createOutputDef(formData);
        showToast('success', t('common.create_success'));
      }
      setShowEditModal(false);
      await refetch();
    } catch {
      showToast('error', t('common.save_failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: OutputDef) => {
    showConfirm(
      t('cfg.outputs.delete_title'),
      t('cfg.outputs.delete_confirm', { name: item.name }),
      async () => {
        try {
          await baseConfigApi.deleteOutputDef(item.id);
          showToast('success', t('common.delete_success'));
          await refetch();
        } catch {
          showToast('error', t('common.delete_failed'));
        }
      },
      'danger'
    );
  };

  const handleDownloadTemplate = () => {
    const headers = [
      t('cfg.outputs.template.header.code'),
      t('cfg.outputs.template.header.name'),
      t('cfg.outputs.template.header.unit'),
      t('cfg.outputs.template.header.data_type'),
    ];
    const example = ['output_code_1', t('cfg.outputs.template.example.name'), 'MPa', 'float'];
    const csv = [headers.join(','), example.join(',')].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = t('cfg.outputs.template.file_name');
    link.click();
  };

  return (
    <>
      <Card>
        <div className="border-b border-border p-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">{t('cfg.outputs.title')}</h3>
              <span className="text-sm text-muted-foreground">
                {t('cfg.defs.total', { count: total })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
              >
                <Download className="h-4 w-4" />
                {t('common.template')}
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
              >
                <Upload className="h-4 w-4" />
                {t('common.import')}
              </button>
              <button
                onClick={() => openEditModal()}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                {t('cfg.outputs.create')}
              </button>
            </div>
          </div>

          <div className="mt-4">
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSearch={handleSearch}
              placeholder={t('cfg.outputs.search_placeholder')}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">{t('common.loading')}</div>
          ) : outputDefs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              {keyword ? t('cfg.outputs.no_match') : t('cfg.outputs.empty')}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-foreground">{t('common.name')}</th>
                  <th className="p-3 text-foreground">{t('common.code')}</th>
                  <th className="p-3 text-foreground">{t('common.unit')}</th>
                  <th className="p-3 text-foreground">{t('cfg.outputs.data_type')}</th>
                  <th className="w-24 p-3 text-foreground">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {outputDefs.map(item => (
                  <tr key={item.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-3 font-medium text-foreground">{item.name}</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{item.code}</td>
                    <td className="p-3 text-muted-foreground">{item.unit || '-'}</td>
                    <td className="p-3 text-muted-foreground">{item.dataType || 'float'}</td>
                    <td className="p-3">
                      <ActionButtons
                        onEdit={() => openEditModal(item)}
                        onDelete={() => handleDelete(item)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border p-4">
            <span className="text-sm text-muted-foreground">
              {t('common.page_indicator', { page, totalPages })}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(current => Math.max(1, current - 1))}
                disabled={page === 1}
                className="rounded border border-border px-3 py-1 disabled:opacity-50"
              >
                {t('common.prev')}
              </button>
              <button
                onClick={() => setPage(current => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
                className="rounded border border-border px-3 py-1 disabled:opacity-50"
              >
                {t('common.next')}
              </button>
            </div>
          </div>
        )}
      </Card>

      <EditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={editingItem ? t('cfg.outputs.edit') : t('cfg.outputs.create')}
        onSave={handleSave}
        loading={saving}
      >
        <FormInput
          label={t('common.name')}
          value={formData.name || ''}
          onChange={value => setFormData(current => ({ ...current, name: value }))}
          placeholder={t('cfg.outputs.name_placeholder')}
        />
        <FormInput
          label={t('common.code')}
          value={formData.code || ''}
          onChange={value => setFormData(current => ({ ...current, code: value }))}
          placeholder={t('cfg.outputs.code_placeholder')}
        />
        <FormSelect
          label={t('cfg.outputs.data_type')}
          value={formData.dataType || 'float'}
          onChange={value => setFormData(current => ({ ...current, dataType: value }))}
          options={outputDataTypeOptions}
        />
        <FormInput
          label={t('common.unit')}
          value={formData.unit || ''}
          onChange={value => setFormData(current => ({ ...current, unit: value }))}
          placeholder="e.g. mm, MPa, Hz"
        />
        <FormInput
          label={t('common.sort')}
          value={formData.sort ?? 100}
          onChange={value => setFormData(current => ({ ...current, sort: Number(value) }))}
          type="number"
        />
      </EditModal>

      {showUploadModal && (
        <OutputDefsUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            void refetch();
          }}
          showToast={showToast}
        />
      )}

      <ConfirmDialogComponent />
    </>
  );
};
