/**
 * 状态配置管理组件
 * 用于管理系统中的状态定义，包括状态名称、代码、图标、颜色等
 */
import React, { useState } from 'react';
import { useStatusDefs } from '@/features/config/queries/useCompositeConfigs';
import { Card, Button, Badge } from '@/components/ui';
import { DataTable } from '@/components/tables/DataTable';
import { PlusIcon, PencilIcon, TrashIcon } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { StatusDef } from '@/types/config';

export const StatusConfigManagement: React.FC = () => {
  const { data: statusDefs = [], isLoading, error, refetch } = useStatusDefs();
  const [, setSelectedStatus] = useState<StatusDef | null>(null);

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
      header: '颜色',
      accessorKey: 'colorTag',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded border border-slate-300"
            style={{ backgroundColor: row.original.colorTag }}
          />
          <span className="text-sm text-slate-600">{row.original.colorTag}</span>
        </div>
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
