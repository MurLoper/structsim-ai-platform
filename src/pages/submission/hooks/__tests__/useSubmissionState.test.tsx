import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSubmissionState } from '../useSubmissionState';

vi.mock('@/features/config/queries', () => ({
  useProjects: vi.fn(),
  useSimTypes: vi.fn(),
  useFoldTypes: vi.fn(),
  useParamDefs: vi.fn(),
  useSolvers: vi.fn(),
  useOutputDefs: vi.fn(),
  useConditionDefs: vi.fn(),
  useParamTplSets: vi.fn(),
  useCondOutSets: vi.fn(),
}));

const createQueryResult = (overrides = {}) => ({
  data: [],
  isLoading: false,
  error: null,
  refetch: vi.fn(),
  ...overrides,
});

describe('useSubmissionState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should aggregate loading state', async () => {
    const queries = await import('@/features/config/queries');

    vi.mocked(queries.useProjects).mockReturnValue(createQueryResult({ isLoading: true }));
    vi.mocked(queries.useSimTypes).mockReturnValue(createQueryResult());
    vi.mocked(queries.useFoldTypes).mockReturnValue(createQueryResult());
    vi.mocked(queries.useParamDefs).mockReturnValue(createQueryResult());
    vi.mocked(queries.useSolvers).mockReturnValue(createQueryResult());
    vi.mocked(queries.useOutputDefs).mockReturnValue(createQueryResult());
    vi.mocked(queries.useConditionDefs).mockReturnValue(createQueryResult());
    vi.mocked(queries.useParamTplSets).mockReturnValue(createQueryResult());
    vi.mocked(queries.useCondOutSets).mockReturnValue(createQueryResult());

    const { result } = renderHook(() => useSubmissionState(null));

    expect(result.current.isConfigLoading).toBe(true);
    expect(result.current.configError).toBeFalsy();
  });

  it('should trigger all refetches on retryConfig', async () => {
    const queries = await import('@/features/config/queries');

    const projects = createQueryResult();
    const simTypes = createQueryResult();
    const foldTypes = createQueryResult();
    const paramDefs = createQueryResult();
    const solvers = createQueryResult();
    const outputDefs = createQueryResult();
    const conditionDefs = createQueryResult();
    const paramTplSets = createQueryResult();
    const condOutSets = createQueryResult();

    vi.mocked(queries.useProjects).mockReturnValue(projects);
    vi.mocked(queries.useSimTypes).mockReturnValue(simTypes);
    vi.mocked(queries.useFoldTypes).mockReturnValue(foldTypes);
    vi.mocked(queries.useParamDefs).mockReturnValue(paramDefs);
    vi.mocked(queries.useSolvers).mockReturnValue(solvers);
    vi.mocked(queries.useOutputDefs).mockReturnValue(outputDefs);
    vi.mocked(queries.useConditionDefs).mockReturnValue(conditionDefs);
    vi.mocked(queries.useParamTplSets).mockReturnValue(paramTplSets);
    vi.mocked(queries.useCondOutSets).mockReturnValue(condOutSets);

    const { result } = renderHook(() => useSubmissionState(null));

    act(() => {
      result.current.retryConfig();
    });

    expect(projects.refetch).toHaveBeenCalled();
    expect(simTypes.refetch).toHaveBeenCalled();
    expect(foldTypes.refetch).toHaveBeenCalled();
    expect(paramDefs.refetch).toHaveBeenCalled();
    expect(solvers.refetch).toHaveBeenCalled();
    expect(outputDefs.refetch).toHaveBeenCalled();
    expect(conditionDefs.refetch).toHaveBeenCalled();
    expect(paramTplSets.refetch).toHaveBeenCalled();
    expect(condOutSets.refetch).toHaveBeenCalled();
  });
});
