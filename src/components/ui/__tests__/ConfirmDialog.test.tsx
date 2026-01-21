/**
 * ConfirmDialog 组件测试
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog, useConfirmDialog } from '../ConfirmDialog';

function renderHookComponent() {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const Wrapper = () => {
    const { showConfirm, ConfirmDialogComponent } = useConfirmDialog();
    return (
      <div>
        <button
          type="button"
          onClick={() => showConfirm('标题', '内容', onConfirm, 'warning')}
        >
          打开
        </button>
        <ConfirmDialogComponent />
      </div>
    );
  };

  render(<Wrapper />);
  return { onConfirm, onCancel };
}

describe('ConfirmDialog', () => {
  it('关闭状态下不渲染内容', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        title="提示"
        message="内容"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.queryByText('提示')).not.toBeInTheDocument();
  });

  it('打开时渲染标题、内容与按钮', () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    render(
      <ConfirmDialog
        isOpen
        title="删除确认"
        message="是否删除"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="确认"
        cancelText="取消"
        type="warning"
      />
    );

    expect(screen.getByText('删除确认')).toBeInTheDocument();
    expect(screen.getByText('是否删除')).toBeInTheDocument();
    fireEvent.click(screen.getByText('确认'));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('取消'));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('useConfirmDialog 应支持 showConfirm 与 confirm', () => {
    const { onConfirm } = renderHookComponent();

    fireEvent.click(screen.getByText('打开'));
    expect(screen.getByText('标题')).toBeInTheDocument();

    fireEvent.click(screen.getByText('确定'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
