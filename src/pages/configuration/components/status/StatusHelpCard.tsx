import React from 'react';
import { Card } from '@/components/ui';

type StatusHelpCardProps = {
  t: (key: string) => string;
};

export const StatusHelpCard: React.FC<StatusHelpCardProps> = ({ t }) => (
  <Card>
    <h3 className="mb-4 text-lg font-semibold">{t('cfg.status.title')}</h3>
    <div className="space-y-2 text-sm text-muted-foreground">
      <p>
        <strong>{t('cfg.status.col.id')}</strong>：{t('cfg.status.help.id')}
      </p>
      <p>
        <strong>{t('cfg.status.col.code')}</strong>：{t('cfg.status.help.code')}
      </p>
      <p>
        <strong>{t('cfg.status.col.type')}</strong>：{t('cfg.status.help.type')}
      </p>
      <p>
        <strong>{t('cfg.status.form.color')}</strong>：{t('cfg.status.help.color')}
      </p>
      <p>
        <strong>{t('cfg.status.col.icon')}</strong>：{t('cfg.status.help.icon')}
      </p>
    </div>
    <div className="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20 eyecare:bg-primary/10">
      <p className="text-sm text-blue-700 dark:text-blue-300 eyecare:text-primary">
        <strong>{t('common.tip')}：</strong>
        {t('cfg.status.help.tip')}
      </p>
    </div>
  </Card>
);
