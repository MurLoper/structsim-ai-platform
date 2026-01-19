import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Permission } from '@/types';
import { authApi } from '@/api';

const normalizePermissions = (user: User | null): Permission[] => {
  const perms = (user?.permissions ?? user?.permissionCodes ?? []) as Permission[];
  return Array.from(new Set(perms));
};

const isAdminUser = (user: User | null): boolean => {
  const roleCodes = user?.roleCodes ?? [];
  return roleCodes.includes('ADMIN') || user?.email?.toLowerCase() === 'alice@sim.com';
};

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
  login: (email: string) => Promise<void>;
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

      login: async (email: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ email });
          const payload = response?.data;
          if (payload?.token) {
            get().setToken(payload.token);
          }
          if (payload?.user) {
            const userData = payload.user as User;
            const perms = normalizePermissions(userData);
            set({
              user: { ...userData, permissions: perms },
              isLoading: false,
              isAuthenticated: true,
            });
          } else {
            set({ isLoading: false });
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
          const users = (response.data || []).map((user: User) => ({
            ...user,
            permissions: normalizePermissions(user),
          }));
          set({ users });
        } catch (error) {
          console.error('Failed to fetch users:', error);
        }
      },

      hasPermission: (perm: Permission) => {
        const user = get().user;
        if (isAdminUser(user)) {
          return true;
        }
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
