// Menu types for dynamic routing

export interface MenuItem {
  id: number;
  name: string;
  titleI18nKey: string;
  icon: string | null;
  path: string;
  component: string | null;
  hidden: boolean;
  permissionCode: string | null;
  sort: number;
  children: MenuItem[];
}
