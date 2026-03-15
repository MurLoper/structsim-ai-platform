/**
 * Dropdown - 下拉菜单组件
 *
 * 参考 Element UI el-dropdown / Ant Design Dropdown
 * 用于操作菜单、更多操作等场景
 *
 * @example
 * ```tsx
 * <Dropdown items={[
 *   { key: 'edit', label: '编辑', icon: <PencilIcon className="w-4 h-4" /> },
 *   { key: 'delete', label: '删除', danger: true },
 *   { type: 'divider' },
 *   { key: 'export', label: '导出' },
 * ]} onSelect={handleSelect}>
 *   <Button>更多操作</Button>
 * </Dropdown>
 * ```
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface DropdownItem {
  /** 唯一标识 */
  key?: string;
  /** 显示文字 */
  label?: React.ReactNode;
  /** 图标 */
  icon?: React.ReactNode;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否危险操作（红色） */
  danger?: boolean;
  /** 分隔线类型 */
  type?: 'divider';
}

export interface DropdownProps {
  /** 菜单项 */
  items: DropdownItem[];
  /** 选择回调 */
  onSelect?: (key: string) => void;
  /** 触发元素 */
  children: React.ReactElement;
  /** 触发方式 */
  trigger?: 'click' | 'hover';
  /** 弹出位置 */
  placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
  /** 容器类名 */
  className?: string;
  /** 菜单类名 */
  menuClassName?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  items,
  onSelect,
  children,
  trigger = 'click',
  placement = 'bottomLeft',
  className,
  menuClassName,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleTriggerClick = useCallback(() => {
    if (trigger === 'click') setOpen(v => !v);
  }, [trigger]);

  const handleMouseEnter = useCallback(() => {
    if (trigger === 'hover') {
      clearTimeout(timerRef.current);
      setOpen(true);
    }
  }, [trigger]);

  const handleMouseLeave = useCallback(() => {
    if (trigger === 'hover') {
      timerRef.current = setTimeout(() => setOpen(false), 150);
    }
  }, [trigger]);

  const handleSelect = (item: DropdownItem) => {
    if (item.disabled || item.type === 'divider') return;
    onSelect?.(item.key || '');
    setOpen(false);
  };

  const placementStyles = {
    bottomLeft: 'top-full left-0 mt-1',
    bottomRight: 'top-full right-0 mt-1',
    topLeft: 'bottom-full left-0 mb-1',
    topRight: 'bottom-full right-0 mb-1',
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-flex', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div onClick={handleTriggerClick}>{children}</div>
      {open && (
        <div
          className={cn(
            'absolute z-50 min-w-[160px] py-1 rounded-lg shadow-lg',
            'bg-popover text-popover-foreground border border-border',
            'animate-fade-in',
            placementStyles[placement],
            menuClassName
          )}
        >
          {items.map((item, i) => {
            if (item.type === 'divider') {
              return <div key={`d-${i}`} className="my-1 border-t border-border" />;
            }
            return (
              <button
                key={item.key || i}
                disabled={item.disabled}
                onClick={() => handleSelect(item)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
                  'transition-colors',
                  item.danger ? 'text-destructive hover:bg-destructive/10' : 'hover:bg-muted',
                  item.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
Dropdown.displayName = 'Dropdown';
