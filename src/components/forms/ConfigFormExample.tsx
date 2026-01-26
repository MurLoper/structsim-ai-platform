import React from 'react';
import { useFormState, FormFieldConfig } from '@/hooks/useFormState';

/**
 * 通用配置表单组件示例
 * 展示如何使用 useFormState Hook
 */

interface ExampleFormProps<T> {
  initialData?: Partial<T> | null;
  fields: FormFieldConfig[];
  onSubmit: (data: Partial<T>) => Promise<void>;
  onCancel: () => void;
  title?: string;
}

export function ConfigFormExample<T extends Record<string, unknown>>({
  initialData,
  fields,
  onSubmit,
  onCancel,
  title = '配置表单',
}: ExampleFormProps<T>) {
  const { formData, updateField, handleSubmit, isSubmitting, errors } = useFormState<T>(
    initialData,
    onSubmit
  );

  const renderField = (field: FormFieldConfig) => {
    const value = formData[field.name as keyof T];

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={(value as string) || ''}
            onChange={e => updateField(field.name as keyof T, e.target.value as T[keyof T])}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={(value as number) || ''}
            onChange={e => updateField(field.name as keyof T, Number(e.target.value) as T[keyof T])}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={(value as string) || ''}
            onChange={e => updateField(field.name as keyof T, e.target.value as T[keyof T])}
            placeholder={field.placeholder}
            rows={field.rows || 3}
            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
          />
        );

      case 'select':
        return (
          <select
            value={(value as string) || ''}
            onChange={e => updateField(field.name as keyof T, e.target.value as T[keyof T])}
            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
          >
            <option value="">请选择</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={(value as boolean) || false}
            onChange={e => updateField(field.name as keyof T, e.target.checked as T[keyof T])}
            className="w-4 h-4 text-blue-600 rounded"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b dark:border-slate-700">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {fields.map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderField(field)}
              {errors[field.name] && (
                <p className="text-red-500 text-sm mt-1">{errors[field.name]}</p>
              )}
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? '提交中...' : '确定'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 使用示例：
 *
 * interface FoldType {
 *   id?: number;
 *   name: string;
 *   code: string;
 *   angle: number;
 *   remark?: string;
 *   sort: number;
 * }
 *
 * const fields: FormFieldConfig[] = [
 *   { name: 'name', label: '姿态名称', type: 'text', required: true },
 *   { name: 'code', label: '姿态编码', type: 'text', required: true },
 *   { name: 'angle', label: '角度', type: 'number', min: 0, max: 360 },
 *   { name: 'remark', label: '备注', type: 'textarea', rows: 3 },
 *   { name: 'sort', label: '排序', type: 'number', min: 0 },
 * ];
 *
 * <ConfigFormExample<FoldType>
 *   initialData={editingItem}
 *   fields={fields}
 *   onSubmit={handleSave}
 *   onCancel={() => setShowModal(false)}
 *   title={editingItem ? '编辑姿态类型' : '新建姿态类型'}
 * />
 */
