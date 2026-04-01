import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { PencilIcon, TrashIcon } from 'lucide-react';
import type { StatusDef } from '@/types/config';
import { Badge, Button, StatusBadge, getLucideIconByName } from '@/components/ui';

type CreateStatusColumnsOptions = {
  t: (key: string) => string;
  onEdit: (status: StatusDef) => void;
  onDelete: (statusId: number) => void;
};

export const createStatusColumns = ({
  t,
  onEdit,
  onDelete,
}: CreateStatusColumnsOptions): ColumnDef<StatusDef>[] => [
  {
    header: t('cfg.status.col.id'),
    accessorKey: 'id',
    cell: ({ row }) => (
      <span className="font-mono text-sm text-muted-foreground">{row.original.id}</span>
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
            <IconComponent className="h-4 w-4" />
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
      <code className="rounded bg-slate-100 px-2 py-1 text-sm dark:bg-slate-800 eyecare:bg-muted">
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
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          {IconComponent ? (
            <>
              <IconComponent className="h-4 w-4" />
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
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.sort}</span>,
  },
  {
    header: t('cfg.status.col.action'),
    id: 'actions',
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => onEdit(row.original)}>
          <PencilIcon className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(row.original.id)}>
          <TrashIcon className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    ),
  },
];
