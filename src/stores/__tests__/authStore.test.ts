/**
 * Auth Store 测试
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';

// Mock authApi before importing the store
vi.mock('@/api', () => ({
  authApi: {
    getAllUsers: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

// Import after mocking
import { useAuthStore } from '../authStore';
import { authApi } from '@/api';
import type { User, Permission } from '@/types';

// Mock user data
const mockUsers: User[] = [
  {
    id: 'user-1',
    username: 'admin',
    name: '管理员',
    email: 'admin@example.com',
    role: 'admin',
    permissions: ['view_dashboard', 'manage_config', 'manage_users'] as Permission[],
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    username: 'engineer',
    name: '工程师',
    email: 'engineer@example.com',
    role: 'engineer',
    permissions: ['view_dashboard', 'submit_order'] as Permission[],
    status: 'active',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

// Spy variables - will be set in beforeEach
let setItemSpy: ReturnType<typeof vi.spyOn>;
let removeItemSpy: ReturnType<typeof vi.spyOn>;

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Set up spies before each test (after clearAllMocks)
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
    // Reset store state
    useAuthStore.setState({
      user: null,
      token: null,
      isLoading: false,
      users: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.users).toEqual([]);
    });
  });

  describe('setUser', () => {
    it('应该能设置用户', () => {
      const { setUser } = useAuthStore.getState();

      act(() => {
        setUser(mockUsers[0]);
      });

      expect(useAuthStore.getState().user).toEqual(mockUsers[0]);
    });

    it('应该能清除用户', () => {
      // First set a user
      useAuthStore.setState({ user: mockUsers[0] });

      const { setUser } = useAuthStore.getState();

      act(() => {
        setUser(null);
      });

      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('setToken', () => {
    it('应该能设置 token 并保存到 localStorage', () => {
      const { setToken } = useAuthStore.getState();
      const token = 'test-token-123';

      act(() => {
        setToken(token);
      });

      expect(useAuthStore.getState().token).toBe(token);
      expect(setItemSpy).toHaveBeenCalledWith('auth_token', token);
    });

    it('应该能清除 token 并从 localStorage 移除', () => {
      // First set a token
      useAuthStore.setState({ token: 'old-token' });

      const { setToken } = useAuthStore.getState();

      act(() => {
        setToken(null);
      });

      expect(useAuthStore.getState().token).toBeNull();
      expect(removeItemSpy).toHaveBeenCalledWith('auth_token');
    });
  });

  describe('login', () => {
    it('应该能登录用户', async () => {
      // Set up users first
      useAuthStore.setState({ users: mockUsers });

      const { login } = useAuthStore.getState();

      await act(async () => {
        await login('user-1');
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUsers[0]);
      expect(state.isLoading).toBe(false);
    });

    it('用户不存在时不应该设置用户', async () => {
      useAuthStore.setState({ users: mockUsers });

      const { login } = useAuthStore.getState();

      await act(async () => {
        await login('non-existent');
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
    });
  });

  describe('logout', () => {
    it('应该能登出用户并清除状态', () => {
      // Set up initial state
      useAuthStore.setState({
        user: mockUsers[0],
        token: 'test-token',
      });

      const { logout } = useAuthStore.getState();

      act(() => {
        logout();
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(removeItemSpy).toHaveBeenCalledWith('auth_token');
    });
  });

  describe('fetchUsers', () => {
    it('应该能获取用户列表', async () => {
      vi.mocked(authApi.getAllUsers).mockResolvedValue({
        data: mockUsers,
      });

      const { fetchUsers } = useAuthStore.getState();

      await act(async () => {
        await fetchUsers();
      });

      expect(authApi.getAllUsers).toHaveBeenCalled();
      expect(useAuthStore.getState().users).toEqual(mockUsers);
    });

    it('API 返回空数据时应该设置空数组', async () => {
      vi.mocked(authApi.getAllUsers).mockResolvedValue({
        data: null,
      });

      const { fetchUsers } = useAuthStore.getState();

      await act(async () => {
        await fetchUsers();
      });

      expect(useAuthStore.getState().users).toEqual([]);
    });

    it('API 错误时应该保持原状态', async () => {
      vi.mocked(authApi.getAllUsers).mockRejectedValue(new Error('Network Error'));

      // Set initial users
      useAuthStore.setState({ users: mockUsers });

      const { fetchUsers } = useAuthStore.getState();

      await act(async () => {
        await fetchUsers();
      });

      // Users should remain unchanged on error
      expect(useAuthStore.getState().users).toEqual(mockUsers);
    });
  });

  describe('hasPermission', () => {
    it('用户有权限时应该返回 true', () => {
      useAuthStore.setState({ user: mockUsers[0] });

      const { hasPermission } = useAuthStore.getState();

      expect(hasPermission('view_dashboard' as Permission)).toBe(true);
      expect(hasPermission('manage_config' as Permission)).toBe(true);
    });

    it('用户没有权限时应该返回 false', () => {
      useAuthStore.setState({ user: mockUsers[1] }); // engineer

      const { hasPermission } = useAuthStore.getState();

      expect(hasPermission('manage_users' as Permission)).toBe(false);
    });

    it('用户未登录时应该返回 false', () => {
      const { hasPermission } = useAuthStore.getState();

      expect(hasPermission('view_dashboard' as Permission)).toBe(false);
    });
  });
});
