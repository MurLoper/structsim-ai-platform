import { Checkbox } from '@/components/ui';

interface ParamsAutomationOptionsSectionProps {
  applyToAll: boolean;
  rotateDropFlag: boolean;
  perConditionRotateDropFlag: boolean;
  onGlobalChange: (updates: { applyToAll?: boolean; rotateDropFlag?: boolean }) => void;
  onConditionRotateDropChange: (value: boolean) => void;
  t: (key: string) => string;
}

export const ParamsAutomationOptionsSection = ({
  applyToAll,
  rotateDropFlag,
  perConditionRotateDropFlag,
  onGlobalChange,
  onConditionRotateDropChange,
  t,
}: ParamsAutomationOptionsSectionProps) => (
  <section className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
    <div>
      <Checkbox
        checked={applyToAll}
        onChange={event =>
          onGlobalChange({ applyToAll: (event.target as HTMLInputElement).checked })
        }
        label={t('sub.params.apply_to_all')}
      />
      <p className="ml-6 text-xs text-muted-foreground">{t('sub.params.apply_to_all_desc')}</p>
    </div>

    <div>
      <Checkbox
        checked={applyToAll ? rotateDropFlag : perConditionRotateDropFlag}
        onChange={event => {
          const checked = (event.target as HTMLInputElement).checked;
          if (applyToAll) {
            onGlobalChange({ rotateDropFlag: checked });
            return;
          }
          onConditionRotateDropChange(checked);
        }}
        label={t('sub.params.rotate_drop_flag')}
      />
      <p className="ml-6 text-xs text-muted-foreground">
        {applyToAll
          ? t('sub.params.rotate_drop_flag_global_desc')
          : t('sub.params.rotate_drop_flag_condition_desc')}
      </p>
    </div>
  </section>
);
