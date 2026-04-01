import type { MenuItem, User } from '@/types';
import type { MenuFormState, RoleFormState, UserFormState } from './PermissionsFormModals';
import type { MenuRow } from './permissionsConfigTypes';

export const createEmptyUserForm = (): UserFormState => ({
  email: '',
  domainAccount: '',
  lcUserId: '',
  userName: '',
  realName: '',
  department: '',
  dailyRoundLimit: '',
  roleIds: [],
  valid: true,
});

export const createEmptyRoleForm = (): RoleFormState => ({
  name: '',
  code: '',
  description: '',
  permissionIds: [],
  maxCpuCores: '192',
  maxBatchSize: '200',
  dailyRoundLimitDefault: '500',
  nodeList: '',
  sort: '100',
  valid: true,
});

export const createEmptyMenuForm = (): MenuFormState => ({
  parentId: '0',
  name: '',
  titleI18nKey: '',
  icon: '',
  path: '',
  component: '',
  menuType: 'MENU',
  permissionCode: '',
  hidden: false,
  valid: true,
  sort: '100',
});

export const normalizeMenu = (menu: MenuItem): MenuItem => ({
  ...menu,
  parentId: menu.parentId ?? 0,
  menuType: menu.menuType || 'MENU',
  hidden: Boolean(menu.hidden),
  valid: menu.valid ?? 1,
  children: menu.children ?? [],
});

export const buildFlatMenuRows = (items: MenuItem[]): MenuRow[] => {
  const normalized = items.map(normalizeMenu);
  const childrenMap = new Map<number, MenuItem[]>();
  const roots: MenuItem[] = [];

  normalized.forEach(item => {
    const parentId = item.parentId ?? 0;
    if (parentId > 0) {
      const bucket = childrenMap.get(parentId) ?? [];
      bucket.push(item);
      childrenMap.set(parentId, bucket);
      return;
    }
    roots.push(item);
  });

  const sortMenus = (menus: MenuItem[]) =>
    [...menus].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.id - b.id);

  const rows: MenuRow[] = [];
  const walk = (menu: MenuItem, depth: number) => {
    rows.push({ ...menu, depth });
    const children = sortMenus(childrenMap.get(menu.id) ?? []);
    children.forEach(child => walk(child, depth + 1));
  };

  sortMenus(roots).forEach(root => walk(root, 0));
  return rows;
};

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null) {
    const maybeMessage = (error as { message?: string }).message;
    if (maybeMessage) return maybeMessage;
    const response = (error as { response?: { data?: { msg?: string; message?: string } } })
      .response;
    if (response?.data?.msg) return response.data.msg;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
};

export const getUserIdentity = (user: Pick<User, 'domainAccount' | 'id'>) =>
  user.domainAccount || user.id;

export const getUserDisplayName = (
  user: Pick<User, 'realName' | 'userName' | 'displayName' | 'domainAccount' | 'id' | 'email'>
) => user.realName || user.userName || user.displayName || getUserIdentity(user) || user.email;
