import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useResultsData } from '../useResultsData';
import { ordersApi, resultsApi } from '@/api';

vi.mock('@/api', () => ({
  ordersApi: {
    getOrder: vi.fn(),
  },
  resultsApi: {
    getOrderConditions: vi.fn(),
    getOrderConditionRounds: vi.fn(),
  },
}));

vi.mock('@/features/config/queries', () => ({
  useOutputDefs: vi.fn(),
  useParamDefs: vi.fn(),
}));

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

  it('should build results from condition mock rounds', async () => {
    const { useOutputDefs, useParamDefs } = await import('@/features/config/queries');

    vi.mocked(useOutputDefs).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    vi.mocked(useParamDefs).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    vi.mocked(ordersApi.getOrder).mockResolvedValue({
      data: { id: 1, orderNo: 'ORD-1', conditions: [{ id: 201 }] },
    });

    vi.mocked(resultsApi.getOrderConditions).mockResolvedValue({
      data: [
        {
          id: 201,
          orderId: 1,
          conditionId: 11,
          foldTypeName: '展开态',
          simTypeId: 1001,
          simTypeName: '贝叶斯优化',
          roundTotal: 1,
          outputCount: 1,
          process: 100,
          status: 2,
        },
      ],
    });

    vi.mocked(resultsApi.getOrderConditionRounds).mockResolvedValue({
      data: {
        resultSource: 'mock',
        statistics: {
          totalRounds: 1,
          completedRounds: 1,
          failedRounds: 0,
          runningRounds: 0,
        },
        orderCondition: {
          id: 201,
          orderId: 1,
          conditionId: 11,
          foldTypeName: '展开态',
          simTypeId: 1001,
          simTypeName: '贝叶斯优化',
          roundTotal: 1,
          outputCount: 1,
          process: 100,
          status: 2,
        },
        items: [
          {
            id: 'mock-201-1',
            orderConditionId: 201,
            roundIndex: 1,
            status: 2,
            process: 100,
            params: { param1: 1.23 },
            outputs: { output1: 12.34 },
            moduleDetails: [
              { moduleCode: 'PREPARE', moduleName: 'PREPARE', progress: 100 },
              { moduleCode: 'SOLVE', moduleName: 'SOLVE', progress: 100 },
            ],
          },
        ],
      },
    });

    const { result } = renderHook(() => useResultsData(1), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.filteredResults.length).toBe(1);
    });

    expect(result.current.metricOptions[0]?.value).toBe('output1');
    expect(result.current.trendData[0]?.value).toBe(12.34);
    expect(result.current.trendData[0]?.schemeName).toContain('展开态 / 贝叶斯优化');
    expect(result.current.avgByScheme[0]?.value).toBe(12.34);
    expect(result.current.avgByScheme[0]?.schemeName).toContain('展开态 / 贝叶斯优化');
    expect(result.current.workflowNodes.length).toBe(2);
    expect(result.current.overviewStats.resultSource).toBe('mock');
    expect(result.current.overviewStats.completedRounds).toBe(1);
  });

  it('should expose errors and trigger refetch on retry', async () => {
    const { useOutputDefs, useParamDefs } = await import('@/features/config/queries');
    const refetchOutputDefs = vi.fn();
    const refetchParamDefs = vi.fn();

    vi.mocked(useOutputDefs).mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('output defs error'),
      refetch: refetchOutputDefs,
    });
    vi.mocked(useParamDefs).mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('param defs error'),
      refetch: refetchParamDefs,
    });

    vi.mocked(ordersApi.getOrder).mockResolvedValue({
      data: { id: 1, orderNo: 'ORD-1', conditions: [] },
    });
    vi.mocked(resultsApi.getOrderConditions).mockResolvedValue({ data: [] });
    vi.mocked(resultsApi.getOrderConditionRounds).mockResolvedValue({
      data: { orderCondition: {} as never, items: [] },
    });

    const { result } = renderHook(() => useResultsData(1), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.resultsError).toBeTruthy();
    });

    const orderCalls = vi.mocked(ordersApi.getOrder).mock.calls.length;
    const conditionCalls = vi.mocked(resultsApi.getOrderConditions).mock.calls.length;

    act(() => {
      result.current.retryResults();
    });

    await waitFor(() => {
      expect(vi.mocked(ordersApi.getOrder).mock.calls.length).toBeGreaterThan(orderCalls);
      expect(vi.mocked(resultsApi.getOrderConditions).mock.calls.length).toBeGreaterThan(
        conditionCalls
      );
    });

    expect(refetchOutputDefs).toHaveBeenCalled();
    expect(refetchParamDefs).toHaveBeenCalled();
  });
});
