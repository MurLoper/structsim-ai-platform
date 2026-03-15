import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';

/** 所有需要在 <html> 上切换的主题 CSS 类 */
const THEME_CLASSES = ['dark', 'eyecare-green', 'eyecare-warm'] as const;

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * 主题 Provider — 唯一负责将主题同步到 DOM 的地方
 *
 * 工作方式:
 *  1. 监听 zustand store 中的 theme 状态
 *  2. 在 <html> 元素上切换对应的 CSS 类
 *     - light  → 无额外类 (CSS :root 默认)
 *     - dark   → .dark
 *     - eyecare-green → .eyecare-green
 *     - eyecare-warm  → .eyecare-warm
 *  3. themes.css 中用 .dark / .eyecare-green / .eyecare-warm 选择器
 *     定义对应的 CSS 变量，Tailwind 的 dark: / eyecare: 变体也依赖这些类
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme } = useUIStore();

  useEffect(() => {
    const root = document.documentElement;

    // 1. 清除所有主题类
    root.classList.remove(...THEME_CLASSES);

    // 2. 应用当前主题 — light 为默认 (:root)，无需添加类
    if (theme !== 'light') {
      root.classList.add(theme);
    }
  }, [theme]);

  return <>{children}</>;
}
