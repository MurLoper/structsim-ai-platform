// Menu types for dynamic routing

export interface MenuItem {
  id: number;
  parentId?: number;
  name: string;
  titleI18nKey: string | null;
  icon: string | null;
  path: string | null;
  component: string | null;
  menuType?: string;
  hidden: boolean;
  permissionCode: string | null;
  sort: number;
  valid?: number;
  createdAt?: number;
  updatedAt?: number;
  children: MenuItem[];
}
