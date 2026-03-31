import React from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { FormItem } from '@/components/ui';
import type { CustomBatchSize } from '../../types';
import { AlgorithmType as AlgType } from '../../types';
import {
  drawerActionLinkClass,
  drawerDangerIconButtonClass,
  drawerDangerIconButtonDisabledClass,
  drawerSegmentButtonClass,
  tableBodyActionCellClass,
  tableBodyCellClass,
  tableHeaderCellClass,
} from '../paramDrawerStyles';

interface BatchSizeItem {
  value: number;
}

interface ParamsBatchConfigSectionProps {
  currentAlgType: AlgType;
  batchSizeType: number;
  batchSizeList: BatchSizeItem[];
  customBatchSizeList: CustomBatchSize[];
  tableNumberInputClass: string;
  onBatchTypeChange: (type: number) => void;
  onAddBatchSize: () => void;
  onRemoveBatchSize: (index: number) => void;
  onUpdateBatchSize: (index: number, value: number) => void;
  onAddCustomBatchSize: () => void;
  onRemoveCustomBatchSize: (index: number) => void;
  onUpdateCustomBatchSize: (index: number, updates: Partial<CustomBatchSize>) => void;
  t: (key: string) => string;
}

export const ParamsBatchConfigSection: React.FC<ParamsBatchConfigSectionProps> = ({
  currentAlgType,
  batchSizeType,
  batchSizeList,
  customBatchSizeList,
  tableNumberInputClass,
  onBatchTypeChange,
  onAddBatchSize,
  onRemoveBatchSize,
  onUpdateBatchSize,
  onAddCustomBatchSize,
  onRemoveCustomBatchSize,
  onUpdateCustomBatchSize,
  t,
}) => {
  if (currentAlgType !== AlgType.BAYESIAN) {
    return null;
  }

  return (
    <FormItem label={t('sub.params.batch_config')}>
      <div className="flex bg-muted rounded-lg p-1 mb-3">
        <button
          onClick={() => onBatchTypeChange(1)}
          className={drawerSegmentButtonClass(batchSizeType === 1)}
        >
          {t('sub.params.batch_fixed')}
        </button>
        <button
          onClick={() => onBatchTypeChange(2)}
          className={drawerSegmentButtonClass(batchSizeType === 2)}
        >
          {t('sub.params.batch_custom')}
        </button>
      </div>

      {batchSizeType === 1 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground">{t('sub.params.batch_list')}</span>
            <button onClick={onAddBatchSize} className={drawerActionLinkClass}>
              <PlusIcon className="w-4 h-4" />
              {t('sub.params.add_batch')}
            </button>
          </div>
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="grid grid-cols-[60px_1fr_40px] bg-muted text-xs font-medium text-muted-foreground">
              <div className={tableHeaderCellClass}>{t('sub.params.batch_round')}</div>
              <div className={tableHeaderCellClass}>{t('sub.params.batch_size')}</div>
              <div className="px-2 py-2" />
            </div>
            <div className="max-h-[150px] overflow-y-auto custom-scrollbar">
              {batchSizeList.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[60px_1fr_40px] border-t border-border">
                  <div className="px-2 py-1 border-r border-border text-center text-sm text-muted-foreground">
                    {idx + 1}
                  </div>
                  <div className={tableBodyCellClass}>
                    <input
                      type="number"
                      min="1"
                      className={tableNumberInputClass}
                      value={item.value}
                      onChange={event => onUpdateBatchSize(idx, Number(event.target.value) || 1)}
                    />
                  </div>
                  <div className={tableBodyActionCellClass}>
                    <button
                      onClick={() => onRemoveBatchSize(idx)}
                      disabled={batchSizeList.length <= 2}
                      className={drawerDangerIconButtonDisabledClass}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {batchSizeType === 2 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground">
              {t('sub.params.custom_batch_list')}
            </span>
            <button onClick={onAddCustomBatchSize} className={drawerActionLinkClass}>
              <PlusIcon className="w-4 h-4" />
              {t('sub.params.add_batch')}
            </button>
          </div>
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="grid grid-cols-[70px_70px_1fr_40px] bg-muted text-xs font-medium text-muted-foreground">
              <div className={tableHeaderCellClass}>{t('sub.params.start_idx')}</div>
              <div className={tableHeaderCellClass}>{t('sub.params.end_idx')}</div>
              <div className={tableHeaderCellClass}>{t('sub.params.batch_size')}</div>
              <div className="px-2 py-2" />
            </div>
            <div className="max-h-[150px] overflow-y-auto custom-scrollbar">
              {customBatchSizeList.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  {t('sub.params.add_batch')}
                </div>
              ) : (
                customBatchSizeList.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[70px_70px_1fr_40px] border-t border-border"
                  >
                    <div className={tableBodyCellClass}>
                      <input
                        type="number"
                        min="0"
                        className={tableNumberInputClass}
                        value={item.startIndex}
                        onChange={event =>
                          onUpdateCustomBatchSize(idx, {
                            startIndex: Number(event.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className={tableBodyCellClass}>
                      <input
                        type="number"
                        min="0"
                        className={tableNumberInputClass}
                        value={item.endIndex}
                        onChange={event =>
                          onUpdateCustomBatchSize(idx, {
                            endIndex: Number(event.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className={tableBodyCellClass}>
                      <input
                        type="number"
                        min="1"
                        className={tableNumberInputClass}
                        value={item.value}
                        onChange={event =>
                          onUpdateCustomBatchSize(idx, {
                            value: Number(event.target.value) || 1,
                          })
                        }
                      />
                    </div>
                    <div className={tableBodyActionCellClass}>
                      <button
                        onClick={() => onRemoveCustomBatchSize(idx)}
                        className={drawerDangerIconButtonClass}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </FormItem>
  );
};
