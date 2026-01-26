/**
 * ThemeSwitcher / ThemeSelector 组件测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeSwitcher, ThemeSelector } from '../ThemeSwitcher';
import { useTheme } from '@/hooks/useTheme';

vi.mock('@/hooks/useTheme', () => ({
  useTheme: vi.fn(),
}));

describe('ThemeSwitcher', () => {
  const toggleTheme = vi.fn();
  const setTheme = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTheme).mockReturnValue({
      theme: 'light',
      toggleTheme,
      getThemeName: () => '亮色模式',
      setTheme,
      isLight: true,
      isDark: false,
      isEyecare: false,
    });
  });

  it('应该渲染按钮与标签', () => {
    render(<ThemeSwitcher showLabel />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('亮色')).toBeInTheDocument();
  });

  it('点击按钮应触发切换', () => {
    render(<ThemeSwitcher />);
    fireEvent.click(screen.getByRole('button'));
    expect(toggleTheme).toHaveBeenCalledTimes(1);
  });
});

describe('ThemeSelector', () => {
  const toggleTheme = vi.fn();
  const setTheme = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTheme).mockReturnValue({
      theme: 'dark',
      toggleTheme,
      getThemeName: () => '暗色模式',
      setTheme,
      isLight: false,
      isDark: true,
      isEyecare: false,
    });
  });

  it('应渲染三种主题选项', () => {
    render(<ThemeSelector />);
    expect(screen.getByText('亮色')).toBeInTheDocument();
    expect(screen.getByText('暗色')).toBeInTheDocument();
    expect(screen.getByText('护眼')).toBeInTheDocument();
  });

  it('点击选项应调用 setTheme', () => {
    render(<ThemeSelector />);
    fireEvent.click(screen.getByText('亮色'));
    expect(setTheme).toHaveBeenCalledWith('light');
  });
});
