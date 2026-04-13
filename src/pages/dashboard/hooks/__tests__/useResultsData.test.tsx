import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ordersApi, resultsApi } from '@/api';
import { useResultsData } from '../useResultsData';

vi.mock('@/api', () => ({
  ordersApi: {
    getOrder: vi.fn(),
  },
  resultsApi: {
    getOrderCaseResults: vi.fn(),
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

const mockCondition = {
  id: 201,
  orderId: 1,
  conditionId: 11,
  foldTypeName: '展开态',
  simTypeId: 1001,
  simTypeName: '跌落',
  roundTotal: 1,
  outputCount: 1,
  process: 100,
  status: 2,
  resultSource: 'mock',
  statistics: {
    totalRounds: 1,
    completedRounds: 1,
    failedRounds: 0,
    runningRounds: 0,
  },
};

describe('useResultsData', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
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
  });

  it('从订单 case 结果构建趋势、概览和流程节点', async () => {
    vi.mocked(ordersApi.getOrder).mockResolvedValue({
      data: { id: 1, orderNo: 'ORD-1' },
    });

    vi.mocked(resultsApi.getOrderCaseResults).mockResolvedValue({
      data: {
        orderId: 1,
        conditions: [mockCondition],
        cases: [
          {
            id: 1,
            orderId: 1,
            caseIndex: 1,
            optIssueId: null,
            optJobId: null,
            status: 2,
            process: 100,
            statistics: {
              totalRounds: 1,
              completedRounds: 1,
              failedRounds: 0,
              runningRounds: 0,
            },
            conditions: [
              {
                ...mockCondition,
                caseId: 1,
                caseIndex: 1,
                rounds: {
                  resultSource: 'mock',
                  statistics: {
                    totalRounds: 1,
                    completedRounds: 1,
                    failedRounds: 0,
                    runningRounds: 0,
                  },
                  orderCondition: mockCondition,
                  items: [
                    {
                      id: 'mock-201-1',
                      caseConditionId: 201,
                      roundIndex: 1,
                      status: 2,
                      process: 100,
                      params: { param1: 1.23 },
                      outputs: { output1: 12.34 },
                      moduleDetails: [
                        { moduleCode: 'PREPARE', moduleName: '准备', progress: 100 },
                        { moduleCode: 'SOLVE', moduleName: '求解', progress: 100 },
                      ],
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    });

    const { result } = renderHook(() => useResultsData(1), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.filteredResults.length).toBe(1);
    });

    expect(resultsApi.getOrderCaseResults).toHaveBeenCalledTimes(1);
    expect(result.current.metricOptions[0]?.value).toBe('output1');
    expect(result.current.trendData[0]?.value).toBe(12.34);
    expect(result.current.trendData[0]?.conditionName).toContain('展开态 / 跌落');
    expect(result.current.avgByCondition[0]?.value).toBe(12.34);
    expect(result.current.workflowNodes.length).toBe(2);
    expect(result.current.overviewStats.resultSource).toBe('mock');
    expect(result.current.overviewStats.completedRounds).toBe(1);
  });

  it('重试时只刷新订单详情和 case 结果', async () => {
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
      data: { id: 1, orderNo: 'ORD-1' },
    });
    vi.mocked(resultsApi.getOrderCaseResults).mockResolvedValue({
      data: { orderId: 1, cases: [], conditions: [] },
    });

    const { result } = renderHook(() => useResultsData(1), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.resultsError).toBeTruthy();
    });

    const orderCalls = vi.mocked(ordersApi.getOrder).mock.calls.length;
    const caseCalls = vi.mocked(resultsApi.getOrderCaseResults).mock.calls.length;

    act(() => {
      result.current.retryResults();
    });

    await waitFor(() => {
      expect(vi.mocked(ordersApi.getOrder).mock.calls.length).toBeGreaterThan(orderCalls);
      expect(vi.mocked(resultsApi.getOrderCaseResults).mock.calls.length).toBeGreaterThan(
        caseCalls
      );
    });

    expect(refetchOutputDefs).toHaveBeenCalled();
    expect(refetchParamDefs).toHaveBeenCalled();
  });
});
