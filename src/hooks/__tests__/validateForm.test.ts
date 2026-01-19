/**
 * validateForm 函数测试
 * 这是一个纯函数，不需要 React 环境
 */
import { describe, it, expect } from 'vitest';
import { validateForm, type ValidationRule } from '../useFormState';

interface TestFormData {
  name: string;
  email: string;
  age: number;
}

describe('validateForm', () => {
  describe('required 规则', () => {
    it('必填字段为空时应该返回错误', () => {
      const rules: Record<keyof TestFormData, ValidationRule> = {
        name: { required: true },
        email: {},
        age: {},
      };

      const errors = validateForm<TestFormData>({}, rules);
      expect(errors.name).toBe('此字段为必填项');
    });

    it('必填字段有值时不应该返回错误', () => {
      const rules: Record<keyof TestFormData, ValidationRule> = {
        name: { required: true },
        email: {},
        age: {},
      };

      const errors = validateForm<TestFormData>({ name: 'John' }, rules);
      expect(errors.name).toBeUndefined();
    });

    it('必填字段为空字符串时应该返回错误', () => {
      const rules: Record<keyof TestFormData, ValidationRule> = {
        name: { required: true },
        email: {},
        age: {},
      };

      const errors = validateForm<TestFormData>({ name: '' }, rules);
      expect(errors.name).toBe('此字段为必填项');
    });

    it('必填字段为 null 时应该返回错误', () => {
      const rules: Record<keyof TestFormData, ValidationRule> = {
        name: { required: true },
        email: {},
        age: {},
      };

      const errors = validateForm<TestFormData>({ name: null as any }, rules);
      expect(errors.name).toBe('此字段为必填项');
    });
  });

  describe('min/max 规则', () => {
    it('数值小于最小值时应该返回错误', () => {
      const rules: Record<keyof TestFormData, ValidationRule> = {
        name: {},
        email: {},
        age: { min: 18 },
      };

      const errors = validateForm<TestFormData>({ age: 15 }, rules);
      expect(errors.age).toBe('最小值为 18');
    });

    it('数值大于最大值时应该返回错误', () => {
      const rules: Record<keyof TestFormData, ValidationRule> = {
        name: {},
        email: {},
        age: { max: 100 },
      };

      const errors = validateForm<TestFormData>({ age: 150 }, rules);
      expect(errors.age).toBe('最大值为 100');
    });

    it('数值在范围内时不应该返回错误', () => {
      const rules: Record<keyof TestFormData, ValidationRule> = {
        name: {},
        email: {},
        age: { min: 18, max: 100 },
      };

      const errors = validateForm<TestFormData>({ age: 25 }, rules);
      expect(errors.age).toBeUndefined();
    });

    it('数值等于最小值时不应该返回错误', () => {
      const rules: Record<keyof TestFormData, ValidationRule> = {
        name: {},
        email: {},
        age: { min: 18 },
      };

      const errors = validateForm<TestFormData>({ age: 18 }, rules);
      expect(errors.age).toBeUndefined();
    });

    it('数值等于最大值时不应该返回错误', () => {
      const rules: Record<keyof TestFormData, ValidationRule> = {
        name: {},
        email: {},
        age: { max: 100 },
      };

      const errors = validateForm<TestFormData>({ age: 100 }, rules);
      expect(errors.age).toBeUndefined();
    });
  });

  describe('pattern 规则', () => {
    it('格式不匹配时应该返回错误', () => {
      const rules: Record<keyof TestFormData, ValidationRule> = {
        name: {},
        email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        age: {},
      };

      const errors = validateForm<TestFormData>({ email: 'invalid-email' }, rules);
      expect(errors.email).toBe('格式不正确');
    });

    it('格式匹配时不应该返回错误', () => {
      const rules: Record<keyof TestFormData, ValidationRule> = {
        name: {},
        email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        age: {},
      };

      const errors = validateForm<TestFormData>({ email: 'test@example.com' }, rules);
      expect(errors.email).toBeUndefined();
    });

    it('空值时不应该检查 pattern', () => {
      const rules: Record<keyof TestFormData, ValidationRule> = {
        name: {},
        email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        age: {},
      };

      const errors = validateForm<TestFormData>({}, rules);
      expect(errors.email).toBeUndefined();
    });
  });

  describe('custom 规则', () => {
    it('自定义验证失败时应该返回错误', () => {
      const rules: Record<keyof TestFormData, ValidationRule> = {
        name: {
          custom: value => (value === 'admin' ? '用户名不能为 admin' : null),
        },
        email: {},
        age: {},
      };

      const errors = validateForm<TestFormData>({ name: 'admin' }, rules);
      expect(errors.name).toBe('用户名不能为 admin');
    });

    it('自定义验证通过时不应该返回错误', () => {
      const rules: Record<keyof TestFormData, ValidationRule> = {
        name: {
          custom: value => (value === 'admin' ? '用户名不能为 admin' : null),
        },
        email: {},
        age: {},
      };

      const errors = validateForm<TestFormData>({ name: 'john' }, rules);
      expect(errors.name).toBeUndefined();
    });
  });

  describe('组合规则', () => {
    it('应该验证多个字段', () => {
      const rules: Record<keyof TestFormData, ValidationRule> = {
        name: { required: true },
        email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        age: { required: true, min: 18 },
      };

      const errors = validateForm<TestFormData>({ name: '', email: 'invalid', age: 15 }, rules);

      expect(errors.name).toBe('此字段为必填项');
      expect(errors.email).toBe('格式不正确');
      expect(errors.age).toBe('最小值为 18');
    });

    it('所有字段通过验证时应该返回空对象', () => {
      const rules: Record<keyof TestFormData, ValidationRule> = {
        name: { required: true },
        email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        age: { required: true, min: 18, max: 100 },
      };

      const errors = validateForm<TestFormData>(
        { name: 'John', email: 'john@example.com', age: 25 },
        rules
      );

      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('required 失败时应该跳过其他规则', () => {
      const rules: Record<keyof TestFormData, ValidationRule> = {
        name: { required: true, custom: () => '自定义错误' },
        email: {},
        age: {},
      };

      const errors = validateForm<TestFormData>({ name: '' }, rules);
      expect(errors.name).toBe('此字段为必填项');
    });
  });
});
