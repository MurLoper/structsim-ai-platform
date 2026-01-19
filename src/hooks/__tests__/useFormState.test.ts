/**
 * useFormState Hook 测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFormState } from '../useFormState';

interface TestFormData {
  name: string;
  email: string;
  age: number;
}

describe('useFormState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('初始化', () => {
    it('没有初始数据时应该返回空表单', () => {
      const { result } = renderHook(() => useFormState<TestFormData>());

      expect(result.current.formData).toEqual({});
      expect(result.current.errors).toEqual({});
      expect(result.current.isSubmitting).toBe(false);
    });

    it('有初始数据时应该初始化表单', () => {
      const initialData: Partial<TestFormData> = {
        name: 'John',
        email: 'john@example.com',
      };

      const { result } = renderHook(() => useFormState<TestFormData>(initialData));

      expect(result.current.formData).toEqual(initialData);
    });

    it('初始数据为 null 时应该返回空表单', () => {
      const { result } = renderHook(() => useFormState<TestFormData>(null));

      expect(result.current.formData).toEqual({});
    });
  });

  describe('updateField', () => {
    it('应该能更新单个字段', () => {
      const { result } = renderHook(() => useFormState<TestFormData>());

      act(() => {
        result.current.updateField('name', 'Alice');
      });

      expect(result.current.formData.name).toBe('Alice');
    });

    it('应该保留其他字段的值', () => {
      const initialData: Partial<TestFormData> = {
        name: 'John',
        email: 'john@example.com',
      };

      const { result } = renderHook(() => useFormState<TestFormData>(initialData));

      act(() => {
        result.current.updateField('age', 25);
      });

      expect(result.current.formData).toEqual({
        name: 'John',
        email: 'john@example.com',
        age: 25,
      });
    });

    it('更新字段时应该清除该字段的错误', () => {
      const { result } = renderHook(() => useFormState<TestFormData>());

      // Set an error first
      act(() => {
        result.current.setErrors({ name: '名称必填' });
      });

      expect(result.current.errors.name).toBe('名称必填');

      // Update the field
      act(() => {
        result.current.updateField('name', 'Alice');
      });

      expect(result.current.errors.name).toBeUndefined();
    });
  });

  describe('updateFields', () => {
    it('应该能批量更新多个字段', () => {
      const { result } = renderHook(() => useFormState<TestFormData>());

      act(() => {
        result.current.updateFields({
          name: 'Bob',
          email: 'bob@example.com',
          age: 30,
        });
      });

      expect(result.current.formData).toEqual({
        name: 'Bob',
        email: 'bob@example.com',
        age: 30,
      });
    });

    it('应该合并而不是替换现有数据', () => {
      const { result } = renderHook(() => useFormState<TestFormData>({ name: 'John' }));

      act(() => {
        result.current.updateFields({ email: 'john@example.com' });
      });

      expect(result.current.formData).toEqual({
        name: 'John',
        email: 'john@example.com',
      });
    });
  });

  describe('resetForm', () => {
    it('有初始数据时应该重置到初始状态', () => {
      const initialData: Partial<TestFormData> = { name: 'John' };

      const { result } = renderHook(() => useFormState<TestFormData>(initialData));

      // Modify the form
      act(() => {
        result.current.updateField('name', 'Alice');
        result.current.updateField('email', 'alice@example.com');
      });

      // Reset
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formData).toEqual(initialData);
    });

    it('没有初始数据时应该重置为空对象', () => {
      const { result } = renderHook(() => useFormState<TestFormData>());

      // Add some data
      act(() => {
        result.current.updateField('name', 'Alice');
      });

      // Reset
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formData).toEqual({});
    });

    it('重置时应该清除错误', () => {
      const { result } = renderHook(() => useFormState<TestFormData>());

      // Set errors
      act(() => {
        result.current.setErrors({ name: '错误' });
      });

      // Reset
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.errors).toEqual({});
    });
  });

  describe('handleSubmit', () => {
    it('没有 onSubmit 回调时应该直接返回', async () => {
      const { result } = renderHook(() => useFormState<TestFormData>());

      await act(async () => {
        await result.current.handleSubmit();
      });

      // Should not throw or change state
      expect(result.current.isSubmitting).toBe(false);
    });

    it('应该正确处理表单提交', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() => useFormState<TestFormData>({ name: 'John' }, onSubmit));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(onSubmit).toHaveBeenCalledWith({ name: 'John' });
      expect(result.current.isSubmitting).toBe(false);
    });

    it('提交过程中应该设置 isSubmitting 为 true', async () => {
      let resolveSubmit: () => void;
      const onSubmit = vi.fn().mockReturnValue(
        new Promise<void>(resolve => {
          resolveSubmit = resolve;
        })
      );

      const { result } = renderHook(() => useFormState<TestFormData>({ name: 'John' }, onSubmit));

      // Start submit but don't await
      let submitPromise: Promise<void>;
      act(() => {
        submitPromise = result.current.handleSubmit();
      });

      // Check isSubmitting during submission
      expect(result.current.isSubmitting).toBe(true);

      // Complete submission
      await act(async () => {
        resolveSubmit!();
        await submitPromise;
      });

      expect(result.current.isSubmitting).toBe(false);
    });

    it('提交失败时应该设置错误并抛出', async () => {
      const error = { errors: { name: '名称已存在' } };
      const onSubmit = vi.fn().mockRejectedValue(error);

      const { result } = renderHook(() => useFormState<TestFormData>({ name: 'John' }, onSubmit));

      await expect(
        act(async () => {
          await result.current.handleSubmit();
        })
      ).rejects.toEqual(error);

      expect(result.current.errors).toEqual({ name: '名称已存在' });
      expect(result.current.isSubmitting).toBe(false);
    });

    it('应该阻止表单默认提交行为', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      const { result } = renderHook(() => useFormState<TestFormData>({ name: 'John' }, onSubmit));

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('setFormData', () => {
    it('应该能直接设置表单数据', () => {
      const { result } = renderHook(() => useFormState<TestFormData>());

      act(() => {
        result.current.setFormData({ name: 'Direct', email: 'direct@test.com' });
      });

      expect(result.current.formData).toEqual({
        name: 'Direct',
        email: 'direct@test.com',
      });
    });
  });

  describe('setErrors', () => {
    it('应该能设置错误信息', () => {
      const { result } = renderHook(() => useFormState<TestFormData>());

      act(() => {
        result.current.setErrors({
          name: '名称必填',
          email: '邮箱格式错误',
        });
      });

      expect(result.current.errors).toEqual({
        name: '名称必填',
        email: '邮箱格式错误',
      });
    });
  });

  describe('初始数据变化', () => {
    it('初始数据变化时应该更新表单', () => {
      const { result, rerender } = renderHook(({ data }) => useFormState<TestFormData>(data), {
        initialProps: { data: { name: 'John' } as Partial<TestFormData> },
      });

      expect(result.current.formData.name).toBe('John');

      rerender({ data: { name: 'Alice' } });

      expect(result.current.formData.name).toBe('Alice');
    });
  });
});
