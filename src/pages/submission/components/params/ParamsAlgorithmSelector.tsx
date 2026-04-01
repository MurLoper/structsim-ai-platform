import React from 'react';
import { FormItem } from '@/components/ui';
import { AlgorithmType as AlgType } from '../../types';
import { drawerOptionCardClass } from '../paramDrawerClassNames';

interface ParamsAlgorithmSelectorProps {
  currentAlgType: AlgType;
  onChange: (algType: AlgType) => void;
  t: (key: string) => string;
}

export const ParamsAlgorithmSelector: React.FC<ParamsAlgorithmSelectorProps> = ({
  currentAlgType,
  onChange,
  t,
}) => (
  <FormItem label={t('sub.params.alg_type')}>
    <div className="grid grid-cols-3 gap-2">
      <button
        onClick={() => onChange(AlgType.BAYESIAN)}
        className={drawerOptionCardClass(currentAlgType === AlgType.BAYESIAN)}
      >
        <div className="text-sm font-bold text-primary">{t('sub.params.bayesian')}</div>
        <div className="text-xs text-muted-foreground mt-1">{t('sub.params.bayesian_desc')}</div>
      </button>
      <button
        onClick={() => onChange(AlgType.DOE)}
        className={drawerOptionCardClass(currentAlgType === AlgType.DOE)}
      >
        <div className="text-sm font-bold text-primary">{t('sub.params.doe')}</div>
        <div className="text-xs text-muted-foreground mt-1">{t('sub.params.doe_desc')}</div>
      </button>
      <button
        onClick={() => onChange(AlgType.DOE_FILE)}
        className={drawerOptionCardClass(currentAlgType === AlgType.DOE_FILE)}
      >
        <div className="text-sm font-bold text-primary">{t('sub.params.doe_file')}</div>
        <div className="text-xs text-muted-foreground mt-1">{t('sub.params.doe_file_desc')}</div>
      </button>
    </div>
  </FormItem>
);
