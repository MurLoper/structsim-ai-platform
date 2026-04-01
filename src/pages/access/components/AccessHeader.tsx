import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';

type AccessHeaderProps = {
  loading: boolean;
  onRefresh: () => void;
  onCreateUser: () => void;
  onCreateRole: () => void;
  onCreatePermission: () => void;
};

export const AccessHeader: React.FC<AccessHeaderProps> = ({
  loading,
  onRefresh,
  onCreateUser,
  onCreateRole,
  onCreatePermission,
}) => (
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold text-foreground">访问权限</h1>
      <p className="mt-1 text-muted-foreground">
        统一维护用户、角色和权限点，确保平台访问控制清晰可追踪。
      </p>
    </div>
    <div className="flex items-center gap-3">
      <Button variant="outline" onClick={onRefresh} disabled={loading}>
        刷新数据
      </Button>
      <Button variant="outline" onClick={onCreateUser} icon={<PlusIcon className="w-4 h-4" />}>
        新增用户
      </Button>
      <Button onClick={onCreateRole} icon={<PlusIcon className="w-4 h-4" />}>
        新增角色
      </Button>
      <Button
        variant="outline"
        onClick={onCreatePermission}
        icon={<PlusIcon className="w-4 h-4" />}
      >
        新增权限
      </Button>
    </div>
  </div>
);
