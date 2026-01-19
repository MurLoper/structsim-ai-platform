/**
 * useSimTypes Query Hook 测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSimTypes, useCreateSimType, useUpdateSimType, useDeleteSimType } from '../useSimTypes';
import { baseConfigApi } from '@/api/config/base';
import type { SimType } from '@/types/config';

// Mock API
vi.mock('@/api/config/base', () => ({
  baseConfigApi: {
    getSimTypes: vi.fn(),
    createSimType: vi.fn(),
    updateSimType: vi.fn(),
    deleteSimType: vi.fn(),
  },
}));

// Mock 数据
const mockSimTypes: SimType[] = [
  {
    id: 1,
    name: '静力学仿真',
    code: 'STATIC',
    description: '静力学分析',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: '动力学仿真',
    code: 'DYNAMIC',
    description: '动力学分析',
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

describe('useSimTypes Query Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================
  // useSimTypes 测试
  // ============================================================

  describe('useSimTypes', () => {
    it('应该成功获取仿真类型列表', async () => {
      vi.mocked(baseConfigApi.getSimTypes).mockResolvedValue({
        data: mockSimTypes,
      });

      const { result } = renderHook(() => useSimTypes(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockSimTypes);
      expect(result.current.data).toHaveLength(2);
    });

    it('API 返回空数据时应该返回空数组', async () => {
      vi.mocked(baseConfigApi.getSimTypes).mockResolvedValue({
        data: null,
      });

      const { result } = renderHook(() => useSimTypes(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('API 错误时应该设置错误状态', async () => {
      const error = new Error('Network Error');
      vi.mocked(baseConfigApi.getSimTypes).mockRejectedValue(error);

      const { result } = renderHook(() => useSimTypes(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  // ============================================================
  // useCreateSimType 测试
  // ============================================================

  describe('useCreateSimType', () => {
    it('应该成功创建仿真类型', async () => {
      const newSimType: Partial<SimType> = {
        name: '热力学仿真',
        code: 'THERMAL',
        description: '热力学分析',
      };

      vi.mocked(baseConfigApi.createSimType).mockResolvedValue({
        data: { ...newSimType, id: 3 },
      });

      const { result } = renderHook(() => useCreateSimType(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(newSimType);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(baseConfigApi.createSimType).toHaveBeenCalledWith(newSimType);
    });

    it('创建失败时应该设置错误状态', async () => {
      const error = new Error('创建失败');
      vi.mocked(baseConfigApi.createSimType).mockRejectedValue(error);

      const { result } = renderHook(() => useCreateSimType(), {
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
  // useUpdateSimType 测试
  // ============================================================

  describe('useUpdateSimType', () => {
    it('应该成功更新仿真类型', async () => {
      const updateData = { name: '更新后的名称' };

      vi.mocked(baseConfigApi.updateSimType).mockResolvedValue({
        data: { ...mockSimTypes[0], ...updateData },
      });

      const { result } = renderHook(() => useUpdateSimType(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: 1, data: updateData });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(baseConfigApi.updateSimType).toHaveBeenCalledWith(1, updateData);
    });

    it('更新失败时应该设置错误状态', async () => {
      const error = new Error('更新失败');
      vi.mocked(baseConfigApi.updateSimType).mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateSimType(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: 1, data: { name: 'Test' } });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  // ============================================================
  // useDeleteSimType 测试
  // ============================================================

  describe('useDeleteSimType', () => {
    it('应该成功删除仿真类型', async () => {
      vi.mocked(baseConfigApi.deleteSimType).mockResolvedValue({
        data: { success: true },
      });

      const { result } = renderHook(() => useDeleteSimType(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(baseConfigApi.deleteSimType).toHaveBeenCalledWith(1);
    });

    it('删除失败时应该设置错误状态', async () => {
      const error = new Error('删除失败');
      vi.mocked(baseConfigApi.deleteSimType).mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteSimType(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });
});
