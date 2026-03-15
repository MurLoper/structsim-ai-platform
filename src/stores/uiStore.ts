import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'eyecare-green' | 'eyecare-warm';
export type Language = 'en' | 'zh';

interface UIState {
  theme: Theme;
  language: Language;
  sidebarCollapsed: boolean;

  // Actions
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    set => ({
      theme: 'light',
      language: 'zh',
      sidebarCollapsed: false,

      // 只更新状态，DOM 同步由 ThemeProvider 统一处理
      setTheme: theme => set({ theme }),

      setLanguage: language => set({ language }),

      toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: 'ui-storage',
    }
  )
);
