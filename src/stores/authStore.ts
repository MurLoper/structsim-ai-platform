import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Permission, MenuItem } from '@/types';
import { authApi } from '@/api';

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_STORAGE_KEY = 'auth-storage';

const clearPersistedAuth = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

const getStoredAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

const normalizePermissions = (user: User | null): Permission[] => {
  const perms = (user?.permissions ?? user?.permissionCodes ?? []) as Permission[];
  return Array.from(new Set(perms));
};

const isAdminUser = (user: User | null): boolean => {
  const roleCodes = user?.roleCodes ?? [];
  return roleCodes.includes('ADMIN');
};

const normalizeUser = (user: User): User => {
  const permissions = normalizePermissions(user);
  const roleIds = user.roleIds ?? user.roleIdList ?? [];
  const domainAccount = user.domainAccount || user.id;
  const displayName = user.realName || user.userName || user.displayName || domainAccount;
  return {
    ...user,
    id: domainAccount,
    domainAccount,
    displayName,
    permissions,
    roleIds,
    roleIdList: roleIds,
    departmentId: user.departmentId ?? null,
    maxCpuCores: user.maxCpuCores ?? 192,
    maxBatchSize: user.maxBatchSize ?? 200,
    dailyRoundLimitDefault: user.dailyRoundLimitDefault ?? 500,
    dailyRoundLimit: user.dailyRoundLimit ?? user.dailyRoundLimitDefault ?? 500,
    nodeList: user.nodeList ?? [],
  };
};

interface LoginMode {
  ssoEnabled: boolean;
  ssoRedirectUrl: string;
  testAccountBypassEnabled: boolean;
  uidExpireSeconds: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  menus: MenuItem[];
  isLoading: boolean;
  users: User[];
  loginMode: LoginMode;
  isAuthenticated: boolean;
  lastHeartbeat: number;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setMenus: (menus: MenuItem[]) => void;
  clearAuthState: () => void;
  fetchLoginMode: () => Promise<LoginMode>;
  hydrateSession: () => Promise<boolean>;
  login: (domainAccount: string, password: string) => Promise<void>;
  loginBySsoUid: (uid: string) => Promise<void>;
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
      loginMode: {
        ssoEnabled: false,
        ssoRedirectUrl: '',
        testAccountBypassEnabled: false,
        uidExpireSeconds: 1800,
      },
      isAuthenticated: false,
      lastHeartbeat: 0,

      setUser: user =>
        set({
          user,
          isAuthenticated: !!user && !!getStoredAuthToken(),
        }),

      setToken: token => {
        if (token) {
          localStorage.setItem(AUTH_TOKEN_KEY, token);
        } else {
          localStorage.removeItem(AUTH_TOKEN_KEY);
        }
        set({ token });
      },

      setMenus: menus => set({ menus }),

      clearAuthState: () => {
        clearPersistedAuth();
        set({
          user: null,
          token: null,
          menus: [],
          isAuthenticated: false,
          lastHeartbeat: 0,
        });
      },

      fetchLoginMode: async () => {
        const response = await authApi.getLoginMode();
        const payload = response?.data;
        const mode: LoginMode = {
          ssoEnabled: !!payload?.ssoEnabled,
          ssoRedirectUrl: payload?.ssoRedirectUrl || '',
          testAccountBypassEnabled: !!payload?.testAccountBypassEnabled,
          uidExpireSeconds: payload?.uidExpireSeconds || 1800,
        };
        set({ loginMode: mode });
        return mode;
      },

      hydrateSession: async () => {
        const token = get().token || getStoredAuthToken();
        if (!token) {
          get().clearAuthState();
          return false;
        }

        try {
          const response = await authApi.verifyToken();
          const payload = response?.data;
          if (!payload?.user) {
            get().clearAuthState();
            return false;
          }

          const userData = normalizeUser(payload.user as User);
          set({
            user: userData,
            menus: payload.menus || [],
            isAuthenticated: true,
          });
          return true;
        } catch {
          get().clearAuthState();
          return false;
        }
      },

      login: async (domainAccount: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ domainAccount, password });
          const payload = response?.data;
          if (payload?.token) {
            get().setToken(payload.token);
          }
          const hydrated = await get().hydrateSession();
          if (!hydrated) {
            throw new Error('登录成功，但获取用户信息失败，请重试');
          }
          set({ isLoading: false });
        } catch (error: unknown) {
          set({ isLoading: false });
          const err = error as { response?: { data?: { message?: string } }; message?: string };
          const message = err.response?.data?.message || err.message || '登录失败';
          throw new Error(message);
        }
      },

      loginBySsoUid: async (uid: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.ssoCallbackLogin({ uid });
          const payload = response?.data;
          if (payload?.token) {
            get().setToken(payload.token);
          }
          const hydrated = await get().hydrateSession();
          if (!hydrated) {
            throw new Error('SSO 登录成功，但获取用户信息失败，请重试');
          }
          set({ isLoading: false });
        } catch (error: unknown) {
          set({ isLoading: false });
          const err = error as { response?: { data?: { message?: string } }; message?: string };
          const message = err.response?.data?.message || err.message || 'SSO登录失败';
          throw new Error(message);
        }
      },

      logout: () => {
        get().clearAuthState();
      },

      verifyToken: async () => {
        const token = get().token || getStoredAuthToken();
        if (!token) {
          get().clearAuthState();
          return false;
        }
        set({ isLoading: true });
        try {
          const hydrated = await get().hydrateSession();
          set({ isLoading: false });
          return hydrated;
        } catch {
          get().logout();
          set({ isLoading: false });
          return false;
        }
      },

      checkHeartbeat: async () => {
        const token = get().token || getStoredAuthToken();
        if (!token || !get().isAuthenticated) {
          return false;
        }
        try {
          const response = await authApi.heartbeat();
          const payload = response?.data;
          if (payload?.valid) {
            set({ lastHeartbeat: Date.now() });
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
          const users = (response.data || []).map((user: User) => normalizeUser(user));
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
        if (state) {
          const token = getStoredAuthToken();
          if (!token) {
            state.user = null;
            state.token = null;
            state.menus = [];
            state.isAuthenticated = false;
            return;
          }
          state.token = token;
          state.isAuthenticated = !!state.user;
        }
      },
    }
  )
);
