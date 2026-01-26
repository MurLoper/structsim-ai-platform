/**
 * configStore 测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useConfigStore } from '../configStore';
import { configApi } from '@/api';

vi.mock('@/api', () => ({
  configApi: {
    getBaseData: vi.fn(),
    getProjects: vi.fn(),
    getWorkflows: vi.fn(),
    getParamTplSets: vi.fn(),
    getCondOutSets: vi.fn(),
  },
}));

describe('configStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useConfigStore.setState({
      projects: [],
      simTypes: [],
      paramDefs: [],
      conditionDefs: [],
      outputDefs: [],
      solvers: [],
      statusDefs: [],
      foldTypes: [],
      automationModules: [],
      workflows: [],
      paramTplSets: [],
      condOutSets: [],
      isLoading: false,
      error: null,
    });
  });

  it('fetchAllConfig 应填充基础配置数据', async () => {
    vi.mocked(configApi.getBaseData).mockResolvedValue({
      data: {
        simTypes: [{ id: 1, name: '结构', code: 'S', supportAlgMask: 1, valid: 1, sort: 1 }],
        paramDefs: [
          {
            id: 1,
            name: '参数A',
            key: 'P',
            valType: 1,
            precision: 2,
            required: 1,
            valid: 1,
            sort: 1,
          },
        ],
        conditionDefs: [{ id: 1, name: '工况', code: 'C', valid: 1, sort: 1 }],
        outputDefs: [{ id: 1, name: '结果', code: 'O', dataType: 'float', valid: 1, sort: 1 }],
        solvers: [
          {
            id: 1,
            name: 'Solver',
            code: 'SOL',
            cpuCoreMin: 1,
            cpuCoreMax: 8,
            cpuCoreDefault: 4,
            memoryMin: 1,
            memoryMax: 16,
            memoryDefault: 8,
            valid: 1,
            sort: 1,
          },
        ],
        statusDefs: [{ id: 1, name: '完成', code: 'DONE', statusType: 'FINAL', sort: 1 }],
        foldTypes: [{ id: 1, name: '姿态A', angle: 0, valid: 1, sort: 1 }],
        automationModules: [{ id: 1, name: 'Auto', code: 'AUTO', moduleType: 'script', sort: 1 }],
      },
    });

    vi.mocked(configApi.getProjects).mockResolvedValue({
      data: [{ id: 1, name: '项目A', code: 'P1', valid: 1, sort: 1, createdAt: 0, updatedAt: 0 }],
    });
    vi.mocked(configApi.getWorkflows).mockResolvedValue({
      data: [{ id: 1, name: '流程A', type: 'default', valid: 1, sort: 1 }],
    });
    vi.mocked(configApi.getParamTplSets).mockResolvedValue({
      data: [{ id: 1, name: '模板A', simTypeId: 1, valid: 1, sort: 1 }],
    });
    vi.mocked(configApi.getCondOutSets).mockResolvedValue({
      data: [{ id: 1, name: '条件A', simTypeId: 1, valid: 1, sort: 1 }],
    });

    await useConfigStore.getState().fetchAllConfig();

    const state = useConfigStore.getState();
    expect(state.projects).toHaveLength(1);
    expect(state.simTypes).toHaveLength(1);
    expect(state.paramDefs).toHaveLength(1);
    expect(state.conditionDefs).toHaveLength(1);
    expect(state.outputDefs).toHaveLength(1);
    expect(state.solvers).toHaveLength(1);
    expect(state.statusDefs).toHaveLength(1);
    expect(state.foldTypes).toHaveLength(1);
    expect(state.automationModules).toHaveLength(1);
    expect(state.workflows).toHaveLength(1);
    expect(state.paramTplSets).toHaveLength(1);
    expect(state.condOutSets).toHaveLength(1);
    expect(state.isLoading).toBe(false);
  });

  it('fetchAllConfig 出错时应设置 error', async () => {
    vi.mocked(configApi.getBaseData).mockRejectedValue(new Error('Network error'));

    await useConfigStore.getState().fetchAllConfig();

    const state = useConfigStore.getState();
    expect(state.error).toBeTruthy();
    expect(state.isLoading).toBe(false);
  });

  it('getStatus 与 getSimType 应返回匹配数据', () => {
    useConfigStore.setState({
      statusDefs: [{ id: 99, name: '完成', code: 'DONE', statusType: 'FINAL', sort: 1 }],
      simTypes: [{ id: 77, name: '结构', code: 'S', supportAlgMask: 1, valid: 1, sort: 1 }],
    });

    const state = useConfigStore.getState();
    expect(state.getStatus(99)?.code).toBe('DONE');
    expect(state.getSimType(77)?.name).toBe('结构');
  });

  it('refreshProjects 应更新项目列表', async () => {
    vi.mocked(configApi.getProjects).mockResolvedValue({
      data: [{ id: 1, name: '项目B', code: 'P2', valid: 1, sort: 1, createdAt: 0, updatedAt: 0 }],
    });

    await useConfigStore.getState().refreshProjects();

    expect(useConfigStore.getState().projects).toHaveLength(1);
  });
});
