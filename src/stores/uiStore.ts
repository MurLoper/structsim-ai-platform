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

      setTheme: theme => {
        const root = window.document.documentElement;
        root.classList.remove('dark', 'eyecare-green', 'eyecare-warm');

        if (theme === 'dark') {
          root.classList.add('dark');
        } else if (theme === 'eyecare-green') {
          root.classList.add('eyecare-green');
        } else if (theme === 'eyecare-warm') {
          root.classList.add('eyecare-warm');
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
