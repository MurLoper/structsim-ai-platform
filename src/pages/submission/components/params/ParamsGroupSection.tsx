import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { Button, FormItem } from '@/components/ui';
import type { ParamGroup } from '@/types/configGroups';
import { drawerCompactSelectClass, verifyMessageClass } from '../paramDrawerStyles';

interface ParamsGroupSectionProps {
  filteredParamGroups: ParamGroup[];
  selectedGroupId: number | null;
  loadingGroup: boolean;
  verifyStatus: boolean | null;
  verifyMessage: string;
  onChangeGroup: (groupId: number | null) => void;
  onApplyGroup: () => void;
  onVerify: () => void;
  t: (key: string) => string;
}

export const ParamsGroupSection: React.FC<ParamsGroupSectionProps> = ({
  filteredParamGroups,
  selectedGroupId,
  loadingGroup,
  verifyStatus,
  verifyMessage,
  onChangeGroup,
  onApplyGroup,
  onVerify,
  t,
}) => {
  if (filteredParamGroups.length === 0) {
    return null;
  }

  return (
    <FormItem label={t('sub.params.apply_group')}>
      <div className="flex gap-2 items-center">
        <select
          className={drawerCompactSelectClass}
          value={selectedGroupId || ''}
          onChange={event => onChangeGroup(Number(event.target.value) || null)}
        >
          <option value="">-- {t('sub.params.select_group')} --</option>
          {filteredParamGroups.map(group => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="primary"
          disabled={!selectedGroupId || loadingGroup}
          onClick={onApplyGroup}
        >
          {loadingGroup ? t('sub.loading') : t('sub.params.apply')}
        </Button>
        <Button size="sm" variant="outline" onClick={onVerify}>
          <CheckCircleIcon className="w-4 h-4 mr-1" />
          {t('sub.params.verify')}
        </Button>
      </div>
      {verifyStatus !== null && (
        <div className={verifyMessageClass(verifyStatus)}>
          {verifyStatus ? '通过: ' : '失败: '}
          {verifyMessage}
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-1">{t('sub.params.apply_group_hint')}</p>
    </FormItem>
  );
};
