import { create } from 'zustand';
import { MenuItem } from '@/types';
import { authApi } from '@/api';

interface MenuState {
  menus: MenuItem[];
  isLoading: boolean;
  isLoaded: boolean;

  // Actions
  fetchMenus: () => Promise<void>;
  clearMenus: () => void;
}

export const useMenuStore = create<MenuState>()((set, get) => ({
  menus: [],
  isLoading: false,
  isLoaded: false,

  fetchMenus: async () => {
    if (get().isLoaded) return;

    set({ isLoading: true });
    try {
      const response = await authApi.getUserMenus();
      set({ menus: response.data || [], isLoading: false, isLoaded: true });
    } catch (error) {
      console.error('Failed to fetch menus:', error);
      set({ isLoading: false });
    }
  },

  clearMenus: () => {
    set({ menus: [], isLoaded: false });
  },
}));
