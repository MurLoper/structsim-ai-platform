import React from 'react';
import { CheckCircleIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Alert, Button } from '@/components/ui';
import { AlgorithmType as AlgType } from '../../types';
import type { ParamDomain } from '../../types';
import { getDoeCellValue } from '../paramDrawerData';
import {
  drawerActionLinkClass,
  drawerDangerIconButtonClass,
  tableBodyActionCellClass,
  tableBodyCellClass,
  tableHeaderCellClass,
} from '../paramDrawerClassNames';

interface ParamsDomainSectionProps {
  currentAlgType: AlgType;
  domain: ParamDomain[];
  doeParamHeads: string[];
  doeParamData: Array<Record<string, number | string>>;
  doeValidationError: string | null;
  tableTextInputClass: string;
  tableNumberInputClass: string;
  tableCompactNumberInputClass: string;
  onAddDomain: () => void;
  onRemoveDomain: (index: number) => void;
  onUpdateDomain: (index: number, updates: Partial<ParamDomain>) => void;
  onGenerateDoeCombinations: () => void;
  onAddDoeRow: () => void;
  onRemoveDoeRow: (rowIdx: number) => void;
  onUpdateDoeCell: (rowIdx: number, head: string, value: string) => void;
  t: (key: string) => string;
}

export const ParamsDomainSection: React.FC<ParamsDomainSectionProps> = ({
  currentAlgType,
  domain,
  doeParamHeads,
  doeParamData,
  doeValidationError,
  tableTextInputClass,
  tableNumberInputClass,
  tableCompactNumberInputClass,
  onAddDomain,
  onRemoveDomain,
  onUpdateDomain,
  onGenerateDoeCombinations,
  onAddDoeRow,
  onRemoveDoeRow,
  onUpdateDoeCell,
  t,
}) => {
  if (currentAlgType !== AlgType.BAYESIAN && currentAlgType !== AlgType.DOE) {
    return null;
  }

  const isDoe = currentAlgType === AlgType.DOE;
  const domainGridClass = isDoe
    ? 'grid-cols-[100px_1fr_40px]'
    : 'grid-cols-[100px_1fr_1fr_1fr_40px]';

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-bold text-foreground">{t('sub.params.domain')}</span>
        <button onClick={onAddDomain} className={drawerActionLinkClass}>
          <PlusIcon className="w-4 h-4" />
          {t('sub.params.add_param')}
        </button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div
          className={`grid ${domainGridClass} bg-muted text-xs font-medium text-muted-foreground`}
        >
          <div className={`${tableHeaderCellClass} text-left`}>{t('sub.params.param_name')}</div>
          {isDoe ? (
            <div className={`${tableHeaderCellClass} text-left`}>{t('sub.values')}</div>
          ) : (
            <>
              <div className={tableHeaderCellClass}>{t('sub.min')}</div>
              <div className={tableHeaderCellClass}>{t('sub.max')}</div>
              <div className={tableHeaderCellClass}>{t('sub.params.init')}</div>
            </>
          )}
          <div className="px-2 py-2" />
        </div>

        <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
          {domain.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              {t('sub.params.add_param')}
            </div>
          ) : (
            domain.map((item, idx) => (
              <div
                key={idx}
                className={`grid ${domainGridClass} border-t border-border hover:bg-muted/50`}
              >
                <div className={tableBodyCellClass}>
                  <input
                    type="text"
                    className={tableTextInputClass}
                    placeholder="name"
                    value={item.paramName}
                    onChange={event => onUpdateDomain(idx, { paramName: event.target.value })}
                  />
                </div>
                {isDoe ? (
                  <div className={tableBodyCellClass}>
                    <input
                      type="text"
                      className={tableTextInputClass}
                      placeholder="0,15,30,45,60,75,90"
                      value={item.range}
                      onChange={event => {
                        const range = event.target.value;
                        const rangeList = range
                          .split(',')
                          .map(value => Number(value.trim()))
                          .filter(value => !isNaN(value));
                        onUpdateDomain(idx, { range, rangeList });
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <div className={tableBodyCellClass}>
                      <input
                        type="number"
                        className={tableNumberInputClass}
                        value={item.minValue}
                        onChange={event =>
                          onUpdateDomain(idx, { minValue: Number(event.target.value) })
                        }
                      />
                    </div>
                    <div className={tableBodyCellClass}>
                      <input
                        type="number"
                        className={tableNumberInputClass}
                        value={item.maxValue}
                        onChange={event =>
                          onUpdateDomain(idx, { maxValue: Number(event.target.value) })
                        }
                      />
                    </div>
                    <div className={tableBodyCellClass}>
                      <input
                        type="number"
                        className={tableNumberInputClass}
                        value={item.initValue}
                        onChange={event =>
                          onUpdateDomain(idx, { initValue: Number(event.target.value) })
                        }
                      />
                    </div>
                  </>
                )}
                <div className={tableBodyActionCellClass}>
                  <button
                    onClick={() => onRemoveDomain(idx)}
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

      {isDoe && (
        <div className="mt-3 space-y-3">
          <Button
            onClick={onGenerateDoeCombinations}
            disabled={domain.length === 0}
            className="w-full"
          >
            <CheckCircleIcon className="w-4 h-4" />
            {t('sub.params.doe_verify_btn')}
          </Button>
          {doeValidationError && <Alert type="error">{doeValidationError}</Alert>}

          {doeParamData.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-primary">
                  {t('sub.params.doe_total')}: {doeParamData.length} {t('sub.params.doe_rounds')}
                </div>
                <button onClick={onAddDoeRow} className={drawerActionLinkClass}>
                  <PlusIcon className="w-4 h-4" />
                  {t('sub.params.doe_add_row')}
                </button>
              </div>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="max-h-[300px] overflow-auto custom-scrollbar">
                  <div
                    className="grid gap-px bg-border"
                    style={{
                      gridTemplateColumns: `50px repeat(${doeParamHeads.length}, minmax(80px, 1fr)) 40px`,
                    }}
                  >
                    <div className="bg-muted px-2 py-2 text-xs font-medium text-center">#</div>
                    {doeParamHeads.map(head => (
                      <div
                        key={head}
                        className="bg-muted px-2 py-2 text-xs font-medium text-center"
                      >
                        {head}
                      </div>
                    ))}
                    <div className="bg-muted" />

                    {doeParamData.map((row, rowIdx) => (
                      <React.Fragment key={rowIdx}>
                        <div className="bg-card px-2 py-1 text-xs text-center text-muted-foreground">
                          {rowIdx + 1}
                        </div>
                        {doeParamHeads.map(head => (
                          <div key={head} className="bg-card p-0.5">
                            <input
                              type="text"
                              className={tableCompactNumberInputClass}
                              value={getDoeCellValue(row, head)}
                              onChange={event => onUpdateDoeCell(rowIdx, head, event.target.value)}
                            />
                          </div>
                        ))}
                        <div className="bg-card flex items-center justify-center">
                          <button
                            onClick={() => onRemoveDoeRow(rowIdx)}
                            className={drawerDangerIconButtonClass}
                          >
                            <TrashIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
