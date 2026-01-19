/**
 * useProjects Query Hook 测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProjects, useProject, useCreateProject } from '../useProjects';
import { baseConfigApi } from '@/api/config/base';
import type { Project } from '@/types/config';

// Mock API
vi.mock('@/api/config/base', () => ({
  baseConfigApi: {
    getProjects: vi.fn(),
    getProject: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
  },
}));

// Mock 数据
const mockProjects: Project[] = [
  {
    id: 1,
    name: '项目A',
    code: 'PROJ_A',
    description: '测试项目A',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: '项目B',
    code: 'PROJ_B',
    description: '测试项目B',
    status: 'active',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

// 创建测试 QueryClient
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Wrapper 组件
function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useProjects Query Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================
  // useProjects 测试
  // ============================================================

  describe('useProjects', () => {
    it('应该成功获取项目列表', async () => {
      vi.mocked(baseConfigApi.getProjects).mockResolvedValue({
        data: mockProjects,
      });

      const { result } = renderHook(() => useProjects(), {
        wrapper: createWrapper(),
      });

      // 初始状态应该是 loading
      expect(result.current.isLoading).toBe(true);

      // 等待数据加载完成
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // 验证数据
      expect(result.current.data).toEqual(mockProjects);
      expect(result.current.data).toHaveLength(2);
    });

    it('API 返回空数据时应该返回空数组', async () => {
      vi.mocked(baseConfigApi.getProjects).mockResolvedValue({
        data: null,
      });

      const { result } = renderHook(() => useProjects(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('API 错误时应该设置错误状态', async () => {
      const error = new Error('Network Error');
      vi.mocked(baseConfigApi.getProjects).mockRejectedValue(error);

      const { result } = renderHook(() => useProjects(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  // ============================================================
  // useProject 测试
  // ============================================================

  describe('useProject', () => {
    it('应该成功获取单个项目', async () => {
      const mockProject = mockProjects[0];
      vi.mocked(baseConfigApi.getProject).mockResolvedValue({
        data: mockProject,
      });

      const { result } = renderHook(() => useProject(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockProject);
      expect(baseConfigApi.getProject).toHaveBeenCalledWith(1);
    });

    it('id 为 0 时不应该发起请求', async () => {
      const { result } = renderHook(() => useProject(0), {
        wrapper: createWrapper(),
      });

      // 由于 enabled: false，不应该发起请求
      expect(result.current.fetchStatus).toBe('idle');
      expect(baseConfigApi.getProject).not.toHaveBeenCalled();
    });

    it('id 为负数时不应该发起请求', async () => {
      const { result } = renderHook(() => useProject(-1), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(baseConfigApi.getProject).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // useCreateProject 测试
  // ============================================================

  describe('useCreateProject', () => {
    it('应该成功创建项目', async () => {
      const newProject: Partial<Project> = {
        name: '新项目',
        code: 'NEW_PROJ',
        description: '新创建的项目',
      };

      const createdProject = {
        ...newProject,
        id: 3,
        status: 'active',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      };

      vi.mocked(baseConfigApi.createProject).mockResolvedValue({
        data: createdProject,
      });

      const { result } = renderHook(() => useCreateProject(), {
        wrapper: createWrapper(),
      });

      // 执行 mutation
      result.current.mutate(newProject);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(baseConfigApi.createProject).toHaveBeenCalledWith(newProject);
    });

    it('创建失败时应该设置错误状态', async () => {
      const error = new Error('创建失败');
      vi.mocked(baseConfigApi.createProject).mockRejectedValue(error);

      const { result } = renderHook(() => useCreateProject(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ name: 'Test' });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  // ============================================================
  // Query Keys 测试
  // ============================================================

  describe('Query Keys', () => {
    it('useProjects 应该使用正确的 queryKey', async () => {
      vi.mocked(baseConfigApi.getProjects).mockResolvedValue({
        data: mockProjects,
      });

      const queryClient = createTestQueryClient();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      renderHook(() => useProjects(), { wrapper });

      await waitFor(() => {
        const cache = queryClient.getQueryCache();
        const queries = cache.findAll();
        expect(queries.some(q => q.queryKey[0] === 'projects')).toBe(true);
      });
    });
  });
});
