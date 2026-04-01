import React from 'react';
import { PermissionTree } from '@/components/access';
import { Badge, Modal } from '@/components/ui';
import type { PermissionItem, Role } from '@/types';
import { AccessModalActions } from './AccessFormParts';

type RolePermissionModalProps = {
  isOpen: boolean;
  rolePermissionTarget: Role | null;
  rolePermissionIds: number[];
  permissions: PermissionItem[];
  onClose: () => void;
  onSave: () => void;
  onChange: (ids: number[]) => void;
};

export const RolePermissionModal: React.FC<RolePermissionModalProps> = ({
  isOpen,
  rolePermissionTarget,
  rolePermissionIds,
  permissions,
  onClose,
  onSave,
  onChange,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="配置权限" size="xl">
    {rolePermissionTarget && (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-foreground">{rolePermissionTarget.name}</div>
            <div className="text-xs text-muted-foreground">{rolePermissionTarget.code}</div>
          </div>
          <Badge size="sm">{rolePermissionIds.length} 个权限</Badge>
        </div>

        <PermissionTree
          permissions={permissions}
          selectedIds={rolePermissionIds}
          onChange={onChange}
        />
        <AccessModalActions onCancel={onClose} onConfirm={onSave} confirmText="保存权限" />
      </div>
    )}
  </Modal>
);
