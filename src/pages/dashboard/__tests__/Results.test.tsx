import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Results from '../Results';

vi.mock('../hooks/useResultsData', () => ({
  useResultsData: vi.fn(),
}));

const mockUseResultsData = async (overrides = {}) => {
  const module = await import('../hooks/useResultsData');
  vi.mocked(module.useResultsData).mockReturnValue({
    displayOrderId: '#1',
    metric: '1',
    setMetric: vi.fn(),
    metricOptions: [{ value: '1', label: 'Metric A' }],
    metricLabelMap: new Map([[1, 'Metric A']]),
    schemeLabelMap: new Map([[1, 'Sim A']]),
    selectedSchemeIds: [1],
    toggleScheme: vi.fn(),
    minValue: '',
    setMinValue: vi.fn(),
    maxValue: '',
    setMaxValue: vi.fn(),
    minIteration: '',
    setMinIteration: vi.fn(),
    maxIteration: '',
    setMaxIteration: vi.fn(),
    availableSchemes: [{ id: 1, name: 'Sim A' }],
    filteredResults: [],
    trendData: [],
    avgByScheme: [],
    schemeResults: [],
    schemeRoundGroups: [],
    overviewStats: {
      schemeCount: 0,
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

    expect(screen.getByText('订单不存在')).toBeInTheDocument();
    expect(screen.getByText('无效的订单 ID，请返回订单列表')).toBeInTheDocument();
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
