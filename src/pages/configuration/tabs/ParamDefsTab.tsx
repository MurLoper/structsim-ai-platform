import { useMemo, useState } from 'react';
import { Download, Plus, SlidersHorizontal, Upload } from 'lucide-react';
import { Card, SearchBar, useConfirmDialog, useToast } from '@/components/ui';
import { baseConfigApi } from '@/api';
import { usePaginatedParamDefs } from '@/features/config/queries';
import { useI18n } from '@/hooks';
import type { ParamDef } from '@/types';
import { ActionButtons, EditModal, FormInput, FormSelect } from '../components';
import { ParamDefsUploadModal } from './paramDefs/ParamDefsUploadModal';

const createDefaultParamDef = (): Partial<ParamDef> => ({
  valType: 1,
  minVal: 0,
  maxVal: 100,
  precision: 3,
  sort: 100,
});

export const ParamDefsTab = () => {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ParamDef | null>(null);
  const [formData, setFormData] = useState<Partial<ParamDef>>({});
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();
  const { showConfirm, ConfirmDialogComponent } = useConfirmDialog();
  const {
    data: paramDefsPage,
    isFetching,
    refetch,
  } = usePaginatedParamDefs({
    page,
    pageSize,
    keyword,
  });

  const paramDataTypeOptions = useMemo(
    () => [
      { value: '1', label: t('cfg.data_type.float') },
      { value: '2', label: t('cfg.data_type.int') },
      { value: '3', label: t('cfg.data_type.string') },
    ],
    [t]
  );
  const paramDefs = paramDefsPage?.items ?? [];
  const total = paramDefsPage?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);
  const loading = isFetching && !paramDefsPage;

  const handleSearch = () => {
    setPage(1);
    setKeyword(searchInput.trim());
  };

  const openEditModal = (item?: ParamDef) => {
    setEditingItem(item || null);
    setFormData(item ? { ...item } : createDefaultParamDef());
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!formData.key?.trim() || !formData.name?.trim()) {
      showToast('error', t('cfg.defs.required_name_key'));
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        await baseConfigApi.updateParamDef(editingItem.id, formData);
        showToast('success', t('common.update_success'));
      } else {
        await baseConfigApi.createParamDef(formData);
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

  const handleDelete = (item: ParamDef) => {
    showConfirm(
      t('cfg.params.delete_title'),
      t('cfg.params.delete_confirm', { name: item.name }),
      async () => {
        try {
          await baseConfigApi.deleteParamDef(item.id);
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
      t('cfg.params.template.header.key'),
      t('cfg.params.template.header.name'),
      t('cfg.params.template.header.unit'),
      t('cfg.params.template.header.min'),
      t('cfg.params.template.header.max'),
      t('cfg.params.template.header.default'),
    ];
    const example = ['param_key_1', t('cfg.params.template.example.name'), 'mm', '0', '100', '50'];
    const csv = [headers.join(','), example.join(',')].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = t('cfg.params.template.file_name');
    link.click();
  };

  return (
    <>
      <Card>
        <div className="border-b border-border p-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">{t('cfg.params.title')}</h3>
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
                {t('cfg.params.create')}
              </button>
            </div>
          </div>

          <div className="mt-4">
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSearch={handleSearch}
              placeholder={t('cfg.params.search_placeholder')}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">{t('common.loading')}</div>
          ) : paramDefs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              {keyword ? t('cfg.params.no_match') : t('cfg.params.empty')}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-foreground">{t('common.name')}</th>
                  <th className="p-3 text-foreground">{t('common.key')}</th>
                  <th className="p-3 text-foreground">{t('common.unit')}</th>
                  <th className="p-3 text-foreground">{t('common.range')}</th>
                  <th className="w-24 p-3 text-foreground">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {paramDefs.map(item => (
                  <tr key={item.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-3 font-medium text-foreground">{item.name}</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{item.key}</td>
                    <td className="p-3 text-muted-foreground">{item.unit || '-'}</td>
                    <td className="p-3 text-muted-foreground">
                      {item.minVal} - {item.maxVal}
                    </td>
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
        title={editingItem ? t('cfg.params.edit') : t('cfg.params.create')}
        onSave={handleSave}
        loading={saving}
      >
        <FormInput
          label={t('common.name')}
          value={formData.name || ''}
          onChange={value => setFormData(current => ({ ...current, name: value }))}
          placeholder={t('cfg.params.name_placeholder')}
        />
        <FormInput
          label={t('common.key')}
          value={formData.key || ''}
          onChange={value => setFormData(current => ({ ...current, key: value }))}
          placeholder={t('cfg.params.key_placeholder')}
        />
        <FormSelect
          label={t('cfg.params.val_type')}
          value={String(formData.valType || 1)}
          onChange={value => setFormData(current => ({ ...current, valType: Number(value) }))}
          options={paramDataTypeOptions}
        />
        <FormInput
          label={t('common.unit')}
          value={formData.unit || ''}
          onChange={value => setFormData(current => ({ ...current, unit: value }))}
          placeholder={t('cfg.params.unit_placeholder')}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label={t('cfg.params.min')}
            value={formData.minVal ?? 0}
            onChange={value => setFormData(current => ({ ...current, minVal: Number(value) }))}
            type="number"
          />
          <FormInput
            label={t('cfg.params.max')}
            value={formData.maxVal ?? 100}
            onChange={value => setFormData(current => ({ ...current, maxVal: Number(value) }))}
            type="number"
          />
        </div>
        <FormInput
          label={t('cfg.params.default')}
          value={formData.defaultVal || ''}
          onChange={value => setFormData(current => ({ ...current, defaultVal: value }))}
          placeholder={t('cfg.params.default_placeholder')}
        />
        <FormInput
          label={t('common.sort')}
          value={formData.sort ?? 100}
          onChange={value => setFormData(current => ({ ...current, sort: Number(value) }))}
          type="number"
        />
      </EditModal>

      {showUploadModal && (
        <ParamDefsUploadModal
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
