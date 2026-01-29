import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Permission, MenuItem } from '@/types';
import { authApi } from '@/api';

const normalizePermissions = (user: User | null): Permission[] => {
  const perms = (user?.permissions ?? user?.permissionCodes ?? []) as Permission[];
  return Array.from(new Set(perms));
};

const isAdminUser = (user: User | null): boolean => {
  const roleCodes = user?.roleCodes ?? [];
  return roleCodes.includes('ADMIN');
};

interface AuthState {
  user: User | null;
  token: string | null;
  menus: MenuItem[];
  isLoading: boolean;
  users: User[];
  /** 是否已认证（派生状态：user 不为 null 时为 true） */
  isAuthenticated: boolean;
  /** 上次心跳检查时间 */
  lastHeartbeat: number;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setMenus: (menus: MenuItem[]) => void;
  login: (email: string, password?: string) => Promise<void>;
  verifyToken: () => Promise<boolean>;
  checkHeartbeat: () => Promise<boolean>;
  refreshToken: () => Promise<boolean>;
  logout: () => void;
  fetchUsers: () => Promise<void>;
  hasPermission: (perm: Permission) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      menus: [],
      isLoading: false,
      users: [],
      isAuthenticated: false,
      lastHeartbeat: 0,

      setUser: user => set({ user, isAuthenticated: !!user }),

      setToken: token => {
        if (token) {
          localStorage.setItem('auth_token', token);
        } else {
          localStorage.removeItem('auth_token');
        }
        set({ token });
      },

      setMenus: menus => set({ menus }),

      login: async (email: string, password?: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ email, password });
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
        } catch (error: unknown) {
          set({ isLoading: false });
          // 提取错误信息
          const err = error as { response?: { data?: { message?: string } }; message?: string };
          const message = err.response?.data?.message || err.message || '登录失败';
          throw new Error(message);
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, token: null, menus: [], isAuthenticated: false });
      },

      verifyToken: async () => {
        const token = get().token || localStorage.getItem('auth_token');
        if (!token) {
          return false;
        }
        set({ isLoading: true });
        try {
          const response = await authApi.verifyToken();
          const payload = response?.data;
          if (payload?.user) {
            const userData = payload.user as User;
            const perms = normalizePermissions(userData);
            set({
              user: { ...userData, permissions: perms },
              menus: payload.menus || [],
              isLoading: false,
              isAuthenticated: true,
            });
            return true;
          }
          set({ isLoading: false });
          return false;
        } catch {
          get().logout();
          set({ isLoading: false });
          return false;
        }
      },

      checkHeartbeat: async () => {
        const token = get().token || localStorage.getItem('auth_token');
        if (!token || !get().isAuthenticated) {
          return false;
        }
        try {
          const response = await authApi.heartbeat();
          const payload = response?.data;
          if (payload?.valid) {
            set({ lastHeartbeat: Date.now() });
            // 如果需要刷新token，自动刷新
            if (payload.shouldRefresh) {
              await get().refreshToken();
            }
            return true;
          }
          get().logout();
          return false;
        } catch {
          get().logout();
          return false;
        }
      },

      refreshToken: async () => {
        try {
          const response = await authApi.refreshToken();
          const newToken = response?.data?.token;
          if (newToken) {
            get().setToken(newToken);
            return true;
          }
          return false;
        } catch {
          return false;
        }
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
      partialize: state => ({ user: state.user, token: state.token, menus: state.menus }),
      onRehydrateStorage: () => state => {
        // 恢复时根据 user 设置 isAuthenticated
        if (state) {
          state.isAuthenticated = !!state.user;
        }
      },
    }
  )
);
