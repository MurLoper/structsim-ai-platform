import { useUIStore } from '@/stores/uiStore';
import { useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'eyecare-green' | 'eyecare-warm';

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

  // 设置主题
  const setTheme = useCallback(
    (newTheme: Theme) => {
      setStoreTheme(newTheme);
    },
    [setStoreTheme]
  );

  // 循环切换主题
  const toggleTheme = useCallback(() => {
    const themes: Theme[] = ['light', 'dark', 'eyecare-green', 'eyecare-warm'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }, [theme, setTheme]);

  // 获取主题显示名称
  const getThemeName = useCallback(
    (t: Theme = theme): string => {
      const names: Record<Theme, string> = {
        light: '白天模式',
        dark: '黑夜模式',
        'eyecare-green': '护眼模式 - 绿豆沙',
        'eyecare-warm': '护眼模式 - 米黄纸',
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
    isEyecare: theme === 'eyecare-green' || theme === 'eyecare-warm',
  };
}

/**
 * 初始化主题
 * 从 localStorage 读取保存的主题，如果没有则使用系统偏好
 */
export function initializeTheme(): Theme {
  // 尝试从 localStorage 读取
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  if (savedTheme && ['light', 'dark', 'eyecare-green', 'eyecare-warm'].includes(savedTheme)) {
    return savedTheme;
  }

  // 检测系统偏好
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}
