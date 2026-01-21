import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useResultsData } from '../useResultsData';
import { apiClient, ordersApi } from '@/api';

vi.mock('@/api', () => ({
  ordersApi: {
    getOrder: vi.fn(),
  },
  apiClient: {
    get: vi.fn(),
  },
}));

vi.mock('@/features/config/queries', () => ({
  useSimTypes: vi.fn(),
  useOutputDefs: vi.fn(),
}));

const mockSimTypes = [{ id: 1, name: 'Sim A' }];
const mockOutputDefs = [{ id: 1, name: 'Metric A' }];

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

describe('useResultsData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should build results from rounds data', async () => {
    const { useSimTypes, useOutputDefs } = await import('@/features/config/queries');

    vi.mocked(useSimTypes).mockReturnValue({
      data: mockSimTypes,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    vi.mocked(useOutputDefs).mockReturnValue({
      data: mockOutputDefs,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    vi.mocked(ordersApi.getOrder).mockResolvedValue({
      data: { id: 1, orderNo: 'ORD-1', simTypeIds: [1] },
    });

    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes('/results/order/')) {
        return Promise.resolve({
          data: [
            {
              id: 11,
              orderId: 1,
              simTypeId: 1,
              status: 1,
              progress: 0,
              totalRounds: 1,
              completedRounds: 1,
              failedRounds: 0,
            },
          ],
        });
      }
      if (url.includes('/results/sim-type/')) {
        return Promise.resolve({
          data: {
            items: [
              {
                id: 101,
                roundIndex: 1,
                outputs: { '1': 12.34 },
                status: 1,
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: [] });
    });

    const { result } = renderHook(() => useResultsData(1), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.filteredResults.length).toBe(1);
    });

    expect(result.current.trendData[0]?.value).toBe(12.34);
    expect(result.current.avgBySimType[0]?.value).toBe(12.34);
  });

  it('should expose errors and trigger refetch on retry', async () => {
    const { useSimTypes, useOutputDefs } = await import('@/features/config/queries');
    const refetchSimTypes = vi.fn();
    const refetchOutputDefs = vi.fn();

    vi.mocked(useSimTypes).mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('sim types error'),
      refetch: refetchSimTypes,
    });
    vi.mocked(useOutputDefs).mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('output defs error'),
      refetch: refetchOutputDefs,
    });

    vi.mocked(ordersApi.getOrder).mockResolvedValue({
      data: { id: 1, orderNo: 'ORD-1', simTypeIds: [] },
    });

    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useResultsData(1), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.resultsError).toBeTruthy();
    });

    const orderCalls = vi.mocked(ordersApi.getOrder).mock.calls.length;
    const apiCalls = vi.mocked(apiClient.get).mock.calls.length;

    act(() => {
      result.current.retryResults();
    });

    await waitFor(() => {
      expect(vi.mocked(ordersApi.getOrder).mock.calls.length).toBeGreaterThan(orderCalls);
      expect(vi.mocked(apiClient.get).mock.calls.length).toBeGreaterThan(apiCalls);
    });

    expect(refetchSimTypes).toHaveBeenCalled();
    expect(refetchOutputDefs).toHaveBeenCalled();
  });
});
