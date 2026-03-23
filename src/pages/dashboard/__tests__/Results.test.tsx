import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Results from '../Results';

vi.mock('../hooks/useResultsData', () => ({
  useResultsData: vi.fn(),
}));

vi.mock('@/components/charts', () => ({
  BarChart: () => <div data-testid="mock-bar-chart" />,
}));

const mockUseResultsData = async (overrides = {}) => {
  const module = await import('../hooks/useResultsData');
  vi.mocked(module.useResultsData).mockReturnValue({
    displayOrderId: '#1',
    orderStatus: 2,
    orderProgress: 100,
    metric: '1',
    setMetric: vi.fn(),
    metricOptions: [{ value: '1', label: 'Metric A' }],
    metricLabelMap: new Map([[1, 'Metric A']]),
    conditionLabelMap: new Map([[1, 'Condition A']]),
    focusedConditionId: 1,
    setFocusedConditionId: vi.fn(),
    focusedCondition: null,
    focusedConditionAnalysis: null,
    focusedConditionResults: [],
    selectedConditionIds: [1],
    toggleCondition: vi.fn(),
    minValue: '',
    setMinValue: vi.fn(),
    maxValue: '',
    setMaxValue: vi.fn(),
    minIteration: '',
    setMinIteration: vi.fn(),
    maxIteration: '',
    setMaxIteration: vi.fn(),
    availableConditions: [{ id: 1, name: 'Condition A' }],
    filteredResults: [],
    trendData: [],
    avgByCondition: [],
    conditionResults: [],
    conditionRoundGroups: [],
    overviewStats: {
      conditionCount: 0,
      totalRounds: 0,
      completedRounds: 0,
      failedRounds: 0,
      runningRounds: 0,
      resultSource: 'mock',
      runningModules: [],
    },
    paramDefs: [],
    outputDefs: [],
    workflowNodes: [],
    updateConditionRoundsPage: vi.fn(),
    updateConditionRoundsPageSize: vi.fn(),
    isResultsLoading: false,
    resultsError: null,
    retryResults: vi.fn(),
    handleReset: vi.fn(),
    ...overrides,
  });
};

describe('Results page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show invalid order message when id is not number', async () => {
    await mockUseResultsData();

    render(
      <MemoryRouter initialEntries={['/results/abc']}>
        <Routes>
          <Route path="/results/:id" element={<Results />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('申请单不存在')).toBeInTheDocument();
    expect(screen.getByText('订单 ID 无效，请返回申请单列表重新进入。')).toBeInTheDocument();
  });

  it('should show error card and allow retry', async () => {
    const retryResults = vi.fn();
    await mockUseResultsData({ resultsError: new Error('network'), retryResults });

    render(
      <MemoryRouter initialEntries={['/results/1']}>
        <Routes>
          <Route path="/results/:id" element={<Results />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('结果加载失败')).toBeInTheDocument();
    const retryButton = screen.getByRole('button', { name: '重试' });
    await userEvent.click(retryButton);
    expect(retryResults).toHaveBeenCalled();
  });
});
