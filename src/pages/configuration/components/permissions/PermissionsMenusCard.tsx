import React from 'react';
import { MenuSquare, Plus } from 'lucide-react';
import { Button, Card, CardHeader, Table } from '@/components/ui';
import type { MenuRow, TableColumn } from './permissionsConfigTypes';

interface PermissionsMenusCardProps {
  loading: boolean;
  menuRows: MenuRow[];
  columns: TableColumn<MenuRow>[];
  onCreate: () => void;
}

export const PermissionsMenusCard: React.FC<PermissionsMenusCardProps> = ({
  loading,
  menuRows,
  columns,
  onCreate,
}) => (
  <Card padding="none">
    <div className="p-6 pb-0">
      <CardHeader
        title="菜单管理"
        subtitle="通过菜单接口维护前端导航结构，数据补齐后可直接切到真实链路。"
        icon={<MenuSquare className="h-5 w-5" />}
        action={
          <Button icon={<Plus className="h-4 w-4" />} onClick={onCreate}>
            新建菜单
          </Button>
        }
      />
    </div>
    <Table
      columns={columns}
      data={menuRows}
      rowKey="id"
      loading={loading}
      emptyText="暂无菜单数据"
    />
  </Card>
);
