import { useUIStore } from '@/stores/uiStore';
import { useCallback, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'eyecare';

const THEME_STORAGE_KEY = 'structsim-theme';

/**
 * 主题管理 Hook
 *
 * 功能:
 * - 获取当前主题
 * - 设置主题
 * - 切换主题（循环切换）
 * - 自动同步到 DOM 和 localStorage
 *
 * @example
 * ```tsx
 * const { theme, setTheme, toggleTheme } = useTheme();
 *
 * // 设置特定主题
 * setTheme('dark');
 *
 * // 循环切换
 * toggleTheme(); // light -> dark -> eyecare -> light
 * ```
 */
export function useTheme() {
  const { theme, setTheme: setStoreTheme } = useUIStore();

  // 应用主题到 DOM
  useEffect(() => {
    const root = document.documentElement;

    // 清除所有主题类
    root.classList.remove('dark');
    root.removeAttribute('data-theme');

    // 应用当前主题
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'eyecare') {
      root.setAttribute('data-theme', 'eyecare');
    }

    // 持久化到 localStorage
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // 设置主题
  const setTheme = useCallback(
    (newTheme: Theme) => {
      setStoreTheme(newTheme);
    },
    [setStoreTheme]
  );

  // 循环切换主题
  const toggleTheme = useCallback(() => {
    const themes: Theme[] = ['light', 'dark', 'eyecare'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }, [theme, setTheme]);

  // 获取主题显示名称
  const getThemeName = useCallback(
    (t: Theme = theme): string => {
      const names: Record<Theme, string> = {
        light: '亮色模式',
        dark: '暗色模式',
        eyecare: '护眼模式',
      };
      return names[t];
    },
    [theme]
  );

  return {
    theme,
    setTheme,
    toggleTheme,
    getThemeName,
    isLight: theme === 'light',
    isDark: theme === 'dark',
    isEyecare: theme === 'eyecare',
  };
}

/**
 * 初始化主题
 * 从 localStorage 读取保存的主题，如果没有则使用系统偏好
 */
export function initializeTheme(): Theme {
  // 尝试从 localStorage 读取
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  if (savedTheme && ['light', 'dark', 'eyecare'].includes(savedTheme)) {
    return savedTheme;
  }

  // 检测系统偏好
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}
