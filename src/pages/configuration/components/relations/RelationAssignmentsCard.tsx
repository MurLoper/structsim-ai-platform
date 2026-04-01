import React from 'react';
import { Card } from '@/components/ui';
import { Plus, Star, Trash2 } from 'lucide-react';
import { managementPrimaryButtonClass } from '../managementSurfaceTokens';
import type { RelationCardItem } from './types';

interface RelationAssignmentsCardProps {
  title: string;
  emptyText: string;
  relations: RelationCardItem[];
  onAdd: () => void;
  onSetDefault: (itemId: number) => void;
  onRemove: (itemId: number) => void;
}

export const RelationAssignmentsCard: React.FC<RelationAssignmentsCardProps> = ({
  title,
  emptyText,
  relations,
  onAdd,
  onSetDefault,
  onRemove,
}) => (
  <Card>
    <div className="flex items-center justify-between border-b p-4 dark:border-slate-700">
      <h3 className="text-lg font-semibold">{title}</h3>
      <button type="button" onClick={onAdd} className={managementPrimaryButtonClass}>
        <Plus className="h-4 w-4" />
        添加关联
      </button>
    </div>
    <div className="p-4">
      {relations.length === 0 ? (
        <div className="py-12 text-center text-slate-500">{emptyText}</div>
      ) : (
        <div className="space-y-2">
          {relations.map(relation => (
            <div
              key={relation.id}
              className="flex items-center justify-between rounded-lg bg-slate-50 p-4 dark:bg-slate-700"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{relation.name}</span>
                  {relation.isDefault && (
                    <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                      默认
                    </span>
                  )}
                </div>
                {relation.description && (
                  <div className="mt-1 text-sm text-slate-500">{relation.description}</div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onSetDefault(relation.itemId)}
                  disabled={relation.isDefault}
                  className={`rounded p-2 transition-colors ${
                    relation.isDefault
                      ? 'cursor-not-allowed text-yellow-500'
                      : 'text-slate-400 hover:bg-yellow-50 hover:text-yellow-500 dark:hover:bg-yellow-900/30'
                  }`}
                  title={relation.isDefault ? '已是默认' : '设为默认'}
                >
                  {relation.isDefault ? (
                    <Star className="h-5 w-5 fill-current" />
                  ) : (
                    <Star className="h-5 w-5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(relation.itemId)}
                  className="rounded p-2 text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </Card>
);
