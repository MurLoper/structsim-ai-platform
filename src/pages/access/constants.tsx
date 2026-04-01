import React from 'react';
import { KeyIcon, ShieldCheckIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import type { AccessTabKey } from './types';

export const ACCESS_TABS: Array<{ key: AccessTabKey; label: string; icon: React.ReactNode }> = [
  { key: 'users', label: '用户权限', icon: <UserGroupIcon className="w-4 h-4" /> },
  { key: 'roles', label: '角色管理', icon: <ShieldCheckIcon className="w-4 h-4" /> },
  { key: 'perms', label: '权限点', icon: <KeyIcon className="w-4 h-4" /> },
];

export const PERMISSION_TYPE_OPTIONS = [
  { value: 'PAGE', label: '页面权限' },
  { value: 'ACTION', label: '操作权限' },
  { value: 'DATA', label: '数据权限' },
  { value: 'OTHER', label: '其他' },
];
