import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Permission } from '@/types';
import { authApi } from '@/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  users: User[];
  /** 是否已认证（派生状态：user 不为 null 时为 true） */
  isAuthenticated: boolean;

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
      isAuthenticated: false,

      setUser: user => set({ user, isAuthenticated: !!user }),

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
            set({
              user: { ...user, permissions: user.permissions ?? [] },
              isLoading: false,
              isAuthenticated: true,
            });
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      fetchUsers: async () => {
        try {
          const response = await authApi.getAllUsers();
          const users = (response.data || []).map(user => ({
            ...user,
            permissions: user.permissions ?? [],
          }));
          set({ users });
        } catch (error) {
          console.error('Failed to fetch users:', error);
        }
      },

      hasPermission: (perm: Permission) => {
        const user = get().user;
        const permissions = user?.permissions ?? [];
        return permissions.includes(perm);
      },
    }),
    {
      name: 'auth-storage',
      partialize: state => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => state => {
        // 恢复时根据 user 设置 isAuthenticated
        if (state) {
          state.isAuthenticated = !!state.user;
        }
      },
    }
  )
);
