import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MenuItem, Permission, User } from '@/types';
import { authApi } from '@/api';
import { RESOURCES, formatMessage } from '@/locales';
import {
  clearCachedLoginPublicKey,
  encryptPasswordForLogin,
} from '@/features/auth/security/loginPasswordCipher';
import { useUIStore } from './uiStore';

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_STORAGE_KEY = 'auth-storage';

const clearPersistedAuth = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

const getStoredAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

let pendingSessionHydration: Promise<boolean> | null = null;

const getAuthMessage = (key: string) => {
  const language = useUIStore.getState().language;
  return formatMessage(RESOURCES[language][key] || key);
};

const shouldRetryLoginWithFreshPublicKey = (message: string, code?: number | string | null) => {
  const normalizedMessage = String(message || '').toLowerCase();
  const normalizedCode = code == null ? '' : String(code).trim();

  return (
    normalizedCode === '400004' ||
    normalizedMessage.includes('登录密钥') ||
    normalizedMessage.includes('密钥版本') ||
    normalizedMessage.includes('登录密文') ||
    normalizedMessage.includes('解密失败') ||
    normalizedMessage.includes('密钥不匹配') ||
    normalizedMessage.includes('密钥') ||
    normalizedMessage.includes('解密')
  );
};

const normalizePermissions = (user: User | null): Permission[] => {
  const permissions = (user?.permissions ?? user?.permissionCodes ?? []) as Permission[];
  return Array.from(new Set(permissions));
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
    todayUsedRounds: user.todayUsedRounds ?? 0,
    todayRemainingRounds: user.todayRemainingRounds ?? 0,
    nodeList: user.nodeList ?? [],
    recentProjectIds: user.recentProjectIds ?? [],
    recentSimTypeIds: user.recentSimTypeIds ?? [],
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
  sessionHydrated: boolean;
  lastHeartbeat: number;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setMenus: (menus: MenuItem[]) => void;
  clearAuthState: () => void;
  fetchLoginMode: () => Promise<LoginMode>;
  hydrateSession: () => Promise<boolean>;
  login: (domainAccount: string, password: string) => Promise<void>;
  loginBySsoUid: (uid: string) => Promise<void>;
  loginByOptAccessToken: (optAccessToken: string) => Promise<void>;
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
      sessionHydrated: false,
      lastHeartbeat: 0,

      setUser: user =>
        set({
          user,
          isAuthenticated: !!user && !!getStoredAuthToken(),
        }),

      setToken: token => {
        const preserveHydratedSession = !!token && !!get().user && get().sessionHydrated;
        if (token) {
          localStorage.setItem(AUTH_TOKEN_KEY, token);
        } else {
          localStorage.removeItem(AUTH_TOKEN_KEY);
        }
        set({
          token,
          user: token ? get().user : null,
          menus: token ? get().menus : [],
          isAuthenticated: preserveHydratedSession,
          sessionHydrated: preserveHydratedSession,
        });
      },

      setMenus: menus => set({ menus }),

      clearAuthState: () => {
        clearPersistedAuth();
        set({
          user: null,
          token: null,
          menus: [],
          isAuthenticated: false,
          sessionHydrated: false,
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
        if (pendingSessionHydration) {
          return pendingSessionHydration;
        }

        const token = get().token || getStoredAuthToken();
        if (!token) {
          get().clearAuthState();
          return false;
        }

        pendingSessionHydration = (async () => {
          try {
            const response = await authApi.getSession();
            const payload = response?.data;
            if (!payload?.user) {
              get().clearAuthState();
              return false;
            }

            const userData = normalizeUser(payload.user as User);
            set({
              token,
              user: userData,
              menus: payload.menus || [],
              isAuthenticated: true,
              sessionHydrated: true,
            });
            return true;
          } catch {
            get().clearAuthState();
            return false;
          } finally {
            pendingSessionHydration = null;
          }
        })();

        return pendingSessionHydration;
      },

      login: async (domainAccount: string, password: string) => {
        set({ isLoading: true });
        try {
          const submitLogin = async (forceRefresh = false) => {
            const encrypted = await encryptPasswordForLogin(password, forceRefresh);
            return authApi.login({
              domainAccount,
              passwordCiphertext: encrypted.passwordCiphertext,
              keyId: encrypted.keyId,
            });
          };

          let response;
          try {
            response = await submitLogin(false);
          } catch (error: unknown) {
            const err = error as {
              response?: { data?: { message?: string; code?: number | string } };
              message?: string;
            };
            const firstMessage = err.response?.data?.message || err.message || '';
            const firstCode = err.response?.data?.code;
            if (!shouldRetryLoginWithFreshPublicKey(firstMessage, firstCode)) {
              throw error;
            }
            clearCachedLoginPublicKey();
            response = await submitLogin(true);
          }

          const payload = response?.data;
          if (!payload?.token) {
            throw new Error(getAuthMessage('auth.login.failed'));
          }

          get().setToken(payload.token);
          set({ user: null, menus: [], isAuthenticated: false, sessionHydrated: false });
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } }; message?: string };
          const message =
            err.response?.data?.message || err.message || getAuthMessage('auth.login.failed');
          throw new Error(message);
        } finally {
          set({ isLoading: false });
        }
      },

      loginBySsoUid: async (uid: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.ssoCallbackLogin({ uid });
          const payload = response?.data;
          if (!payload?.token) {
            throw new Error(getAuthMessage('auth.sso.failed'));
          }

          get().setToken(payload.token);
          set({ user: null, menus: [], isAuthenticated: false, sessionHydrated: false });
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } }; message?: string };
          const message =
            err.response?.data?.message || err.message || getAuthMessage('auth.sso.failed');
          throw new Error(message);
        } finally {
          set({ isLoading: false });
        }
      },

      loginByOptAccessToken: async (optAccessToken: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.optAccessTokenLogin({ optAccessToken });
          const payload = response?.data;
          if (!payload?.token) {
            throw new Error(getAuthMessage('auth.embed.failed'));
          }

          get().setToken(payload.token);
          set({ user: null, menus: [], isAuthenticated: false, sessionHydrated: false });
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } }; message?: string };
          const message =
            err.response?.data?.message || err.message || getAuthMessage('auth.embed.failed');
          throw new Error(message);
        } finally {
          set({ isLoading: false });
        }
      },

      verifyToken: async () => {
        const token = get().token || getStoredAuthToken();
        if (!token) {
          get().clearAuthState();
          return false;
        }

        set({ isLoading: true });
        try {
          return await get().hydrateSession();
        } finally {
          set({ isLoading: false });
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

      logout: () => {
        get().clearAuthState();
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
        return (user?.permissions ?? []).includes(perm);
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: state => ({ user: state.user, token: state.token, menus: state.menus }),
      onRehydrateStorage: () => state => {
        if (!state) {
          return;
        }

        const token = getStoredAuthToken();
        if (!token) {
          state.user = null;
          state.token = null;
          state.menus = [];
          state.isAuthenticated = false;
          state.sessionHydrated = false;
          return;
        }

        state.token = token;
        state.isAuthenticated = false;
        state.sessionHydrated = false;
      },
    }
  )
);
