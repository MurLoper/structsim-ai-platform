/**
 * 状态配置管理组件
 * 用于管理系统中的状态定义，包括状态名称、代码、图标、颜色等
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useStatusDefs, useUpdateStatusDef } from '@/features/config/queries/useCompositeConfigs';
import { useUIStore } from '@/stores';
import { RESOURCES } from '@/locales';
import {
  Card,
  Button,
  Badge,
  StatusBadge,
  PRESET_LUCIDE_ICONS,
  EXTENDED_LUCIDE_ICONS,
  getLucideIconByName,
} from '@/components/ui';
import { DataTable } from '@/components/tables/DataTable';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XIcon,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import clsx from 'clsx';
import type { ColumnDef } from '@tanstack/react-table';
import type { StatusDef } from '@/types/config';

// 预设颜色选项
const PRESET_COLORS = [
  { value: '#22c55e', label: '绿色' },
  { value: '#3b82f6', label: '蓝色' },
  { value: '#f59e0b', label: '橙色' },
  { value: '#ef4444', label: '红色' },
  { value: '#8b5cf6', label: '紫色' },
  { value: '#06b6d4', label: '青色' },
  { value: '#ec4899', label: '粉色' },
  { value: '#6b7280', label: '灰色' },
  { value: '#14b8a6', label: '青绿' },
  { value: '#f97316', label: '橘色' },
  { value: '#84cc16', label: '黄绿' },
  { value: '#a855f7', label: '亮紫' },
  { value: '#0ea5e9', label: '天蓝' },
  { value: '#f43f5e', label: '玫红' },
  { value: '#64748b', label: '石板灰' },
];

export const StatusConfigManagement: React.FC = () => {
  const { data: statusDefs = [], isLoading, error, refetch } = useStatusDefs();
  const updateStatusDef = useUpdateStatusDef();
  const [selectedStatus, setSelectedStatus] = useState<StatusDef | null>(null);
  const [editForm, setEditForm] = useState({ name: '', colorTag: '', icon: '' });
  const [showMoreIcons, setShowMoreIcons] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const { language } = useUIStore();
  const t = (key: string) => RESOURCES[language][key] || key;

  // 合并所有图标并根据搜索过滤
  const allIcons = useMemo(() => {
    const icons = showMoreIcons
      ? [...PRESET_LUCIDE_ICONS, ...EXTENDED_LUCIDE_ICONS]
      : PRESET_LUCIDE_ICONS;

    if (!iconSearch.trim()) return icons;

    const search = iconSearch.toLowerCase();
    return icons.filter(
      item => item.name.toLowerCase().includes(search) || item.label.includes(search)
    );
  }, [showMoreIcons, iconSearch]);

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
    setShowMoreIcons(false);
    setIconSearch('');
  };

  const columns: ColumnDef<StatusDef>[] = [
    {
      header: t('cfg.status.col.id'),
      accessorKey: 'id',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-slate-600">{row.original.id}</span>
      ),
    },
    {
      header: t('cfg.status.col.name'),
      accessorKey: 'name',
      cell: ({ row }) => {
        const IconComponent = row.original.icon ? getLucideIconByName(row.original.icon) : null;
        return (
          <div className="flex items-center gap-2">
            {IconComponent ? (
              <IconComponent className="w-4 h-4" />
            ) : row.original.icon ? (
              <span className="text-lg">{row.original.icon}</span>
            ) : null}
            <span className="font-medium">{row.original.name}</span>
          </div>
        );
      },
    },
    {
      header: t('cfg.status.col.code'),
      accessorKey: 'code',
      cell: ({ row }) => (
        <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-sm">
          {row.original.code}
        </code>
      ),
    },
    {
      header: t('cfg.status.col.type'),
      accessorKey: 'statusType',
      cell: ({ row }) => (
        <Badge variant={row.original.statusType === 'FINAL' ? 'success' : 'info'}>
          {row.original.statusType}
        </Badge>
      ),
    },
    {
      header: t('cfg.status.col.preview'),
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
      header: t('cfg.status.col.icon'),
      accessorKey: 'icon',
      cell: ({ row }) => {
        const iconName = row.original.icon;
        const IconComponent = iconName ? getLucideIconByName(iconName) : null;
        return (
          <span className="text-sm text-slate-600 flex items-center gap-1">
            {IconComponent ? (
              <>
                <IconComponent className="w-4 h-4" />
                <span className="font-mono text-xs">{iconName}</span>
              </>
            ) : (
              iconName || '-'
            )}
          </span>
        );
      },
    },
    {
      header: t('cfg.status.col.sort'),
      accessorKey: 'sort',
      cell: ({ row }) => <span className="text-sm text-slate-600">{row.original.sort}</span>,
    },
    {
      header: t('cfg.status.col.action'),
      id: 'actions',
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
    if (confirm(t('cfg.status.delete_confirm'))) {
      // TODO: 实现删除逻辑
    }
  };

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{t('cfg.status.load_error')}</p>
          <Button onClick={() => refetch()}>{t('common.retry')}</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t('cfg.status.title')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t('cfg.status.desc')}</p>
        </div>
        <Button icon={<PlusIcon className="w-5 h-5" />}>{t('cfg.status.add')}</Button>
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

      {/* 编辑模态框 */}
      {selectedStatus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t('cfg.status.edit')}
              </h3>
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
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t('cfg.status.form.id_readonly')}
                </label>
                <input
                  type="text"
                  value={selectedStatus.id}
                  disabled
                  className="w-full px-3 py-2 bg-muted border border-input rounded-md text-muted-foreground cursor-not-allowed"
                />
              </div>

              {/* 状态代码（只读） */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t('cfg.status.form.code_readonly')}
                </label>
                <input
                  type="text"
                  value={selectedStatus.code}
                  disabled
                  className="w-full px-3 py-2 bg-muted border border-input rounded-md text-muted-foreground cursor-not-allowed font-mono"
                />
              </div>

              {/* 状态名称 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t('cfg.status.form.name')}
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
                  placeholder={t('cfg.status.form.name')}
                />
              </div>

              {/* 颜色选择 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t('cfg.status.form.color')}
                </label>
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative">
                    <input
                      type="color"
                      value={editForm.colorTag || '#3b82f6'}
                      onChange={e => setEditForm(prev => ({ ...prev, colorTag: e.target.value }))}
                      className="w-12 h-12 rounded-lg cursor-pointer border-2 border-input hover:border-primary transition-colors"
                      style={{ padding: '2px' }}
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={editForm.colorTag}
                      onChange={e => setEditForm(prev => ({ ...prev, colorTag: e.target.value }))}
                      className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground font-mono text-sm"
                      placeholder="#000000"
                    />
                    <p className="text-xs text-muted-foreground mt-1">点击左侧色块打开颜色选择器</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setEditForm(prev => ({ ...prev, colorTag: color.value }))}
                      className={clsx(
                        'w-8 h-8 rounded-md border-2 transition-all hover:scale-110',
                        editForm.colorTag === color.value
                          ? 'border-foreground ring-2 ring-primary ring-offset-1'
                          : 'border-transparent hover:border-muted-foreground/50'
                      )}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              {/* 图标选择 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t('cfg.status.form.icon')}
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-10 h-10 rounded border border-input flex items-center justify-center bg-muted"
                    style={{ color: editForm.colorTag || undefined }}
                  >
                    {(() => {
                      const IconComponent = editForm.icon
                        ? getLucideIconByName(editForm.icon)
                        : null;
                      return IconComponent ? (
                        <IconComponent className="w-5 h-5" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      );
                    })()}
                  </div>
                  <input
                    type="text"
                    value={editForm.icon}
                    onChange={e => setEditForm(prev => ({ ...prev, icon: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground font-mono text-sm"
                    placeholder={t('cfg.status.form.icon_placeholder')}
                  />
                </div>

                {/* 图标搜索 */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={iconSearch}
                    onChange={e => setIconSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground text-sm"
                    placeholder="搜索图标..."
                  />
                </div>

                {/* 图标网格 */}
                <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                  {allIcons.map(item => {
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.name}
                        onClick={() => setEditForm(prev => ({ ...prev, icon: item.name }))}
                        className={clsx(
                          'flex flex-col items-center justify-center p-2 rounded border transition-all',
                          editForm.icon === item.name
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:bg-accent hover:text-accent-foreground'
                        )}
                        title={item.label}
                      >
                        <IconComp className="w-5 h-5" />
                        <span className="text-[10px] mt-1 truncate w-full text-center">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* 更多图标按钮 */}
                <button
                  onClick={() => setShowMoreIcons(!showMoreIcons)}
                  className="mt-2 w-full py-1.5 rounded border border-border hover:bg-accent text-sm flex items-center justify-center gap-1 transition-all"
                >
                  {showMoreIcons ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      收起更多图标
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      显示更多图标
                    </>
                  )}
                </button>

                {/* 默认图标按钮 */}
                <button
                  onClick={() => setEditForm(prev => ({ ...prev, icon: '' }))}
                  className={clsx(
                    'mt-2 w-full py-1.5 rounded border text-sm transition-all',
                    editForm.icon === ''
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  {t('cfg.status.form.default_icon')}
                </button>
              </div>

              {/* 预览 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t('cfg.status.form.preview')}
                </label>
                <div className="p-3 bg-muted rounded-md">
                  <StatusBadge
                    statusCode={selectedStatus.code}
                    statusName={editForm.name || selectedStatus.name}
                    statusColor={editForm.colorTag}
                    statusIcon={editForm.icon}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
              <Button variant="outline" onClick={handleCloseModal}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSave} disabled={updateStatusDef.isPending}>
                {updateStatusDef.isPending ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 状态说明 */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">{t('cfg.status.title')}</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            • <strong>{t('cfg.status.col.id')}</strong>: {t('cfg.status.help.id')}
          </p>
          <p>
            • <strong>{t('cfg.status.col.code')}</strong>: {t('cfg.status.help.code')}
          </p>
          <p>
            • <strong>{t('cfg.status.col.type')}</strong>: {t('cfg.status.help.type')}
          </p>
          <p>
            • <strong>{t('cfg.status.form.color')}</strong>: {t('cfg.status.help.color')}
          </p>
          <p>
            • <strong>{t('cfg.status.col.icon')}</strong>: {t('cfg.status.help.icon')}
          </p>
        </div>
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>{t('common.tip')}:</strong> {t('cfg.status.help.tip')}
          </p>
        </div>
      </Card>
    </div>
  );
};
