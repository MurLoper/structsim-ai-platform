import React from 'react';
import { KeyIcon, ShieldCheckIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader } from '@/components/ui';

type AccessOverviewCardsProps = {
  userCount: number;
  permissionCount: number;
};

export const AccessOverviewCards: React.FC<AccessOverviewCardsProps> = ({
  userCount,
  permissionCount,
}) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
    <Card>
      <CardHeader
        title="用户规模"
        subtitle="当前纳入权限管理的账号数量"
        icon={<UserGroupIcon className="w-5 h-5" />}
      />
      <div className="text-3xl font-semibold text-foreground">{userCount}</div>
    </Card>
    <Card>
      <CardHeader
        title="权限点"
        subtitle="系统内已配置的权限总量"
        icon={<KeyIcon className="w-5 h-5" />}
      />
      <div className="text-3xl font-semibold text-foreground">{permissionCount}</div>
    </Card>
    <Card>
      <CardHeader
        title="访问策略"
        subtitle="当前核心模块的访问控制状态"
        icon={<ShieldCheckIcon className="w-5 h-5" />}
      />
      <div className="text-sm text-muted-foreground">已启用路由守卫与登录态校验。</div>
    </Card>
  </div>
);
