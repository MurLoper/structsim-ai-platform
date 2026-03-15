/**
 * Collapse - 折叠面板组件
 *
 * 参考 Element UI el-collapse / Ant Design Collapse
 * 支持手风琴模式和自由展开
 *
 * @example
 * ```tsx
 * // 单个使用
 * <CollapseItem title="基本配置" defaultOpen>
 *   <p>内容区域</p>
 * </CollapseItem>
 *
 * // 手风琴模式
 * <Collapse accordion>
 *   <CollapseItem title="参数设置" key="params">内容1</CollapseItem>
 *   <CollapseItem title="输出设置" key="output">内容2</CollapseItem>
 * </Collapse>
 * ```
 */
import React, { useState, createContext, useContext } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// ---- CollapseItem ----

export interface CollapseItemProps {
  /** 标题 */
  title: React.ReactNode;
  /** 唯一标识 */
  itemKey?: string;
  /** 默认是否展开（非受控） */
  defaultOpen?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 右侧额外内容 */
  extra?: React.ReactNode;
  /** 子内容 */
  children: React.ReactNode;
  /** 容器类名 */
  className?: string;
}

interface CollapseContextValue {
  activeKeys: string[];
  toggle: (key: string) => void;
}

const CollapseContext = createContext<CollapseContextValue | null>(null);

export const CollapseItem: React.FC<CollapseItemProps> = ({
  title,
  itemKey,
  defaultOpen = false,
  disabled = false,
  extra,
  children,
  className,
}) => {
  const ctx = useContext(CollapseContext);
  const [localOpen, setLocalOpen] = useState(defaultOpen);

  const isControlled = ctx !== null && itemKey !== undefined;
  const isOpen = isControlled ? ctx.activeKeys.includes(itemKey) : localOpen;

  const handleToggle = () => {
    if (disabled) return;
    if (isControlled) {
      ctx.toggle(itemKey);
    } else {
      setLocalOpen(v => !v);
    }
  };

  return (
    <div className={cn('border border-border rounded-lg', className)}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 text-left',
          'text-sm font-medium text-foreground',
          'hover:bg-muted/50 transition-colors rounded-lg',
          disabled && 'opacity-50 cursor-not-allowed',
          isOpen && 'rounded-b-none'
        )}
      >
        <span className="flex items-center gap-2">{title}</span>
        <div className="flex items-center gap-2">
          {extra && <span onClick={e => e.stopPropagation()}>{extra}</span>}
          <ChevronDownIcon
            className={cn(
              'w-4 h-4 text-muted-foreground transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </button>
      {isOpen && <div className="px-4 pb-4 pt-1 border-t border-border">{children}</div>}
    </div>
  );
};
CollapseItem.displayName = 'CollapseItem';

// ---- Collapse 容器 ----

export interface CollapseProps {
  /** 手风琴模式（同时只展开一个） */
  accordion?: boolean;
  /** 默认展开的 key 列表 */
  defaultActiveKeys?: string[];
  /** 子元素（CollapseItem） */
  children: React.ReactNode;
  /** 容器类名 */
  className?: string;
}

export const Collapse: React.FC<CollapseProps> = ({
  accordion = false,
  defaultActiveKeys = [],
  children,
  className,
}) => {
  const [activeKeys, setActiveKeys] = useState<string[]>(defaultActiveKeys);

  const toggle = (key: string) => {
    setActiveKeys(prev => {
      if (accordion) {
        return prev.includes(key) ? [] : [key];
      }
      return prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
    });
  };

  return (
    <CollapseContext.Provider value={{ activeKeys, toggle }}>
      <div className={cn('space-y-2', className)}>{children}</div>
    </CollapseContext.Provider>
  );
};
Collapse.displayName = 'Collapse';
