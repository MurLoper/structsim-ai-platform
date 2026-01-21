import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOrders } from '../useOrders';
import { ordersApi } from '@/api/orders';
import type { OrdersListResponse } from '@/types/order';

vi.mock('@/api/orders', () => ({
  ordersApi: {
    getOrders: vi.fn(),
  },
}));

const mockResponse: OrdersListResponse = {
  items: [
    {
      id: 1,
      orderNo: 'ORD-001',
      projectId: 10,
      simTypeIds: [1, 2],
      status: 1,
      progress: 30,
      createdBy: 1,
      createdAt: 1700000000,
      updatedAt: 1700000000,
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
  totalPages: 1,
};

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

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useOrders Query Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch orders list', async () => {
    vi.mocked(ordersApi.getOrders).mockResolvedValue({ data: mockResponse });

    const { result } = renderHook(() => useOrders({ page: 1, pageSize: 20 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResponse);
    expect(ordersApi.getOrders).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
  });

  it('should handle errors', async () => {
    const error = new Error('network');
    vi.mocked(ordersApi.getOrders).mockRejectedValue(error);

    const { result } = renderHook(() => useOrders({ page: 1, pageSize: 20 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});
