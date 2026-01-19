/**
 * Input 和 Select 组件测试
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input, Select } from '../Input';

describe('Input', () => {
  // ============================================================
  // 基础渲染测试
  // ============================================================

  describe('渲染', () => {
    it('应该正确渲染 input 元素', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('应该渲染 label', () => {
      render(<Input label="Username" />);
      expect(screen.getByText('Username')).toBeInTheDocument();
    });

    it('label 应该关联到 input', () => {
      render(<Input label="Email" id="email-input" />);
      const input = screen.getByLabelText('Email');
      expect(input).toBeInTheDocument();
    });

    it('没有 id 时应该自动生成', () => {
      render(<Input label="Test" />);
      const input = screen.getByLabelText('Test');
      expect(input).toHaveAttribute('id');
    });
  });

  // ============================================================
  // 错误状态测试
  // ============================================================

  describe('错误状态', () => {
    it('应该显示错误信息', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('错误状态下应该有红色边框样式', () => {
      render(<Input error="Error" data-testid="error-input" />);
      const input = screen.getByTestId('error-input');
      expect(input.className).toContain('border-red-500');
    });

    it('有错误时不应该显示 hint', () => {
      render(<Input error="Error" hint="This is a hint" />);
      expect(screen.queryByText('This is a hint')).not.toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  // ============================================================
  // 提示信息测试
  // ============================================================

  describe('提示信息', () => {
    it('应该显示 hint', () => {
      render(<Input hint="Enter your email address" />);
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    });
  });

  // ============================================================
  // 图标测试
  // ============================================================

  describe('图标', () => {
    it('应该渲染左侧图标', () => {
      render(<Input leftIcon={<span data-testid="left-icon">@</span>} />);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('应该渲染右侧图标', () => {
      render(<Input rightIcon={<span data-testid="right-icon">✓</span>} />);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('有左侧图标时应该添加左边距', () => {
      render(<Input leftIcon={<span>@</span>} data-testid="input-with-left-icon" />);
      const input = screen.getByTestId('input-with-left-icon');
      expect(input.className).toContain('pl-10');
    });

    it('有右侧图标时应该添加右边距', () => {
      render(<Input rightIcon={<span>✓</span>} data-testid="input-with-right-icon" />);
      const input = screen.getByTestId('input-with-right-icon');
      expect(input.className).toContain('pr-10');
    });
  });

  // ============================================================
  // 事件测试
  // ============================================================

  describe('事件', () => {
    it('应该触发 onChange', () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });
      expect(handleChange).toHaveBeenCalled();
    });

    it('应该触发 onFocus', () => {
      const handleFocus = vi.fn();
      render(<Input onFocus={handleFocus} />);
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      expect(handleFocus).toHaveBeenCalled();
    });

    it('应该触发 onBlur', () => {
      const handleBlur = vi.fn();
      render(<Input onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      expect(handleBlur).toHaveBeenCalled();
    });
  });

  // ============================================================
  // 属性透传测试
  // ============================================================

  describe('属性透传', () => {
    it('应该透传 type 属性', () => {
      render(<Input type="password" data-testid="password-input" />);
      const input = screen.getByTestId('password-input');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('应该透传 disabled 属性', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('应该透传 className', () => {
      render(<Input className="custom-class" data-testid="custom-input" />);
      const input = screen.getByTestId('custom-input');
      expect(input.className).toContain('custom-class');
    });
  });
});

describe('Select', () => {
  const defaultOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  // ============================================================
  // 基础渲染测试
  // ============================================================

  describe('渲染', () => {
    it('应该正确渲染 select 元素', () => {
      render(<Select options={defaultOptions} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('应该渲染所有选项', () => {
      render(<Select options={defaultOptions} />);
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('应该渲染 label', () => {
      render(<Select options={defaultOptions} label="Choose an option" />);
      expect(screen.getByText('Choose an option')).toBeInTheDocument();
    });

    it('label 应该关联到 select', () => {
      render(<Select options={defaultOptions} label="Category" id="category-select" />);
      const select = screen.getByLabelText('Category');
      expect(select).toBeInTheDocument();
    });
  });

  // ============================================================
  // 错误状态测试
  // ============================================================

  describe('错误状态', () => {
    it('应该显示错误信息', () => {
      render(<Select options={defaultOptions} error="Please select an option" />);
      expect(screen.getByText('Please select an option')).toBeInTheDocument();
    });

    it('错误状态下应该有红色边框样式', () => {
      render(<Select options={defaultOptions} error="Error" data-testid="error-select" />);
      const select = screen.getByTestId('error-select');
      expect(select.className).toContain('border-red-500');
    });
  });

  // ============================================================
  // 事件测试
  // ============================================================

  describe('事件', () => {
    it('应该触发 onChange', () => {
      const handleChange = vi.fn();
      render(<Select options={defaultOptions} onChange={handleChange} />);
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'option2' } });
      expect(handleChange).toHaveBeenCalled();
    });
  });

  // ============================================================
  // 属性透传测试
  // ============================================================

  describe('属性透传', () => {
    it('应该透传 disabled 属性', () => {
      render(<Select options={defaultOptions} disabled />);
      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });

    it('应该透传 value 属性', () => {
      render(<Select options={defaultOptions} value="option2" onChange={() => {}} />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('option2');
    });
  });
});
