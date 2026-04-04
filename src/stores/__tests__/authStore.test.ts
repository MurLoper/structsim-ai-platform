import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api', () => ({
  authApi: {
    getAllUsers: vi.fn(),
    getLoginMode: vi.fn(),
    getLoginPublicKey: vi.fn(),
    login: vi.fn(),
    ssoCallbackLogin: vi.fn(),
    verifyToken: vi.fn(),
    getSession: vi.fn(),
    heartbeat: vi.fn(),
    refreshToken: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('@/features/auth/security/loginPasswordCipher', () => ({
  encryptPasswordForLogin: vi.fn(async (password: string) => ({
    keyId: 'test-key',
    passwordCiphertext: `encrypted:${password}`,
  })),
}));

import { authApi } from '@/api';
import type { Permission, User } from '@/types';
import { useAuthStore } from '../authStore';

const mockUsers: User[] = [
  {
    id: 'admin',
    domainAccount: 'admin',
    userName: 'admin',
    realName: '管理员',
    displayName: '管理员',
    email: 'admin@example.com',
    role: 'admin',
    roleCodes: ['ADMIN'],
    permissions: ['VIEW_DASHBOARD', 'MANAGE_CONFIG', 'MANAGE_USERS'] as Permission[],
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'engineer',
    domainAccount: 'engineer',
    userName: 'engineer',
    realName: '工程师',
    displayName: '工程师',
    email: 'engineer@example.com',
    role: 'engineer',
    roleCodes: ['ENGINEER'],
    permissions: ['VIEW_DASHBOARD', 'CREATE_ORDER'] as Permission[],
    status: 'active',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

let setItemSpy: ReturnType<typeof vi.spyOn>;
let removeItemSpy: ReturnType<typeof vi.spyOn>;

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setItemSpy = vi.spyOn(window.localStorage, 'setItem');
    removeItemSpy = vi.spyOn(window.localStorage, 'removeItem');
    useAuthStore.setState({
      user: null,
      token: null,
      menus: [],
      isLoading: false,
      users: [],
      isAuthenticated: false,
      sessionHydrated: false,
      lastHeartbeat: 0,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('初始状态正确', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.users).toEqual([]);
    expect(state.isAuthenticated).toBe(false);
  });

  it('setUser 可以设置和清空用户', () => {
    const { setUser } = useAuthStore.getState();

    act(() => setUser(mockUsers[0]));
    expect(useAuthStore.getState().user).toEqual(mockUsers[0]);

    act(() => setUser(null));
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('setToken 会同步 localStorage', () => {
    const { setToken } = useAuthStore.getState();

    act(() => setToken('token-123'));
    expect(useAuthStore.getState().token).toBe('token-123');
    expect(setItemSpy).toHaveBeenCalledWith('auth_token', 'token-123');

    act(() => setToken(null));
    expect(useAuthStore.getState().token).toBeNull();
    expect(removeItemSpy).toHaveBeenCalledWith('auth_token');
  });

  it('login 成功后只保存 token，进入业务页前再拉取 session', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      code: 0,
      msg: 'success',
      data: { token: 'test-token-123' },
    });
    vi.mocked(authApi.getSession).mockResolvedValue({
      code: 0,
      msg: 'success',
      data: {
        user: mockUsers[0],
        menus: [],
      },
    });

    const { login } = useAuthStore.getState();

    await act(async () => {
      await login('z00012345', 'password');
    });

    const state = useAuthStore.getState();
    expect(state.token).toBe('test-token-123');
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.sessionHydrated).toBe(false);
  });

  it('hydrateSession 会在首屏加载时获取最新用户信息与菜单', async () => {
    act(() => {
      useAuthStore.getState().setToken('test-token-123');
    });
    vi.mocked(authApi.getSession).mockResolvedValue({
      code: 0,
      msg: 'success',
      data: {
        user: mockUsers[0],
        menus: [],
      },
    });

    await act(async () => {
      await useAuthStore.getState().hydrateSession();
    });

    const state = useAuthStore.getState();
    expect(state.user?.domainAccount).toBe('admin');
    expect(state.isAuthenticated).toBe(true);
    expect(state.sessionHydrated).toBe(true);
  });

  it('login 在缺少 token 时抛错', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      code: 0,
      msg: 'success',
      data: { token: '' },
    });

    const { login } = useAuthStore.getState();

    await act(async () => {
      await expect(login('z00000000', 'password')).rejects.toThrow();
    });
  });

  it('logout 会清理登录状态', () => {
    useAuthStore.setState({
      user: mockUsers[0],
      token: 'test-token',
      isAuthenticated: true,
    });

    const { logout } = useAuthStore.getState();
    act(() => logout());

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(removeItemSpy).toHaveBeenCalledWith('auth_token');
  });

  it('fetchUsers 成功时更新用户列表', async () => {
    vi.mocked(authApi.getAllUsers).mockResolvedValue({
      code: 0,
      msg: 'success',
      data: mockUsers,
    });

    const { fetchUsers } = useAuthStore.getState();
    await act(async () => {
      await fetchUsers();
    });

    expect(useAuthStore.getState().users).toHaveLength(2);
  });

  it('hasPermission 对管理员直接放行', () => {
    useAuthStore.setState({ user: mockUsers[0] });
    const { hasPermission } = useAuthStore.getState();
    expect(hasPermission('VIEW_DASHBOARD' as Permission)).toBe(true);
    expect(hasPermission('MANAGE_CONFIG' as Permission)).toBe(true);
  });

  it('hasPermission 对普通用户按权限判断', () => {
    useAuthStore.setState({ user: mockUsers[1] });
    const { hasPermission } = useAuthStore.getState();
    expect(hasPermission('VIEW_DASHBOARD' as Permission)).toBe(true);
    expect(hasPermission('MANAGE_USERS' as Permission)).toBe(false);
  });
});
