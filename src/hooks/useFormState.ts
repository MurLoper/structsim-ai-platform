import { useState, useEffect, useCallback } from 'react';

/**
 * 通用表单状态管理 Hook
 * 解决表单数据更新不及时、闭包陷阱等问题
 */
export function useFormState<T extends Record<string, unknown>>(
  initialData?: Partial<T> | null,
  onSubmit?: (data: Partial<T>) => Promise<void>
) {
  const [formData, setFormData] = useState<Partial<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 当初始数据改变时，重置表单
  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    } else {
      setFormData({});
    }
    setErrors({});
  }, [initialData]);

  // 更新单个字段
  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      return newData;
    });
    // 清除该字段的错误
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[String(field)];
      return newErrors;
    });
  }, []);

  // 批量更新多个字段
  const updateFields = useCallback((updates: Partial<T>) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      return newData;
    });
  }, []);

  // 重置表单
  const resetForm = useCallback(() => {
    if (initialData) {
      setFormData({ ...initialData });
    } else {
      setFormData({});
    }
    setErrors({});
  }, [initialData]);

  // 提交表单
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      if (!onSubmit) {
        return;
      }

      setIsSubmitting(true);
      setErrors({});

      try {
        await onSubmit(formData);
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'errors' in error) {
          setErrors((error as { errors: Record<string, string> }).errors);
        }
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, onSubmit]
  );

  return {
    formData,
    setFormData,
    updateField,
    updateFields,
    resetForm,
    handleSubmit,
    isSubmitting,
    errors,
    setErrors,
  };
}

/**
 * 表单字段配置类型
 */
export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string | number; label: string }>;
  min?: number;
  max?: number;
  rows?: number;
}

/**
 * 表单验证规则
 */
export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => string | null;
}

/**
 * 验证表单数据
 */
export function validateForm<T>(
  data: Partial<T>,
  rules: Record<keyof T, ValidationRule>
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const [field, rule] of Object.entries(rules) as [keyof T, ValidationRule][]) {
    const value = data[field];

    if (rule.required && (value === undefined || value === null || value === '')) {
      errors[String(field)] = '此字段为必填项';
      continue;
    }

    if (value !== undefined && value !== null && value !== '') {
      if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
        errors[String(field)] = `最小值为 ${rule.min}`;
      }

      if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
        errors[String(field)] = `最大值为 ${rule.max}`;
      }

      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors[String(field)] = '格式不正确';
      }

      if (rule.custom) {
        const customError = rule.custom(value);
        if (customError) {
          errors[String(field)] = customError;
        }
      }
    }
  }

  return errors;
}
