import React, { useState } from 'react';
import { Download, Plus, SlidersHorizontal, Upload } from 'lucide-react';
import { Card, SearchBar, useConfirmDialog, useToast } from '@/components/ui';
import { baseConfigApi } from '@/api';
import { usePaginatedParamDefs } from '@/features/config/queries';
import type { ParamDef } from '@/types';
import { ActionButtons, EditModal, FormInput, FormSelect } from '../components';
import { ParamDefsUploadModal } from './paramDefs/ParamDefsUploadModal';

const PARAM_DATA_TYPE_OPTIONS = [
  { value: '1', label: '浮点数' },
  { value: '2', label: '整数' },
  { value: '3', label: '字符串' },
];

const createDefaultParamDef = (): Partial<ParamDef> => ({
  valType: 1,
  minVal: 0,
  maxVal: 100,
  precision: 3,
  sort: 100,
});

export const ParamDefsTab: React.FC = () => {
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
      showToast('error', 'Key 和名称不能为空');
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        await baseConfigApi.updateParamDef(editingItem.id, formData);
        showToast('success', '更新成功');
      } else {
        await baseConfigApi.createParamDef(formData);
        showToast('success', '创建成功');
      }
      setShowEditModal(false);
      await refetch();
    } catch {
      showToast('error', '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: ParamDef) => {
    showConfirm(
      '删除参数',
      `确定要删除“${item.name}”吗？`,
      async () => {
        try {
          await baseConfigApi.deleteParamDef(item.id);
          showToast('success', '删除成功');
          await refetch();
        } catch {
          showToast('error', '删除失败');
        }
      },
      'danger'
    );
  };

  const handleDownloadTemplate = () => {
    const headers = ['参数 Key(必填)', '参数名称(必填)', '单位', '最小值', '最大值', '默认值'];
    const example = ['param_key_1', '参数名称示例', 'mm', '0', '100', '50'];
    const csv = [headers.join(','), example.join(',')].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '参数定义模板.csv';
    link.click();
  };

  return (
    <>
      <Card>
        <div className="border-b border-border p-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">参数定义管理</h3>
              <span className="text-sm text-muted-foreground">共 {total} 条</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
              >
                <Download className="h-4 w-4" />
                模板
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
              >
                <Upload className="h-4 w-4" />
                导入
              </button>
              <button
                onClick={() => openEditModal()}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                新建参数
              </button>
            </div>
          </div>

          <div className="mt-4">
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSearch={handleSearch}
              placeholder="搜索参数名称或 Key..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">加载中...</div>
          ) : paramDefs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              {keyword ? '未找到匹配的参数' : '暂无参数定义'}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-foreground">名称</th>
                  <th className="p-3 text-foreground">Key</th>
                  <th className="p-3 text-foreground">单位</th>
                  <th className="p-3 text-foreground">范围</th>
                  <th className="w-24 p-3 text-foreground">操作</th>
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
              第 {page} / {totalPages} 页
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(current => Math.max(1, current - 1))}
                disabled={page === 1}
                className="rounded border border-border px-3 py-1 disabled:opacity-50"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(current => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
                className="rounded border border-border px-3 py-1 disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </Card>

      <EditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={editingItem ? '编辑参数' : '新建参数'}
        onSave={handleSave}
        loading={saving}
      >
        <FormInput
          label="名称"
          value={formData.name || ''}
          onChange={value => setFormData(current => ({ ...current, name: value }))}
          placeholder="请输入参数名称"
        />
        <FormInput
          label="Key"
          value={formData.key || ''}
          onChange={value => setFormData(current => ({ ...current, key: value }))}
          placeholder="请输入参数 Key（英文）"
        />
        <FormSelect
          label="数据类型"
          value={String(formData.valType || 1)}
          onChange={value => setFormData(current => ({ ...current, valType: Number(value) }))}
          options={PARAM_DATA_TYPE_OPTIONS}
        />
        <FormInput
          label="单位"
          value={formData.unit || ''}
          onChange={value => setFormData(current => ({ ...current, unit: value }))}
          placeholder="如：mm, kg, MPa"
        />
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="最小值"
            value={formData.minVal ?? 0}
            onChange={value => setFormData(current => ({ ...current, minVal: Number(value) }))}
            type="number"
          />
          <FormInput
            label="最大值"
            value={formData.maxVal ?? 100}
            onChange={value => setFormData(current => ({ ...current, maxVal: Number(value) }))}
            type="number"
          />
        </div>
        <FormInput
          label="默认值"
          value={formData.defaultVal || ''}
          onChange={value => setFormData(current => ({ ...current, defaultVal: value }))}
          placeholder="请输入默认值"
        />
        <FormInput
          label="排序"
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
