/**
 * 动态数组字段组件
 *
 * 支持动态添加/删除/排序的数组字段
 *
 * @example
 * ```tsx
 * <DynamicArrayField
 *   control={form.control}
 *   name="parameters"
 *   label="参数列表"
 *   renderItem={(index) => (
 *     <Input {...form.register(`parameters.${index}.value`)} />
 *   )}
 * />
 * ```
 */
import { useFieldArray, type Control, type FieldValues, type ArrayPath } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DynamicArrayFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends ArrayPath<TFieldValues> = ArrayPath<TFieldValues>,
> {
  /** react-hook-form control 对象 */
  control: Control<TFieldValues>;
  /** 字段名称 */
  name: TName;
  /** 标签文字 */
  label?: string;
  /** 字段描述 */
  description?: string;
  /** 最小项数 */
  minItems?: number;
  /** 最大项数 */
  maxItems?: number;
  /** 添加按钮文字 */
  addButtonText?: string;
  /** 新增项的默认值 */
  defaultValue?: Record<string, unknown>;
  /** 自定义类名 */
  className?: string;
  /** 是否显示拖拽排序 (未实现) */
  sortable?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 渲染单个项 */
  renderItem: (index: number, remove: () => void) => React.ReactNode;
}

export function DynamicArrayField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends ArrayPath<TFieldValues> = ArrayPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  minItems = 0,
  maxItems,
  addButtonText = '添加',
  defaultValue = {},
  className,
  sortable = false,
  disabled = false,
  renderItem,
}: DynamicArrayFieldProps<TFieldValues, TName>) {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  const canRemove = fields.length > minItems;
  const canAdd = maxItems == null || fields.length < maxItems;

  const handleAdd = () => {
    if (canAdd) {
      append(defaultValue as never);
    }
  };

  const handleRemove = (index: number) => {
    if (canRemove) {
      remove(index);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-foreground">{label}</span>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
          <span className="text-xs text-muted-foreground">
            {fields.length} 项{maxItems && ` / 最多 ${maxItems} 项`}
          </span>
        </div>
      )}

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {fields.map((field, index) => (
            <motion.div
              key={field.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div
                className={cn(
                  'flex items-start gap-2 p-3 rounded-lg border border-border bg-card',
                  disabled && 'opacity-50'
                )}
              >
                {sortable && (
                  <button
                    type="button"
                    className="mt-1 cursor-grab text-muted-foreground hover:text-foreground"
                    disabled={disabled}
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                )}
                <div className="flex-1 min-w-0">{renderItem(index, () => handleRemove(index))}</div>
                {canRemove && !disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className={cn(
                      'mt-1 p-1 rounded text-muted-foreground',
                      'hover:text-destructive hover:bg-destructive/10',
                      'transition-colors'
                    )}
                    title="删除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {canAdd && !disabled && (
        <button
          type="button"
          onClick={handleAdd}
          className={cn(
            'flex items-center gap-2 w-full justify-center',
            'py-2 px-4 rounded-lg border-2 border-dashed border-border',
            'text-sm text-muted-foreground',
            'hover:border-primary hover:text-primary',
            'transition-colors'
          )}
        >
          <Plus className="h-4 w-4" />
          {addButtonText}
        </button>
      )}
    </div>
  );
}
