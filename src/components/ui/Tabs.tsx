import React from 'react';
import clsx from 'clsx';

interface TabItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  variant?: 'default' | 'pills';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeKey,
  onChange,
  variant = 'default',
  className,
}) => {
  const baseStyles = 'flex';

  const containerStyles = {
    default: 'border-b border-slate-200 dark:border-slate-700',
    pills: 'bg-slate-100 dark:bg-slate-800 p-1 rounded-lg',
  };

  const itemStyles = {
    default: {
      base: 'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
      active: 'border-brand-500 text-brand-600 dark:text-brand-400',
      inactive: 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
    },
    pills: {
      base: 'px-4 py-2 text-sm font-medium rounded-md transition-all',
      active: 'bg-white dark:bg-slate-700 shadow text-brand-600 dark:text-brand-400',
      inactive: 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
    },
  };

  return (
    <div className={clsx(baseStyles, containerStyles[variant], className)}>
      {items.map(item => (
        <button
          key={item.key}
          onClick={() => !item.disabled && onChange(item.key)}
          disabled={item.disabled}
          className={clsx(
            itemStyles[variant].base,
            activeKey === item.key ? itemStyles[variant].active : itemStyles[variant].inactive,
            item.disabled && 'opacity-50 cursor-not-allowed',
            'flex items-center gap-2'
          )}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
};
