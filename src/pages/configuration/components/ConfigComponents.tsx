import React from 'react';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { CardHeader, Button } from '@/components/ui';

// 操作按钮组件
interface ActionButtonsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ onEdit, onDelete }) => (
  <div className="flex gap-1">
    <button onClick={onEdit} className="p-1.5 hover:bg-muted rounded">
      <PencilIcon className="w-4 h-4 text-muted-foreground" />
    </button>
    <button onClick={onDelete} className="p-1.5 hover:bg-destructive/10 rounded">
      <TrashIcon className="w-4 h-4 text-red-500" />
    </button>
  </div>
);

// 配置卡片头部组件
interface ConfigCardHeaderProps {
  title: string;
  icon: React.ReactNode;
  onAdd: () => void;
}

export const ConfigCardHeader: React.FC<ConfigCardHeaderProps> = ({ title, icon, onAdd }) => (
  <CardHeader
    title={title}
    icon={icon}
    action={
      <Button variant="primary" size="sm" onClick={onAdd}>
        <PlusIcon className="w-4 h-4 mr-1" />
        新建
      </Button>
    }
  />
);

// 列表项组件
interface ListItemProps {
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  colorDot?: string;
  onEdit: () => void;
  onDelete: () => void;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  badge,
  colorDot,
  onEdit,
  onDelete,
}) => (
  <div className="p-3 bg-muted/50 rounded-lg flex justify-between items-center">
    <div className="flex items-center gap-3">
      {colorDot && <span className={`w-3 h-3 rounded-full ${colorDot}`} />}
      <div>
        <div className="font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </div>
    <div className="flex items-center gap-2">
      {badge}
      <ActionButtons onEdit={onEdit} onDelete={onDelete} />
    </div>
  </div>
);
