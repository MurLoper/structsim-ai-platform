import React from 'react';
import { Button } from '@/components/ui';

type AccessOptionCardProps = {
  label: string;
  description?: string;
  control: React.ReactNode;
  controlPosition?: 'leading' | 'trailing';
};

const optionCardBaseClass = 'rounded-lg border border-border px-3 py-2';
const optionCardTitleClass = 'text-sm font-medium text-foreground';
const optionCardDescriptionClass = 'text-xs text-muted-foreground';

export const AccessOptionCard: React.FC<AccessOptionCardProps> = ({
  label,
  description,
  control,
  controlPosition = 'trailing',
}) => {
  const content = (
    <>
      {controlPosition === 'leading' && control}
      <div className="min-w-0 flex-1">
        <div className={optionCardTitleClass}>{label}</div>
        {description && <div className={optionCardDescriptionClass}>{description}</div>}
      </div>
      {controlPosition === 'trailing' && control}
    </>
  );

  return (
    <label
      className={`${optionCardBaseClass} ${
        controlPosition === 'leading'
          ? 'flex items-center gap-3'
          : 'flex items-center justify-between gap-3'
      }`}
    >
      {content}
    </label>
  );
};

type AccessModalActionsProps = {
  onCancel: () => void;
  onConfirm: () => void;
  confirmText: string;
  cancelText?: string;
  confirmButtonProps?: Omit<React.ComponentProps<typeof Button>, 'children' | 'onClick'>;
};

export const AccessModalActions: React.FC<AccessModalActionsProps> = ({
  onCancel,
  onConfirm,
  confirmText,
  cancelText = '取消',
  confirmButtonProps,
}) => (
  <div className="flex justify-end gap-2">
    <Button variant="outline" onClick={onCancel}>
      {cancelText}
    </Button>
    <Button onClick={onConfirm} {...confirmButtonProps}>
      {confirmText}
    </Button>
  </div>
);
