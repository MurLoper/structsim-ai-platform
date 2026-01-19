/**
 * Button 组件测试
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  // ============================================================
  // 基础渲染测试
  // ============================================================

  describe('渲染', () => {
    it('应该正确渲染子内容', () => {
      render(<Button>点击我</Button>);
      expect(screen.getByRole('button', { name: '点击我' })).toBeInTheDocument();
    });

    it('应该渲染为 button 元素', () => {
      render(<Button>测试</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  // ============================================================
  // 变体测试
  // ============================================================

  describe('变体 (variant)', () => {
    it('默认使用 primary 变体', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-brand-600');
    });

    it('应该应用 secondary 变体样式', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-slate-100');
    });

    it('应该应用 outline 变体样式', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('border-2');
    });

    it('应该应用 ghost 变体样式', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('hover:bg-slate-100');
    });

    it('应该应用 danger 变体样式', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-red-600');
    });
  });

  // ============================================================
  // 尺寸测试
  // ============================================================

  describe('尺寸 (size)', () => {
    it('默认使用 md 尺寸', () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('px-4');
      expect(button.className).toContain('py-2');
    });

    it('应该应用 sm 尺寸样式', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('px-3');
      expect(button.className).toContain('py-1.5');
    });

    it('应该应用 lg 尺寸样式', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('px-6');
      expect(button.className).toContain('py-3');
    });
  });

  // ============================================================
  // 状态测试
  // ============================================================

  describe('状态', () => {
    it('禁用状态下应该有 disabled 属性', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('加载状态下应该禁用按钮', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('加载状态下应该显示 spinner', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button.querySelector('.spinner')).toBeInTheDocument();
    });
  });

  // ============================================================
  // 图标测试
  // ============================================================

  describe('图标', () => {
    it('应该渲染图标', () => {
      const TestIcon = () => <span data-testid="test-icon">★</span>;
      render(<Button icon={<TestIcon />}>With Icon</Button>);
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('加载状态下不显示图标', () => {
      const TestIcon = () => <span data-testid="test-icon">★</span>;
      render(
        <Button icon={<TestIcon />} loading>
          Loading
        </Button>
      );
      expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // 事件测试
  // ============================================================

  describe('事件', () => {
    it('点击时应该触发 onClick', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('禁用状态下点击不应触发 onClick', () => {
      const handleClick = vi.fn();
      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      );
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('加载状态下点击不应触发 onClick', () => {
      const handleClick = vi.fn();
      render(
        <Button onClick={handleClick} loading>
          Loading
        </Button>
      );
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // 样式测试
  // ============================================================

  describe('自定义样式', () => {
    it('应该合并自定义 className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
    });
  });

  // ============================================================
  // 属性透传测试
  // ============================================================

  describe('属性透传', () => {
    it('应该透传 type 属性', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('应该透传 data-testid 属性', () => {
      render(<Button data-testid="test-button">Test</Button>);
      expect(screen.getByTestId('test-button')).toBeInTheDocument();
    });
  });
});
