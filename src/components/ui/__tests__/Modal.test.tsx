/**
 * Modal 组件测试
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    children: <div>Modal Content</div>,
  };

  // ============================================================
  // 渲染测试
  // ============================================================

  describe('渲染', () => {
    it('isOpen 为 true 时应该渲染内容', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('isOpen 为 false 时不应该渲染', () => {
      render(<Modal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
    });

    it('应该渲染标题', () => {
      render(<Modal {...defaultProps} title="Test Title" />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('没有标题时不应该渲染标题元素', () => {
      render(<Modal {...defaultProps} showCloseButton={false} />);
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // 关闭按钮测试
  // ============================================================

  describe('关闭按钮', () => {
    it('默认应该显示关闭按钮', () => {
      render(<Modal {...defaultProps} title="Test" />);
      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
    });

    it('showCloseButton 为 false 时不应该显示关闭按钮', () => {
      render(<Modal {...defaultProps} title="Test" showCloseButton={false} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('点击关闭按钮应该调用 onClose', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} title="Test" onClose={onClose} />);
      fireEvent.click(screen.getByRole('button'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // 背景遮罩测试
  // ============================================================

  describe('背景遮罩', () => {
    it('点击背景遮罩应该调用 onClose', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);
      // 背景遮罩有 bg-black/50 类
      const backdrop = document.querySelector('.bg-black\\/50');
      expect(backdrop).toBeInTheDocument();
      fireEvent.click(backdrop!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // 尺寸测试
  // ============================================================

  describe('尺寸', () => {
    it('默认应该是 md 尺寸', () => {
      render(<Modal {...defaultProps} />);
      const modalContent = document.querySelector('.max-w-md');
      expect(modalContent).toBeInTheDocument();
    });

    it('应该应用 sm 尺寸', () => {
      render(<Modal {...defaultProps} size="sm" />);
      const modalContent = document.querySelector('.max-w-sm');
      expect(modalContent).toBeInTheDocument();
    });

    it('应该应用 lg 尺寸', () => {
      render(<Modal {...defaultProps} size="lg" />);
      const modalContent = document.querySelector('.max-w-lg');
      expect(modalContent).toBeInTheDocument();
    });

    it('应该应用 xl 尺寸', () => {
      render(<Modal {...defaultProps} size="xl" />);
      const modalContent = document.querySelector('.max-w-xl');
      expect(modalContent).toBeInTheDocument();
    });
  });

  // ============================================================
  // 子内容测试
  // ============================================================

  describe('子内容', () => {
    it('应该正确渲染复杂子内容', () => {
      render(
        <Modal {...defaultProps}>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </Modal>
      );
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });
  });
});
