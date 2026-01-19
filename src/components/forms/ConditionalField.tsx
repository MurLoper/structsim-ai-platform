/**
 * 条件字段组件
 *
 * 根据条件显示/隐藏字段，支持动画过渡
 *
 * @example
 * ```tsx
 * <ConditionalField
 *   watch={form.watch}
 *   condition={(values) => values.type === 'range'}
 * >
 *   <Input {...form.register('min')} />
 *   <Input {...form.register('max')} />
 * </ConditionalField>
 * ```
 */
import { type UseFormWatch, type FieldValues } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ConditionalFieldProps<TFieldValues extends FieldValues> {
  /** react-hook-form watch 函数 */
  watch: UseFormWatch<TFieldValues>;
  /** 条件判断函数 */
  condition: (values: TFieldValues) => boolean;
  /** 子元素 */
  children: React.ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 是否使用动画 */
  animated?: boolean;
}

export function ConditionalField<TFieldValues extends FieldValues>({
  watch,
  condition,
  children,
  className,
  animated = true,
}: ConditionalFieldProps<TFieldValues>) {
  const values = watch();
  const shouldShow = condition(values);

  if (!animated) {
    return shouldShow ? <div className={className}>{children}</div> : null;
  }

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className={cn('overflow-hidden', className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * 基于字段值的条件显示
 *
 * @example
 * ```tsx
 * <WhenFieldEquals
 *   watch={form.watch}
 *   field="type"
 *   value="enum"
 * >
 *   <EnumOptionsEditor />
 * </WhenFieldEquals>
 * ```
 */
export interface WhenFieldEqualsProps<TFieldValues extends FieldValues, TValue = unknown> {
  /** react-hook-form watch 函数 */
  watch: UseFormWatch<TFieldValues>;
  /** 要监听的字段名 */
  field: keyof TFieldValues;
  /** 期望的值 */
  value: TValue;
  /** 子元素 */
  children: React.ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 是否使用动画 */
  animated?: boolean;
}

export function WhenFieldEquals<TFieldValues extends FieldValues, TValue = unknown>({
  watch,
  field,
  value,
  children,
  className,
  animated = true,
}: WhenFieldEqualsProps<TFieldValues, TValue>) {
  return (
    <ConditionalField
      watch={watch}
      condition={values => values[field] === value}
      className={className}
      animated={animated}
    >
      {children}
    </ConditionalField>
  );
}

/**
 * 基于多个值的条件显示
 *
 * @example
 * ```tsx
 * <WhenFieldIn
 *   watch={form.watch}
 *   field="valType"
 *   values={[1, 2]}
 * >
 *   <NumberRangeFields />
 * </WhenFieldIn>
 * ```
 */
export interface WhenFieldInProps<TFieldValues extends FieldValues, TValue = unknown> {
  /** react-hook-form watch 函数 */
  watch: UseFormWatch<TFieldValues>;
  /** 要监听的字段名 */
  field: keyof TFieldValues;
  /** 期望的值列表 */
  values: TValue[];
  /** 子元素 */
  children: React.ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 是否使用动画 */
  animated?: boolean;
}

export function WhenFieldIn<TFieldValues extends FieldValues, TValue = unknown>({
  watch,
  field,
  values,
  children,
  className,
  animated = true,
}: WhenFieldInProps<TFieldValues, TValue>) {
  return (
    <ConditionalField
      watch={watch}
      condition={formValues => values.includes(formValues[field] as TValue)}
      className={className}
      animated={animated}
    >
      {children}
    </ConditionalField>
  );
}
