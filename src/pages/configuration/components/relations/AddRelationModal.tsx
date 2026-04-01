import React, { useMemo } from 'react';
import { useFormState } from '@/hooks/useFormState';
import {
  managementFieldClass,
  managementModalOverlayClass,
  managementModalPanelClass,
  managementPrimaryButtonDisabledClass,
  managementSecondaryButtonClass,
} from '../managementSurfaceTokens';
import type { SelectableRelationItem } from './types';

interface AddRelationModalProps {
  title: string;
  items: SelectableRelationItem[];
  existingIds: Set<number>;
  onAdd: (itemId: number, isDefault: number) => void;
  onClose: () => void;
  getItemLabel: (item: SelectableRelationItem) => string;
  getItemSubLabel?: (item: SelectableRelationItem) => string | undefined;
}

export const AddRelationModal: React.FC<AddRelationModalProps> = ({
  title,
  items,
  existingIds,
  onAdd,
  onClose,
  getItemLabel,
  getItemSubLabel,
}) => {
  const initialData = useMemo(
    () => ({
      selectedId: null as number | null,
      isDefault: 0,
    }),
    []
  );

  const { formData, updateField } = useFormState(initialData);
  const availableItems = items.filter(item => !existingIds.has(item.id));
  const selectedId = formData.selectedId ?? null;

  return (
    <div className={managementModalOverlayClass}>
      <div className={`${managementModalPanelClass} w-full max-w-md p-6`}>
        <h3 className="mb-4 text-lg font-semibold">{title}</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">选择配置</label>
            <select
              value={selectedId ?? ''}
              onChange={event =>
                updateField(
                  'selectedId',
                  event.target.value ? Number(event.target.value) : (null as number | null)
                )
              }
              className={managementFieldClass}
            >
              <option value="">请选择</option>
              {availableItems.map(item => (
                <option key={item.id} value={item.id}>
                  {getItemLabel(item)}
                  {getItemSubLabel && getItemSubLabel(item) ? ` - ${getItemSubLabel(item)}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="relation-is-default"
              type="checkbox"
              checked={(formData.isDefault ?? 0) === 1}
              onChange={event => updateField('isDefault', event.target.checked ? 1 : 0)}
              className="rounded"
            />
            <label htmlFor="relation-is-default" className="text-sm">
              设为默认
            </label>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={managementSecondaryButtonClass}>
            取消
          </button>
          <button
            type="button"
            onClick={() => selectedId && onAdd(selectedId, formData.isDefault ?? 0)}
            disabled={!selectedId}
            className={managementPrimaryButtonDisabledClass}
          >
            添加
          </button>
        </div>
      </div>
    </div>
  );
};
