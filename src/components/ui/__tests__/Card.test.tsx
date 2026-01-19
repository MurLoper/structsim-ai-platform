/**
 * Card 组件测试
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader } from '../Card';

describe('Card', () => {
  // ============================================================
  // 基础渲染测试
  // ============================================================

  describe('渲染', () => {
    it('应该正确渲染子内容', () => {
      render(<Card>Card Content</Card>);
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('应该有基础卡片样式', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('bg-white');
      expect(card.className).toContain('rounded-xl');
      expect(card.className).toContain('shadow-sm');
    });
  });

  // ============================================================
  // Padding 测试
  // ============================================================

  describe('Padding', () => {
    it('默认应该是 md padding', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('p-6');
    });

    it('应该应用 none padding', () => {
      const { container } = render(<Card padding="none">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).not.toContain('p-4');
      expect(card.className).not.toContain('p-6');
      expect(card.className).not.toContain('p-8');
    });

    it('应该应用 sm padding', () => {
      const { container } = render(<Card padding="sm">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('p-4');
    });

    it('应该应用 lg padding', () => {
      const { container } = render(<Card padding="lg">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('p-8');
    });
  });

  // ============================================================
  // Hover 效果测试
  // ============================================================

  describe('Hover 效果', () => {
    it('默认不应该有 hover 效果', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).not.toContain('hover:shadow-md');
      expect(card.className).not.toContain('cursor-pointer');
    });

    it('hover 为 true 时应该有 hover 效果', () => {
      const { container } = render(<Card hover>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('hover:shadow-md');
      expect(card.className).toContain('cursor-pointer');
    });
  });

  // ============================================================
  // 自定义样式测试
  // ============================================================

  describe('自定义样式', () => {
    it('应该合并自定义 className', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('custom-class');
    });
  });

  // ============================================================
  // 子内容测试
  // ============================================================

  describe('子内容', () => {
    it('应该正确渲染复杂子内容', () => {
      render(
        <Card>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </Card>
      );
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });
  });
});

describe('CardHeader', () => {
  // ============================================================
  // 基础渲染测试
  // ============================================================

  describe('渲染', () => {
    it('应该正确渲染标题', () => {
      render(<CardHeader title="Card Title" />);
      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    it('应该渲染副标题', () => {
      render(<CardHeader title="Title" subtitle="Subtitle text" />);
      expect(screen.getByText('Subtitle text')).toBeInTheDocument();
    });

    it('没有副标题时不应该渲染副标题元素', () => {
      render(<CardHeader title="Title" />);
      expect(screen.queryByText('Subtitle text')).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // 图标测试
  // ============================================================

  describe('图标', () => {
    it('应该渲染图标', () => {
      render(<CardHeader title="Title" icon={<span data-testid="icon">★</span>} />);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('没有图标时不应该渲染图标容器', () => {
      const { container } = render(<CardHeader title="Title" />);
      const iconContainer = container.querySelector('.w-10.h-10');
      expect(iconContainer).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // Action 测试
  // ============================================================

  describe('Action', () => {
    it('应该渲染 action', () => {
      render(
        <CardHeader title="Title" action={<button data-testid="action-button">Action</button>} />
      );
      expect(screen.getByTestId('action-button')).toBeInTheDocument();
    });
  });

  // ============================================================
  // 完整组件测试
  // ============================================================

  describe('完整组件', () => {
    it('应该正确渲染所有元素', () => {
      render(
        <CardHeader
          title="Complete Title"
          subtitle="Complete Subtitle"
          icon={<span data-testid="complete-icon">★</span>}
          action={<button data-testid="complete-action">Edit</button>}
        />
      );
      expect(screen.getByText('Complete Title')).toBeInTheDocument();
      expect(screen.getByText('Complete Subtitle')).toBeInTheDocument();
      expect(screen.getByTestId('complete-icon')).toBeInTheDocument();
      expect(screen.getByTestId('complete-action')).toBeInTheDocument();
    });
  });
});
