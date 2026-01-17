import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Permission } from '@/types';
import { authApi } from '@/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  users: User[];

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (userId: string) => Promise<void>;
  logout: () => void;
  fetchUsers: () => Promise<void>;
  hasPermission: (perm: Permission) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      users: [],

      setUser: user => set({ user }),

      setToken: token => {
        if (token) {
          localStorage.setItem('auth_token', token);
        } else {
          localStorage.removeItem('auth_token');
        }
        set({ token });
      },

      login: async (userId: string) => {
        set({ isLoading: true });
        try {
          const users = get().users;
          const user = users.find(u => u.id === userId);
          if (user) {
            // For demo, we just set the user directly
            // In production, call authApi.login()
            set({ user, isLoading: false });
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, token: null });
      },

      fetchUsers: async () => {
        try {
          const users = await authApi.getAllUsers();
          set({ users });
        } catch (error) {
          console.error('Failed to fetch users:', error);
        }
      },

      hasPermission: (perm: Permission) => {
        const user = get().user;
        return user ? user.permissions.includes(perm) : false;
      },
    }),
    {
      name: 'auth-storage',
      partialize: state => ({ user: state.user, token: state.token }),
    }
  )
);
