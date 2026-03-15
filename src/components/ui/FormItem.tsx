/**
 * FormItem - 表单项容器组件
 *
 * 不依赖 React Hook Form，类似 Element UI 的 el-form-item
 * 提供 label + 输入区域 + error/hint 的统一布局
 *
 * @example
 * ```tsx
 * <FormItem label="用户名" required error="请输入用户名">
 *   <Input value={name} onChange={e => setName(e.target.value)} />
 * </FormItem>
 *
 * <FormItem label="描述" hint="最多200字">
 *   <Textarea value={desc} onChange={e => setDesc(e.target.value)} />
 * </FormItem>
 * ```
 */
import React from 'react';
import { cn } from '@/lib/utils';

export interface FormItemProps {
  /** 标签文字 */
  label?: string;
  /** 是否必填（显示红色星号） */
  required?: boolean;
  /** 错误信息 */
  error?: string;
  /** 提示信息（error优先级高于hint） */
  hint?: string;
  /** 标签宽度，用于水平布局对齐 */
  labelWidth?: string;
  /** 布局方向 */
  layout?: 'vertical' | 'horizontal';
  /** 子元素 */
  children: React.ReactNode;
  /** 外层容器类名 */
  className?: string;
  /** 标签类名 */
  labelClassName?: string;
  /** htmlFor 对应 input 的 id */
  htmlFor?: string;
}

export const FormItem: React.FC<FormItemProps> = ({
  label,
  required,
  error,
  hint,
  layout = 'vertical',
  labelWidth,
  children,
  className,
  labelClassName,
  htmlFor,
}) => {
  const isHorizontal = layout === 'horizontal';

  return (
    <div className={cn(isHorizontal ? 'flex items-start gap-4' : 'space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className={cn(
            'text-sm font-medium text-foreground',
            isHorizontal && 'pt-2 shrink-0 text-right',
            labelClassName
          )}
          style={isHorizontal && labelWidth ? { width: labelWidth } : undefined}
        >
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
      )}
      <div className={cn(isHorizontal && 'flex-1', 'space-y-1')}>
        {children}
        {error && <p className="text-xs text-destructive">{error}</p>}
        {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
};
FormItem.displayName = 'FormItem';
