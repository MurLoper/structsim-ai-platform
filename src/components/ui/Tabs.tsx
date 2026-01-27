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
    default: 'border-b border-border',
    pills: 'bg-secondary p-1 rounded-lg',
  };

  const itemStyles = {
    default: {
      base: 'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
      active: 'border-primary text-primary',
      inactive: 'border-transparent text-muted-foreground hover:text-foreground',
    },
    pills: {
      base: 'px-4 py-2 text-sm font-medium rounded-md transition-all',
      active: 'bg-card shadow text-primary',
      inactive: 'text-muted-foreground hover:text-foreground',
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
