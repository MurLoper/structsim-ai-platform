/**
 * ConfigDrawer - 配置抽屉
 *
 * 基于统一 Drawer 组件的业务封装
 * 保持原有 API 兼容性，底层使用 @/components/ui/Drawer
 */
import React from 'react';
import { Drawer } from '@/components/ui';

interface ConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: 'normal' | 'wide';
  resizable?: boolean;
  minWidth?: number;
  maxWidth?: number;
}

const widthMap = { normal: 'md' as const, wide: 'lg' as const };

export const ConfigDrawer: React.FC<ConfigDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = 'normal',
  resizable = false,
  minWidth = 400,
  maxWidth = 1200,
}) => (
  <Drawer
    open={isOpen}
    onClose={onClose}
    title={title}
    width={widthMap[width]}
    resizable={resizable}
    minWidth={minWidth}
    maxWidth={maxWidth}
    bodyClassName="custom-scrollbar"
  >
    {children}
  </Drawer>
);
