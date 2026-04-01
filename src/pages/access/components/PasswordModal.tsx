import React from 'react';
import { Input, Modal } from '@/components/ui';
import type { User } from '@/types';
import type { AccessUserDisplayNameGetter } from '../types';
import { AccessModalActions } from './AccessFormParts';

type PasswordModalProps = {
  isOpen: boolean;
  passwordTarget: User | null;
  passwordValue: string;
  onClose: () => void;
  onSave: () => void;
  onChange: (value: string) => void;
  getUserDisplayName: AccessUserDisplayNameGetter;
};

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  passwordTarget,
  passwordValue,
  onClose,
  onSave,
  onChange,
  getUserDisplayName,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="设置密码" size="md">
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {passwordTarget ? getUserDisplayName(passwordTarget) : ''} ({passwordTarget?.email})
      </div>
      <Input
        label="新密码"
        type="password"
        value={passwordValue}
        onChange={event => onChange(event.target.value)}
      />
      <AccessModalActions
        onCancel={onClose}
        onConfirm={onSave}
        confirmText="保存"
        confirmButtonProps={{ disabled: !passwordValue }}
      />
    </div>
  </Modal>
);
