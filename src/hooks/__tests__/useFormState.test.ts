/**
 * useFormState Hook 测试
 */
import React, { createRef, forwardRef, useImperativeHandle } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { useFormState } from '../useFormState';

interface TestFormData {
  name: string;
  email: string;
  age: number;
}

type UseFormStateReturn = ReturnType<typeof useFormState<TestFormData>>;

interface TestComponentProps {
  initialData?: Partial<TestFormData> | null;
  onSubmit?: (data: Partial<TestFormData>) => Promise<void>;
}

const TestComponent = forwardRef<UseFormStateReturn, TestComponentProps>(
  ({ initialData, onSubmit }, ref) => {
    const formState = useFormState<TestFormData>(initialData, onSubmit);
    useImperativeHandle(ref, () => formState, [formState]);
    return null;
  }
);

TestComponent.displayName = 'TestComponent';

const setup = (
  initialData?: Partial<TestFormData> | null,
  onSubmit?: TestComponentProps['onSubmit']
) => {
  const ref = createRef<UseFormStateReturn>();
  render(React.createElement(TestComponent, { ref, initialData, onSubmit }));
  if (!ref.current) {
    throw new Error('Form state not initialized');
  }
  return { ref };
};

describe('useFormState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  describe('初始化', () => {
    it('没有初始数据时应该返回空表单', () => {
      const { ref } = setup();

      expect(ref.current!.formData).toEqual({});
      expect(ref.current!.errors).toEqual({});
      expect(ref.current!.isSubmitting).toBe(false);
    });

    it('有初始数据时应该初始化表单', () => {
      const initialData: Partial<TestFormData> = {
        name: 'John',
        email: 'john@example.com',
      };

      const { ref } = setup(initialData);

      expect(ref.current!.formData).toEqual(initialData);
    });

    it('初始数据为 null 时应该返回空表单', () => {
      const { ref } = setup(null);

      expect(ref.current!.formData).toEqual({});
    });
  });

  describe('updateField', () => {
    it('应该能更新单个字段', () => {
      const { ref } = setup();

      act(() => {
        ref.current!.updateField('name', 'Alice');
      });

      expect(ref.current!.formData.name).toBe('Alice');
    });

    it('应该保留其他字段的值', () => {
      const initialData: Partial<TestFormData> = {
        name: 'John',
        email: 'john@example.com',
      };

      const { ref } = setup(initialData);

      act(() => {
        ref.current!.updateField('age', 25);
      });

      expect(ref.current!.formData).toEqual({
        name: 'John',
        email: 'john@example.com',
        age: 25,
      });
    });

    it('更新字段时应该清除该字段的错误', () => {
      const { ref } = setup();

      act(() => {
        ref.current!.setErrors({ name: '名称必填' });
      });

      expect(ref.current!.errors.name).toBe('名称必填');

      act(() => {
        ref.current!.updateField('name', 'Alice');
      });

      expect(ref.current!.errors.name).toBeUndefined();
    });
  });

  describe('updateFields', () => {
    it('应该能批量更新多个字段', () => {
      const { ref } = setup();

      act(() => {
        ref.current!.updateFields({
          name: 'Bob',
          email: 'bob@example.com',
          age: 30,
        });
      });

      expect(ref.current!.formData).toEqual({
        name: 'Bob',
        email: 'bob@example.com',
        age: 30,
      });
    });

    it('应该合并而不是替换现有数据', () => {
      const { ref } = setup({ name: 'John' });

      act(() => {
        ref.current!.updateFields({ email: 'john@example.com' });
      });

      expect(ref.current!.formData).toEqual({
        name: 'John',
        email: 'john@example.com',
      });
    });
  });

  describe('resetForm', () => {
    it('有初始数据时应该重置到初始状态', () => {
      const initialData: Partial<TestFormData> = { name: 'John' };

      const { ref } = setup(initialData);

      act(() => {
        ref.current!.updateField('name', 'Alice');
        ref.current!.updateField('email', 'alice@example.com');
      });

      act(() => {
        ref.current!.resetForm();
      });

      expect(ref.current!.formData).toEqual(initialData);
    });

    it('没有初始数据时应该重置为空对象', () => {
      const { ref } = setup();

      act(() => {
        ref.current!.updateField('name', 'Alice');
      });

      act(() => {
        ref.current!.resetForm();
      });

      expect(ref.current!.formData).toEqual({});
    });

    it('重置时应该清除错误', () => {
      const { ref } = setup();

      act(() => {
        ref.current!.setErrors({ name: '错误' });
      });

      act(() => {
        ref.current!.resetForm();
      });

      expect(ref.current!.errors).toEqual({});
    });
  });

  describe('handleSubmit', () => {
    it('没有 onSubmit 回调时应该直接返回', async () => {
      const { ref } = setup();

      await act(async () => {
        await ref.current!.handleSubmit();
      });

      expect(ref.current!.isSubmitting).toBe(false);
    });

    it('应该正确处理表单提交', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      const { ref } = setup({ name: 'John' }, onSubmit);

      await act(async () => {
        await ref.current!.handleSubmit();
      });

      expect(onSubmit).toHaveBeenCalledWith({ name: 'John' });
      expect(ref.current!.isSubmitting).toBe(false);
    });

    it('提交过程中应该设置 isSubmitting 为 true', async () => {
      let resolveSubmit: () => void;
      const onSubmit = vi.fn().mockReturnValue(
        new Promise<void>(resolve => {
          resolveSubmit = resolve;
        })
      );

      const { ref } = setup({ name: 'John' }, onSubmit);

      let submitPromise: Promise<void>;
      act(() => {
        submitPromise = ref.current!.handleSubmit();
      });

      expect(ref.current!.isSubmitting).toBe(true);

      await act(async () => {
        resolveSubmit!();
        await submitPromise;
      });

      expect(ref.current!.isSubmitting).toBe(false);
    });

    it('提交失败时应该设置错误并抛出', async () => {
      const error = { errors: { name: '名称已存在' } };
      const onSubmit = vi.fn().mockRejectedValue(error);

      const { ref } = setup({ name: 'John' }, onSubmit);

      let thrown: unknown;
      await act(async () => {
        try {
          await ref.current!.handleSubmit();
        } catch (err) {
          thrown = err;
        }
      });

      expect(thrown).toEqual(error);
      expect(ref.current!.errors).toEqual({ name: '名称已存在' });
      expect(ref.current!.isSubmitting).toBe(false);
    });

    it('应该阻止表单默认提交行为', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      const { ref } = setup({ name: 'John' }, onSubmit);

      await act(async () => {
        await ref.current!.handleSubmit(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('setFormData', () => {
    it('应该能直接设置表单数据', () => {
      const { ref } = setup();

      act(() => {
        ref.current!.setFormData({ name: 'Direct', email: 'direct@test.com' });
      });

      expect(ref.current!.formData).toEqual({
        name: 'Direct',
        email: 'direct@test.com',
      });
    });
  });

  describe('setErrors', () => {
    it('应该能设置错误信息', () => {
      const { ref } = setup();

      act(() => {
        ref.current!.setErrors({
          name: '名称必填',
          email: '邮箱格式错误',
        });
      });

      expect(ref.current!.errors).toEqual({
        name: '名称必填',
        email: '邮箱格式错误',
      });
    });
  });

  describe('初始数据变化', () => {
    it('初始数据变化时应该更新表单', () => {
      const ref = createRef<UseFormStateReturn>();
      const { rerender } = render(
        React.createElement(TestComponent, { ref, initialData: { name: 'John' } })
      );

      expect(ref.current!.formData.name).toBe('John');

      rerender(React.createElement(TestComponent, { ref, initialData: { name: 'Alice' } }));

      expect(ref.current!.formData.name).toBe('Alice');
    });
  });
});
