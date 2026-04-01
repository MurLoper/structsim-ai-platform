import React from 'react';
import type { MenuItem } from '@/types';

export type ActiveTab = 'users' | 'roles' | 'menus';

export type MenuRow = MenuItem & { depth: number };

export type TableColumn<T extends object> = {
  key: string;
  title: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
};
