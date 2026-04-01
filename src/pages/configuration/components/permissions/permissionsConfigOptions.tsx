import React from 'react';
import { MenuSquare, Shield, Users } from 'lucide-react';
import type { TabItem } from '../ConfigTabs';

export const TABS: TabItem[] = [
  { key: 'users', label: '用户管理', icon: <Users className="h-4 w-4" /> },
  { key: 'roles', label: '权限组管理', icon: <Shield className="h-4 w-4" /> },
  { key: 'menus', label: '菜单管理', icon: <MenuSquare className="h-4 w-4" /> },
];

export const MENU_TYPE_OPTIONS = [
  { value: 'DIRECTORY', label: '目录' },
  { value: 'MENU', label: '菜单' },
  { value: 'BUTTON', label: '按钮' },
];
