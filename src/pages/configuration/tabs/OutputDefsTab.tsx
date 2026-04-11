import React, { useState } from 'react';
import { BarChart3, Download, Plus, Upload } from 'lucide-react';
import { Card, SearchBar, useConfirmDialog, useToast } from '@/components/ui';
import { baseConfigApi } from '@/api';
import { usePaginatedOutputDefs } from '@/features/config/queries';
import type { OutputDef } from '@/types';
import { ActionButtons, EditModal, FormInput, FormSelect } from '../components';
import { OutputDefsUploadModal } from './outputDefs/OutputDefsUploadModal';

const OUTPUT_DATA_TYPE_OPTIONS = [
  { value: 'float', label: '浮点数' },
  { value: 'int', label: '整数' },
  { value: 'string', label: '字符串' },
];

export const OutputDefsTab: React.FC = () => {
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
      showToast('error', '编码和名称不能为空');
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        await baseConfigApi.updateOutputDef(editingItem.id, formData);
        showToast('success', '更新成功');
      } else {
        await baseConfigApi.createOutputDef(formData);
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

  const handleDelete = (item: OutputDef) => {
    showConfirm(
      '删除输出',
      `确定要删除“${item.name}”吗？`,
      async () => {
        try {
          await baseConfigApi.deleteOutputDef(item.id);
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
    const headers = ['输出编码(必填)', '输出名称(必填)', '单位', '数据类型(float/int/string)'];
    const example = ['output_code_1', '输出名称示例', 'MPa', 'float'];
    const csv = [headers.join(','), example.join(',')].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '输出定义模板.csv';
    link.click();
  };

  return (
    <>
      <Card>
        <div className="border-b border-border p-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">输出定义管理</h3>
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
                新建输出
              </button>
            </div>
          </div>

          <div className="mt-4">
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSearch={handleSearch}
              placeholder="搜索输出名称或编码..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">加载中...</div>
          ) : outputDefs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              {keyword ? '未找到匹配的输出' : '暂无输出定义'}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-foreground">名称</th>
                  <th className="p-3 text-foreground">编码</th>
                  <th className="p-3 text-foreground">单位</th>
                  <th className="p-3 text-foreground">数据类型</th>
                  <th className="w-24 p-3 text-foreground">操作</th>
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
        title={editingItem ? '编辑输出' : '新建输出'}
        onSave={handleSave}
        loading={saving}
      >
        <FormInput
          label="名称"
          value={formData.name || ''}
          onChange={value => setFormData(current => ({ ...current, name: value }))}
          placeholder="请输入输出名称"
        />
        <FormInput
          label="编码"
          value={formData.code || ''}
          onChange={value => setFormData(current => ({ ...current, code: value }))}
          placeholder="请输入输出编码（英文）"
        />
        <FormSelect
          label="数据类型"
          value={formData.dataType || 'float'}
          onChange={value => setFormData(current => ({ ...current, dataType: value }))}
          options={OUTPUT_DATA_TYPE_OPTIONS}
        />
        <FormInput
          label="单位"
          value={formData.unit || ''}
          onChange={value => setFormData(current => ({ ...current, unit: value }))}
          placeholder="如：mm, MPa, Hz"
        />
        <FormInput
          label="排序"
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
