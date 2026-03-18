/**
 * ConfigDrawer - 配置抽屉
 *
 * 基于统一 Drawer 组件的业务封装
 * 支持 Tab 快速切换配置模式（params/output/solver/careDevices）
 */
import React from 'react';
import { Drawer } from '@/components/ui';
import type { DrawerMode } from '../types';

interface TabDef {
  mode: DrawerMode;
  label: string;
}

interface ConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: 'normal' | 'wide';
  resizable?: boolean;
  minWidth?: number;
  maxWidth?: number;
  /** 当前抽屉模式 */
  activeMode?: DrawerMode;
  /** Tab 切换回调（仅 params/output/solver/careDevices 之间） */
  onModeChange?: (mode: DrawerMode) => void;
  /** 国际化函数 */
  t?: (key: string) => string;
}

const widthMap = { normal: 'md' as const, wide: 'lg' as const };

const CONFIG_TABS: TabDef[] = [
  { mode: 'params', label: 'sub.params_config' },
  { mode: 'output', label: 'sub.output_config' },
  { mode: 'solver', label: 'sub.solver_config' },
  { mode: 'careDevices', label: 'sub.care_devices' },
];

export const ConfigDrawer: React.FC<ConfigDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = 'normal',
  resizable = false,
  minWidth = 400,
  maxWidth = 1200,
  activeMode,
  onModeChange,
  t = (key: string) => key,
}) => {
  const showTabs = activeMode && activeMode !== 'project' && onModeChange;

  return (
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
      {showTabs && (
        <div className="flex border-b border-border mb-4 -mt-2">
          {CONFIG_TABS.map(tab => (
            <button
              key={tab.mode}
              onClick={() => onModeChange(tab.mode)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeMode === tab.mode
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {t(tab.label)}
            </button>
          ))}
        </div>
      )}
      {children}
    </Drawer>
  );
};
