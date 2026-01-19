/**
 * 表单字段包装组件
 *
 * 基于 React Hook Form 的表单字段封装
 * 提供统一的标签、错误提示、必填标记等功能
 *
 * @example
 * ```tsx
 * <FormField
 *   control={form.control}
 *   name="username"
 *   label="用户名"
 *   required
 *   render={({ field }) => <Input {...field} />}
 * />
 * ```
 */
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
  type ControllerRenderProps,
  type ControllerFieldState,
  type UseFormStateReturn,
} from 'react-hook-form';
import { cn } from '@/lib/utils';

export interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  /** react-hook-form control 对象 */
  control: Control<TFieldValues>;
  /** 字段名称 */
  name: TName;
  /** 标签文字 */
  label?: string;
  /** 字段描述 */
  description?: string;
  /** 是否必填 */
  required?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 标签类名 */
  labelClassName?: string;
  /** 渲染函数 */
  render: (props: {
    field: ControllerRenderProps<TFieldValues, TName>;
    fieldState: ControllerFieldState;
    formState: UseFormStateReturn<TFieldValues>;
  }) => React.ReactNode;
}

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  className,
  labelClassName,
  render,
}: FormFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      disabled={disabled}
      render={({ field, fieldState, formState }) => (
        <div className={cn('space-y-1.5', className)}>
          {label && (
            <label
              htmlFor={name}
              className={cn('text-sm font-medium text-foreground', labelClassName)}
            >
              {label}
              {required && <span className="ml-1 text-destructive">*</span>}
            </label>
          )}
          {render({ field, fieldState, formState })}
          {description && !fieldState.error && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {fieldState.error && (
            <p className="text-xs text-destructive">{fieldState.error.message}</p>
          )}
        </div>
      )}
    />
  );
}

/**
 * 表单字段组 - 用于水平排列多个字段
 */
export interface FormFieldGroupProps {
  children: React.ReactNode;
  /** 列数 */
  columns?: 2 | 3 | 4;
  /** 间距 */
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FormFieldGroup({
  children,
  columns = 2,
  gap = 'md',
  className,
}: FormFieldGroupProps) {
  const colsClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  const gapClass = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  };

  return <div className={cn('grid', colsClass[columns], gapClass[gap], className)}>{children}</div>;
}

/**
 * 表单分组 - 带标题的表单区域
 */
export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** 是否可折叠 */
  collapsible?: boolean;
  /** 默认是否展开 */
  defaultOpen?: boolean;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-1">
        <h4 className="text-base font-semibold text-foreground">{title}</h4>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
