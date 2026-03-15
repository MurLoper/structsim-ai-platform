/**
 * Radio / RadioGroup - 单选组件
 *
 * 参考 Element UI el-radio-group / Ant Design Radio.Group
 * 支持普通单选和按钮式单选
 *
 * @example
 * ```tsx
 * <RadioGroup value={type} onChange={setType} options={[
 *   { value: 'doe', label: 'DOE 模式' },
 *   { value: 'opt', label: '优化模式' },
 * ]} />
 *
 * <RadioGroup value={size} onChange={setSize} variant="button" options={[
 *   { value: 'sm', label: '小' },
 *   { value: 'md', label: '中' },
 *   { value: 'lg', label: '大' },
 * ]} />
 * ```
 */
import React from 'react';
import { cn } from '@/lib/utils';

export interface RadioOption {
  value: string | number;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  /** 当前值 */
  value: string | number;
  /** 值变化回调 */
  onChange: (value: string | number) => void;
  /** 选项列表 */
  options: RadioOption[];
  /** 展示形式 */
  variant?: 'default' | 'button';
  /** 尺寸 */
  size?: 'sm' | 'md';
  /** 方向（仅 default 模式） */
  direction?: 'horizontal' | 'vertical';
  /** 名称（用于原生 radio name 属性） */
  name?: string;
  /** 是否禁用整组 */
  disabled?: boolean;
  /** 容器类名 */
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  value,
  onChange,
  options,
  variant = 'default',
  size = 'md',
  direction = 'horizontal',
  name,
  disabled = false,
  className,
}) => {
  const radioName = name || `radio-${Math.random().toString(36).slice(2, 8)}`;

  if (variant === 'button') {
    return (
      <div
        className={cn('inline-flex rounded-lg border border-input bg-muted/30 p-0.5', className)}
      >
        {options.map(opt => {
          const isActive = value === opt.value;
          const isDisabled = disabled || opt.disabled;
          return (
            <button
              key={String(opt.value)}
              type="button"
              disabled={isDisabled}
              onClick={() => !isDisabled && onChange(opt.value)}
              className={cn(
                'rounded-md font-medium transition-all',
                size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm',
                isActive
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
                isDisabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  // default 模式
  return (
    <div className={cn('flex gap-4', direction === 'vertical' && 'flex-col gap-2', className)}>
      {options.map(opt => {
        const isActive = value === opt.value;
        const isDisabled = disabled || opt.disabled;
        const id = `${radioName}-${opt.value}`;
        return (
          <label
            key={String(opt.value)}
            htmlFor={id}
            className={cn(
              'flex items-center gap-2 cursor-pointer select-none',
              size === 'sm' ? 'text-xs' : 'text-sm',
              isDisabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <input
              type="radio"
              id={id}
              name={radioName}
              value={String(opt.value)}
              checked={isActive}
              disabled={isDisabled}
              onChange={() => onChange(opt.value)}
              className={cn(
                'w-4 h-4 border-input text-primary',
                'focus:ring-2 focus:ring-ring focus:ring-offset-1',
                'cursor-pointer disabled:cursor-not-allowed'
              )}
            />
            <span className="text-foreground">{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
};
RadioGroup.displayName = 'RadioGroup';
