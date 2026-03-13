import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'eyecare';
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

      setTheme: theme => {
        const root = window.document.documentElement;
        root.classList.remove('dark', 'eyecare');

        if (theme === 'dark') {
          root.classList.add('dark');
        } else if (theme === 'eyecare') {
          root.classList.add('eyecare');
        }

        set({ theme });
      },

      setLanguage: language => set({ language }),

      toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: 'ui-storage',
    }
  )
);
