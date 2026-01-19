/**
 * 基础输入组件
 *
 * 统一样式的输入框、选择器、文本域等
 */
import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';

/**
 * 输入框基础样式
 */
const inputBaseStyles = cn(
  'flex w-full rounded-lg border border-input bg-background px-3 py-2',
  'text-sm text-foreground placeholder:text-muted-foreground',
  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'transition-colors'
);

/**
 * 文本输入框
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** 错误状态 */
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          inputBaseStyles,
          'h-9',
          error && 'border-destructive focus:ring-destructive',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

/**
 * 数字输入框
 */
export interface NumberInputProps extends Omit<InputProps, 'type' | 'onChange'> {
  /** 值变化回调 */
  onChange?: (value: number | undefined) => void;
  /** 当前值 */
  value?: number;
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
  /** 步长 */
  step?: number;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, onChange, value, ...props }, ref) => {
    return (
      <input
        type="number"
        className={cn(inputBaseStyles, 'h-9 tabular-nums', className)}
        ref={ref}
        value={value ?? ''}
        onChange={e => {
          const val = e.target.value;
          onChange?.(val === '' ? undefined : Number(val));
        }}
        {...props}
      />
    );
  }
);
NumberInput.displayName = 'NumberInput';

/**
 * 选择器
 */
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** 错误状态 */
  error?: boolean;
  /** 选项 */
  options: Array<{ value: string | number; label: string }>;
  /** 占位符选项 */
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, options, placeholder, ...props }, ref) => {
    return (
      <select
        className={cn(
          inputBaseStyles,
          'h-9 cursor-pointer',
          error && 'border-destructive focus:ring-destructive',
          className
        )}
        ref={ref}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
);
Select.displayName = 'Select';

/**
 * 文本域
 */
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** 错误状态 */
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          inputBaseStyles,
          'min-h-[80px] resize-y',
          error && 'border-destructive focus:ring-destructive',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

/**
 * 复选框
 */
export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** 标签文字 */
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const inputId = id || `checkbox-${Math.random().toString(36).slice(2)}`;
    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={inputId}
          className={cn(
            'h-4 w-4 rounded border-input',
            'text-primary focus:ring-2 focus:ring-ring focus:ring-offset-1',
            'cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          ref={ref}
          {...props}
        />
        {label && (
          <label htmlFor={inputId} className="text-sm text-foreground cursor-pointer select-none">
            {label}
          </label>
        )}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

/**
 * 开关
 */
export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** 标签文字 */
  label?: string;
  /** 标签位置 */
  labelPosition?: 'left' | 'right';
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, labelPosition = 'right', id, checked, ...props }, ref) => {
    const inputId = id || `switch-${Math.random().toString(36).slice(2)}`;
    return (
      <div className="flex items-center gap-2">
        {label && labelPosition === 'left' && (
          <label htmlFor={inputId} className="text-sm text-foreground cursor-pointer select-none">
            {label}
          </label>
        )}
        <label htmlFor={inputId} className="relative inline-flex cursor-pointer">
          <input
            type="checkbox"
            id={inputId}
            className="sr-only peer"
            ref={ref}
            checked={checked}
            {...props}
          />
          <div
            className={cn(
              'w-9 h-5 rounded-full transition-colors',
              'bg-input peer-checked:bg-primary',
              'peer-focus:ring-2 peer-focus:ring-ring peer-focus:ring-offset-1',
              'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
              className
            )}
          />
          <div
            className={cn(
              'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-background',
              'transition-transform peer-checked:translate-x-4',
              'shadow-sm'
            )}
          />
        </label>
        {label && labelPosition === 'right' && (
          <label htmlFor={inputId} className="text-sm text-foreground cursor-pointer select-none">
            {label}
          </label>
        )}
      </div>
    );
  }
);
Switch.displayName = 'Switch';
