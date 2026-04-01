import React from 'react';
import { Plus, Users } from 'lucide-react';
import { Button, Card, CardHeader, Table } from '@/components/ui';
import type { User } from '@/types';
import type { TableColumn } from './permissionsConfigTypes';

interface PermissionsUsersCardProps {
  loading: boolean;
  users: User[];
  columns: TableColumn<User>[];
  onCreate: () => void;
}

export const PermissionsUsersCard: React.FC<PermissionsUsersCardProps> = ({
  loading,
  users,
  columns,
  onCreate,
}) => (
  <Card padding="none">
    <div className="p-6 pb-0">
      <CardHeader
        title="用户管理"
        subtitle="配置提单用户、角色归属和轮次上限，确保申请单能够正常构造和回显。"
        icon={<Users className="h-5 w-5" />}
        action={
          <Button icon={<Plus className="h-4 w-4" />} onClick={onCreate}>
            新建用户
          </Button>
        }
      />
    </div>
    <Table
      columns={columns}
      data={users}
      rowKey={record => String(record.id)}
      loading={loading}
      emptyText="暂无用户数据"
    />
  </Card>
);
