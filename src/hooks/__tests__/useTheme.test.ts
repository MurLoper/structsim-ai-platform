/**
 * useTheme Hook 测试
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme, initializeTheme } from '../useTheme';
import { useUIStore } from '@/stores/uiStore';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useTheme', () => {
  beforeEach(() => {
    // 重置 store 状态
    useUIStore.setState({ theme: 'light' });
    // 清理 localStorage mock
    localStorageMock.clear();
    vi.clearAllMocks();
    // 清理 DOM
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================
  // 基础功能测试
  // ============================================================

  describe('基础功能', () => {
    it('应该返回当前主题', () => {
      const { result } = renderHook(() => useTheme());
      expect(result.current.theme).toBe('light');
    });

    it('应该返回主题状态标志', () => {
      const { result } = renderHook(() => useTheme());
      expect(result.current.isLight).toBe(true);
      expect(result.current.isDark).toBe(false);
      expect(result.current.isEyecare).toBe(false);
    });
  });

  // ============================================================
  // 主题切换测试
  // ============================================================

  describe('setTheme', () => {
    it('应该能设置为暗色主题', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.isDark).toBe(true);
    });

    it('应该能设置为护眼主题', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('eyecare');
      });

      expect(result.current.theme).toBe('eyecare');
      expect(result.current.isEyecare).toBe(true);
    });

    it('切换主题后应该更新 DOM', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('切换到护眼主题应该设置 data-theme 属性', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('eyecare');
      });

      expect(document.documentElement.getAttribute('data-theme')).toBe('eyecare');
    });
  });

  // ============================================================
  // 循环切换测试
  // ============================================================

  describe('toggleTheme', () => {
    it('应该循环切换主题: light -> dark', () => {
      useUIStore.setState({ theme: 'light' });
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('dark');
    });

    it('应该循环切换主题: dark -> eyecare', () => {
      useUIStore.setState({ theme: 'dark' });
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('eyecare');
    });

    it('应该循环切换主题: eyecare -> light', () => {
      useUIStore.setState({ theme: 'eyecare' });
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('light');
    });
  });

  // ============================================================
  // 主题名称测试
  // ============================================================

  describe('getThemeName', () => {
    it('应该返回正确的主题名称', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.getThemeName('light')).toBe('亮色模式');
      expect(result.current.getThemeName('dark')).toBe('暗色模式');
      expect(result.current.getThemeName('eyecare')).toBe('护眼模式');
    });

    it('不传参数时应该返回当前主题名称', () => {
      useUIStore.setState({ theme: 'dark' });
      const { result } = renderHook(() => useTheme());

      expect(result.current.getThemeName()).toBe('暗色模式');
    });
  });

  // ============================================================
  // 持久化测试
  // ============================================================

  describe('持久化', () => {
    it('切换主题后应该保存到 localStorage', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('structsim-theme', 'dark');
    });
  });
});

// ============================================================
// initializeTheme 测试
// ============================================================

describe('initializeTheme', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('应该从 localStorage 读取保存的主题', () => {
    localStorageMock.getItem.mockReturnValue('dark');
    const theme = initializeTheme();
    expect(theme).toBe('dark');
  });

  it('localStorage 无值时应该检测系统偏好', () => {
    localStorageMock.getItem.mockReturnValue(null);

    // Mock 系统偏好为暗色
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const theme = initializeTheme();
    expect(theme).toBe('dark');
  });

  it('无系统偏好时应该默认返回 light', () => {
    localStorageMock.getItem.mockReturnValue(null);

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const theme = initializeTheme();
    expect(theme).toBe('light');
  });

  it('应该忽略无效的 localStorage 值', () => {
    localStorageMock.getItem.mockReturnValue('invalid-theme');
    const theme = initializeTheme();
    expect(theme).toBe('light');
  });
});
