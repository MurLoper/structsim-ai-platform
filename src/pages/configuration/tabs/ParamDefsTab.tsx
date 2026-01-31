import React, { useState, useEffect, useRef } from 'react';
import {
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  CheckIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Card, useToast, useConfirmDialog } from '@/components/ui';
import { ActionButtons, EditModal, FormInput, FormSelect } from '../components';
import { baseConfigApi } from '@/api';
import type { ParamDef } from '@/types';

interface ParsedParam {
  key: string;
  name: string;
  unit: string;
  minVal: number;
  maxVal: number;
  defaultVal: string;
  exists: boolean;
}

export const ParamDefsTab: React.FC = () => {
  const [paramDefs, setParamDefs] = useState<ParamDef[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
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

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await baseConfigApi.getParamDefsPaginated({
        page,
        pageSize,
        keyword: keyword || undefined,
      });
      setParamDefs(res.data?.items || []);
      setTotal(res.data?.total || 0);
    } catch (error) {
      console.error('加载参数定义失败:', error);
      showToast('error', '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, keyword]);

  const handleSearch = () => {
    setPage(1);
    setKeyword(searchInput);
  };

  const openEditModal = (item?: ParamDef) => {
    setEditingItem(item || null);
    setFormData(
      item ? { ...item } : { valType: 1, minVal: 0, maxVal: 100, precision: 3, sort: 100 }
    );
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!formData.key?.trim() || !formData.name?.trim()) {
      showToast('error', 'Key和名称不能为空');
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
      loadData();
    } catch (error) {
      showToast('error', '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: ParamDef) => {
    showConfirm(
      '删除参数',
      `确定要删除「${item.name}」吗？`,
      async () => {
        try {
          await baseConfigApi.deleteParamDef(item.id);
          showToast('success', '删除成功');
          loadData();
        } catch (error) {
          showToast('error', '删除失败');
        }
      },
      'danger'
    );
  };

  const handleDownloadTemplate = () => {
    const headers = ['参数Key(必填)', '参数名称(必填)', '单位', '最小值', '最大值', '默认值'];
    const example = ['param_key_1', '参数名称示例', 'mm', '0', '100', '50'];
    const csv = [headers.join(','), example.join(',')].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '参数定义模板.csv';
    a.click();
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <Card>
        {/* 头部 */}
        <div className="p-4 border-b dark:border-slate-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <AdjustmentsHorizontalIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">参数定义管理</h3>
              <span className="text-sm text-slate-500">共 {total} 条</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadTemplate}
                className="px-3 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm flex items-center gap-1"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                模板
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-3 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm flex items-center gap-1"
              >
                <ArrowUpTrayIcon className="w-4 h-4" />
                导入
              </button>
              <button
                onClick={() => openEditModal()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                新建参数
              </button>
            </div>
          </div>
          {/* 搜索框 */}
          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索参数名称或Key..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200"
            >
              搜索
            </button>
          </div>
        </div>

        {/* 表格 */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500">加载中...</div>
          ) : paramDefs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              {keyword ? '未找到匹配的参数' : '暂无参数定义'}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-700">
                <tr>
                  <th className="p-3">名称</th>
                  <th className="p-3">Key</th>
                  <th className="p-3">单位</th>
                  <th className="p-3">范围</th>
                  <th className="p-3">默认值</th>
                  <th className="p-3 w-24">操作</th>
                </tr>
              </thead>
              <tbody>
                {paramDefs.map(p => (
                  <tr
                    key={p.id}
                    className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30"
                  >
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3 text-slate-500 font-mono text-xs">{p.key}</td>
                    <td className="p-3 text-slate-500">{p.unit || '-'}</td>
                    <td className="p-3 text-slate-500">
                      {p.minVal} - {p.maxVal}
                    </td>
                    <td className="p-3 text-slate-500">{p.defaultVal || '-'}</td>
                    <td className="p-3">
                      <ActionButtons
                        onEdit={() => openEditModal(p)}
                        onDelete={() => handleDelete(p)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="p-4 border-t dark:border-slate-700 flex justify-between items-center">
            <span className="text-sm text-slate-500">
              第 {page} / {totalPages} 页
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* 编辑模态框 */}
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
          onChange={v => setFormData(d => ({ ...d, name: v }))}
          placeholder="请输入参数名称"
        />
        <FormInput
          label="Key"
          value={formData.key || ''}
          onChange={v => setFormData(d => ({ ...d, key: v }))}
          placeholder="请输入参数键名（英文）"
        />
        <FormSelect
          label="数据类型"
          value={String(formData.valType || 1)}
          onChange={v => setFormData(d => ({ ...d, valType: Number(v) }))}
          options={[
            { value: '1', label: '浮点数' },
            { value: '2', label: '整数' },
            { value: '3', label: '字符串' },
          ]}
        />
        <FormInput
          label="单位"
          value={formData.unit || ''}
          onChange={v => setFormData(d => ({ ...d, unit: v }))}
          placeholder="如：mm, kg, MPa"
        />
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="最小值"
            value={formData.minVal ?? 0}
            onChange={v => setFormData(d => ({ ...d, minVal: Number(v) }))}
            type="number"
          />
          <FormInput
            label="最大值"
            value={formData.maxVal ?? 100}
            onChange={v => setFormData(d => ({ ...d, maxVal: Number(v) }))}
            type="number"
          />
        </div>
        <FormInput
          label="默认值"
          value={formData.defaultVal || ''}
          onChange={v => setFormData(d => ({ ...d, defaultVal: v }))}
          placeholder="请输入默认值"
        />
        <FormInput
          label="排序"
          value={formData.sort ?? 100}
          onChange={v => setFormData(d => ({ ...d, sort: Number(v) }))}
          type="number"
        />
      </EditModal>

      {/* 上传模态框 */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            loadData();
          }}
          showToast={showToast}
        />
      )}

      <ConfirmDialogComponent />
    </>
  );
};

// 上传模态框组件
const UploadModal: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
  showToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}> = ({ onClose, onSuccess, showToast }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedParam[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseFile = async (f: File) => {
    const text = await f.text();
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) {
      showToast('error', '文件格式错误');
      return;
    }
    const parsed = lines
      .slice(1)
      .map(line => {
        const cols = line.split(',').map(c => c.trim());
        return {
          key: cols[0] || '',
          name: cols[1] || '',
          unit: cols[2] || '',
          minVal: Number(cols[3]) || 0,
          maxVal: Number(cols[4]) || 100,
          defaultVal: cols[5] || '',
          exists: false,
        };
      })
      .filter(p => p.key);
    setParsedData(parsed);
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) return;
    setUploading(true);
    try {
      const items = parsedData.map(p => ({
        key: p.key,
        name: p.name || p.key,
        unit: p.unit,
        minVal: p.minVal,
        maxVal: p.maxVal,
        defaultVal: p.defaultVal,
      }));
      const res = await baseConfigApi.batchCreateParamDefs(items);
      showToast(
        'success',
        `导入完成：创建 ${res.data?.created?.length || 0} 个，跳过 ${res.data?.skipped?.length || 0} 个`
      );
      onSuccess();
    } catch (error) {
      showToast('error', '导入失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        <div className="p-4 border-b dark:border-slate-700">
          <h3 className="text-lg font-bold">导入参数定义</h3>
          <p className="text-sm text-slate-500 mt-1">上传 CSV 文件批量创建参数</p>
        </div>
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) {
                  setFile(f);
                  parseFile(f);
                }
              }}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-4 border-2 border-dashed rounded-lg text-center hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              {file ? file.name : '点击选择文件 (CSV)'}
            </button>
          </div>
          {parsedData.length > 0 && (
            <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left">Key</th>
                    <th className="px-3 py-2 text-left">名称</th>
                    <th className="px-3 py-2 text-left">单位</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-700">
                  {parsedData.map((p, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-mono text-xs">{p.key}</td>
                      <td className="px-3 py-2">{p.name || '-'}</td>
                      <td className="px-3 py-2">{p.unit || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 p-4 border-t dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            取消
          </button>
          <button
            onClick={handleUpload}
            disabled={parsedData.length === 0 || uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? '导入中...' : '确认导入'}
          </button>
        </div>
      </div>
    </div>
  );
};
