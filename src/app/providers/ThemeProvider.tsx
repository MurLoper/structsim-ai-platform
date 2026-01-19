import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * 主题 Provider
 * 负责应用主题到 DOM 根元素
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme } = useUIStore();

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
    // light 主题为默认状态，无需添加类
  }, [theme]);

  return <>{children}</>;
}
