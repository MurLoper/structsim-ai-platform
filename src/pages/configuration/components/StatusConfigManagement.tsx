/**
 * 状态配置管理组件
 * 用于管理系统中的状态定义，包括状态名称、代码、图标、颜色等
 */
import React, { useState, useEffect } from 'react';
import { useStatusDefs, useUpdateStatusDef } from '@/features/config/queries/useCompositeConfigs';
import { Card, Button, Badge, StatusBadge } from '@/components/ui';
import { DataTable } from '@/components/tables/DataTable';
import { PlusIcon, PencilIcon, TrashIcon, XIcon } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { StatusDef } from '@/types/config';

// 预设颜色选项
const PRESET_COLORS = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#6b7280', // gray
];

// 预设图标选项
const PRESET_ICONS = ['✓', '✗', '⏳', '▶', '⏸', '⚠', '🔄', '📋', '🎯', '💡'];

export const StatusConfigManagement: React.FC = () => {
  const { data: statusDefs = [], isLoading, error, refetch } = useStatusDefs();
  const updateStatusDef = useUpdateStatusDef();
  const [selectedStatus, setSelectedStatus] = useState<StatusDef | null>(null);
  const [editForm, setEditForm] = useState({ name: '', colorTag: '', icon: '' });

  // 当选中状态变化时，更新表单
  useEffect(() => {
    if (selectedStatus) {
      setEditForm({
        name: selectedStatus.name || '',
        colorTag: selectedStatus.colorTag || '',
        icon: selectedStatus.icon || '',
      });
    }
  }, [selectedStatus]);

  // 处理编辑保存
  const handleSave = async () => {
    if (!selectedStatus) return;
    try {
      await updateStatusDef.mutateAsync({
        id: selectedStatus.id,
        data: {
          name: editForm.name,
          colorTag: editForm.colorTag,
          icon: editForm.icon,
        },
      });
      setSelectedStatus(null);
    } catch (err) {
      console.error('保存状态配置失败:', err);
    }
  };

  // 关闭模态框
  const handleCloseModal = () => {
    setSelectedStatus(null);
    setEditForm({ name: '', colorTag: '', icon: '' });
  };

  const columns: ColumnDef<StatusDef>[] = [
    {
      header: 'ID',
      accessorKey: 'id',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-slate-600">{row.original.id}</span>
      ),
    },
    {
      header: '状态名称',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.icon && <span className="text-lg">{row.original.icon}</span>}
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      header: '状态代码',
      accessorKey: 'code',
      cell: ({ row }) => (
        <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-sm">
          {row.original.code}
        </code>
      ),
    },
    {
      header: '类型',
      accessorKey: 'statusType',
      cell: ({ row }) => (
        <Badge variant={row.original.statusType === 'FINAL' ? 'success' : 'info'}>
          {row.original.statusType}
        </Badge>
      ),
    },
    {
      header: '预览',
      accessorKey: 'colorTag',
      cell: ({ row }) => (
        <StatusBadge
          statusCode={row.original.code}
          statusName={row.original.name}
          statusColor={row.original.colorTag}
          statusIcon={row.original.icon}
        />
      ),
    },
    {
      header: '图标',
      accessorKey: 'icon',
      cell: ({ row }) => <span className="text-sm text-slate-600">{row.original.icon || '-'}</span>,
    },
    {
      header: '排序',
      accessorKey: 'sort',
      cell: ({ row }) => <span className="text-sm text-slate-600">{row.original.sort}</span>,
    },
    {
      header: '操作',
      accessorKey: 'id',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setSelectedStatus(row.original)}>
            <PencilIcon className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDelete(row.original.id)}>
            <TrashIcon className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const handleDelete = (_id: number) => {
    if (confirm('确定要删除此状态配置吗？')) {
      // TODO: 实现删除逻辑
    }
  };

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">加载状态配置失败</p>
          <Button onClick={() => refetch()}>重试</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">状态配置管理</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            管理系统中的状态定义，包括申请单和轮次运行状态
          </p>
        </div>
        <Button icon={<PlusIcon className="w-5 h-5" />}>新增状态</Button>
      </div>

      <Card padding="none">
        <DataTable
          data={statusDefs}
          columns={columns}
          loading={isLoading}
          searchable
          searchPlaceholder="搜索状态..."
          showCount
          containerHeight={600}
        />
      </Card>

      {/* 编辑模态框 */}
      {selectedStatus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">编辑状态配置</h3>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* ID（只读） */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  ID（不可修改）
                </label>
                <input
                  type="text"
                  value={selectedStatus.id}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-500 cursor-not-allowed"
                />
              </div>

              {/* 状态代码（只读） */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  状态代码（不可修改）
                </label>
                <input
                  type="text"
                  value={selectedStatus.code}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-500 cursor-not-allowed font-mono"
                />
              </div>

              {/* 状态名称 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  状态名称
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-slate-700 dark:text-white"
                  placeholder="输入状态名称"
                />
              </div>

              {/* 颜色选择 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  颜色
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="color"
                    value={editForm.colorTag || '#3b82f6'}
                    onChange={e => setEditForm(prev => ({ ...prev, colorTag: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer border border-slate-300"
                  />
                  <input
                    type="text"
                    value={editForm.colorTag}
                    onChange={e => setEditForm(prev => ({ ...prev, colorTag: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-slate-700 dark:text-white font-mono text-sm"
                    placeholder="#000000"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setEditForm(prev => ({ ...prev, colorTag: color }))}
                      className={`w-6 h-6 rounded border-2 ${editForm.colorTag === color ? 'border-slate-900 dark:border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* 图标选择 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  图标
                </label>
                <input
                  type="text"
                  value={editForm.icon}
                  onChange={e => setEditForm(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-slate-700 dark:text-white mb-2"
                  placeholder="输入图标字符或留空使用默认图标"
                />
                <div className="flex gap-2 flex-wrap">
                  {PRESET_ICONS.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setEditForm(prev => ({ ...prev, icon }))}
                      className={`w-8 h-8 rounded border text-lg flex items-center justify-center ${editForm.icon === icon ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                      {icon}
                    </button>
                  ))}
                  <button
                    onClick={() => setEditForm(prev => ({ ...prev, icon: '' }))}
                    className={`w-8 h-8 rounded border text-xs flex items-center justify-center ${editForm.icon === '' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    title="使用默认图标"
                  >
                    默认
                  </button>
                </div>
              </div>

              {/* 预览 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  预览
                </label>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md">
                  <StatusBadge
                    statusCode={selectedStatus.code}
                    statusName={editForm.name || selectedStatus.name}
                    statusColor={editForm.colorTag}
                    statusIcon={editForm.icon}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="outline" onClick={handleCloseModal}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={updateStatusDef.isPending}>
                {updateStatusDef.isPending ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 状态说明 */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">状态配置说明</h3>
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <p>
            • <strong>状态ID</strong>: 唯一标识符，用于数据库存储和API传输
          </p>
          <p>
            • <strong>状态代码</strong>: 英文代码，用于程序逻辑判断
          </p>
          <p>
            • <strong>状态类型</strong>: PROCESS（过程状态）或 FINAL（最终状态）
          </p>
          <p>
            • <strong>颜色</strong>: 十六进制颜色值，用于前端显示
          </p>
          <p>
            • <strong>图标</strong>: 图标类名或Unicode字符，用于前端显示
          </p>
        </div>
      </Card>
    </div>
  );
};
