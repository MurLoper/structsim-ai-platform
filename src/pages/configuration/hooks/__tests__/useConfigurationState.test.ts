import React, { createRef, forwardRef, useImperativeHandle } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { useConfigurationState } from '../useConfigurationState';
import { useConfigStore } from '@/stores';
import { configApi } from '@/api';
import { useToast, useConfirmDialog } from '@/components/ui';

vi.mock('@/stores', () => ({
  useConfigStore: vi.fn(),
}));

vi.mock('@/api', () => ({
  configApi: {
    createProject: vi.fn(),
    updateProject: vi.fn(),
    createSimType: vi.fn(),
    updateSimType: vi.fn(),
    createParamDef: vi.fn(),
    updateParamDef: vi.fn(),
    createSolver: vi.fn(),
    updateSolver: vi.fn(),
    createConditionDef: vi.fn(),
    updateConditionDef: vi.fn(),
    createOutputDef: vi.fn(),
    updateOutputDef: vi.fn(),
    createFoldType: vi.fn(),
    updateFoldType: vi.fn(),
    deleteProject: vi.fn(),
    deleteSimType: vi.fn(),
    deleteParamDef: vi.fn(),
    deleteSolver: vi.fn(),
    deleteConditionDef: vi.fn(),
    deleteOutputDef: vi.fn(),
    deleteFoldType: vi.fn(),
  },
}));

vi.mock('@/components/ui', () => ({
  useToast: vi.fn(),
  useConfirmDialog: vi.fn(),
}));

type UseConfigurationStateReturn = ReturnType<typeof useConfigurationState>;

type ModalType =
  | 'project'
  | 'simType'
  | 'paramDef'
  | 'solver'
  | 'conditionDef'
  | 'outputDef'
  | 'foldType';

const TestComponent = forwardRef<UseConfigurationStateReturn>((_, ref) => {
  const state = useConfigurationState();
  useImperativeHandle(ref, () => state, [state]);
  return null;
});

TestComponent.displayName = 'TestComponent';

const setup = () => {
  const ref = createRef<UseConfigurationStateReturn>();
  render(React.createElement(TestComponent, { ref }));
  if (!ref.current) {
    throw new Error('Configuration state not initialized');
  }
  return { ref };
};

describe('useConfigurationState', () => {
  const refreshMocks = {
    refreshProjects: vi.fn().mockResolvedValue(undefined),
    refreshSimTypes: vi.fn().mockResolvedValue(undefined),
    refreshParamDefs: vi.fn().mockResolvedValue(undefined),
    refreshSolvers: vi.fn().mockResolvedValue(undefined),
    refreshConditionDefs: vi.fn().mockResolvedValue(undefined),
    refreshOutputDefs: vi.fn().mockResolvedValue(undefined),
    refreshFoldTypes: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();

    vi.mocked(useConfigStore).mockReturnValue({
      projects: [],
      paramDefs: [],
      workflows: [],
      simTypes: [],
      solvers: [],
      conditionDefs: [],
      outputDefs: [],
      foldTypes: [],
      refreshProjects: refreshMocks.refreshProjects,
      refreshSimTypes: refreshMocks.refreshSimTypes,
      refreshParamDefs: refreshMocks.refreshParamDefs,
      refreshSolvers: refreshMocks.refreshSolvers,
      refreshConditionDefs: refreshMocks.refreshConditionDefs,
      refreshOutputDefs: refreshMocks.refreshOutputDefs,
      refreshFoldTypes: refreshMocks.refreshFoldTypes,
    } as any);

    vi.mocked(useToast).mockReturnValue({ showToast: vi.fn() });
    vi.mocked(useConfirmDialog).mockReturnValue({
      showConfirm: vi.fn(),
      ConfirmDialogComponent: () => null,
    });

    const api = configApi as Record<string, any>;
    Object.keys(api).forEach(key => {
      if (vi.isMockFunction(api[key])) {
        api[key].mockResolvedValue({});
      }
    });
  });

  const cases: Array<{
    type: ModalType;
    createMethod: keyof typeof configApi;
    updateMethod: keyof typeof configApi;
    refresh: keyof typeof refreshMocks;
    createData: Record<string, any>;
    updateData: Record<string, any>;
    id: number;
  }> = [
    {
      type: 'project',
      createMethod: 'createProject',
      updateMethod: 'updateProject',
      refresh: 'refreshProjects',
      createData: { name: '项目A', code: 'P-A', sort: 10, remark: '备注A' },
      updateData: { name: '项目B', code: 'P-B', sort: 20, remark: '备注B' },
      id: 1,
    },
    {
      type: 'simType',
      createMethod: 'createSimType',
      updateMethod: 'updateSimType',
      refresh: 'refreshSimTypes',
      createData: { name: '结构仿真', code: 'ST', category: 'STRUCTURE', sort: 5 },
      updateData: { name: '热分析', code: 'TH', category: 'THERMAL', sort: 6 },
      id: 2,
    },
    {
      type: 'paramDef',
      createMethod: 'createParamDef',
      updateMethod: 'updateParamDef',
      refresh: 'refreshParamDefs',
      createData: {
        name: '长度',
        key: 'len',
        valType: 1,
        unit: 'mm',
        minVal: 0,
        maxVal: 100,
        defaultVal: '10',
        precision: 3,
        sort: 1,
      },
      updateData: {
        name: '长度2',
        key: 'len2',
        valType: 2,
        unit: 'cm',
        minVal: 1,
        maxVal: 200,
        defaultVal: '20',
        precision: 2,
        sort: 2,
      },
      id: 3,
    },
    {
      type: 'solver',
      createMethod: 'createSolver',
      updateMethod: 'updateSolver',
      refresh: 'refreshSolvers',
      createData: {
        name: 'NASTRAN',
        code: 'NST',
        version: '2024',
        cpuCoreMin: 1,
        cpuCoreMax: 64,
        cpuCoreDefault: 8,
        memoryMin: 1,
        memoryMax: 128,
        memoryDefault: 16,
        sort: 1,
      },
      updateData: {
        name: 'ABAQUS',
        code: 'ABA',
        version: '2023',
        cpuCoreMin: 2,
        cpuCoreMax: 32,
        cpuCoreDefault: 4,
        memoryMin: 2,
        memoryMax: 256,
        memoryDefault: 32,
        sort: 2,
      },
      id: 4,
    },
    {
      type: 'conditionDef',
      createMethod: 'createConditionDef',
      updateMethod: 'updateConditionDef',
      refresh: 'refreshConditionDefs',
      createData: {
        name: '载荷',
        code: 'LOAD',
        category: '载荷',
        unit: 'N',
        sort: 1,
        remark: '备注1',
      },
      updateData: {
        name: '约束',
        code: 'BC',
        category: '约束',
        unit: 'mm',
        sort: 2,
        remark: '备注2',
      },
      id: 5,
    },
    {
      type: 'outputDef',
      createMethod: 'createOutputDef',
      updateMethod: 'updateOutputDef',
      refresh: 'refreshOutputDefs',
      createData: {
        name: '位移',
        code: 'DISP',
        unit: 'mm',
        dataType: 'float',
        sort: 1,
        remark: '备注1',
      },
      updateData: {
        name: '应力',
        code: 'STRESS',
        unit: 'MPa',
        dataType: 'float',
        sort: 2,
        remark: '备注2',
      },
      id: 6,
    },
    {
      type: 'foldType',
      createMethod: 'createFoldType',
      updateMethod: 'updateFoldType',
      refresh: 'refreshFoldTypes',
      createData: { name: '折叠A', code: 'F1', angle: 30, sort: 1, remark: '备注1' },
      updateData: { name: '折叠B', code: 'F2', angle: 45, sort: 2, remark: '备注2' },
      id: 7,
    },
  ];

  const fillFormData = (state: UseConfigurationStateReturn, data: Record<string, any>) => {
    Object.entries(data).forEach(([key, value]) => {
      state.updateFormData(key, value);
    });
  };

  cases.forEach(testCase => {
    it(`创建 ${testCase.type} 时应提交所有字段`, async () => {
      const { ref } = setup();

      act(() => {
        ref.current!.openModal(testCase.type);
      });

      act(() => {
        fillFormData(ref.current!, testCase.createData);
      });

      await act(async () => {
        await ref.current!.handleSave();
      });

      const api = configApi as Record<string, any>;
      expect(api[testCase.createMethod]).toHaveBeenCalledWith(
        expect.objectContaining(testCase.createData)
      );
      expect(refreshMocks[testCase.refresh]).toHaveBeenCalled();
    });

    it(`编辑 ${testCase.type} 时应提交所有字段`, async () => {
      const { ref } = setup();

      act(() => {
        ref.current!.openModal(testCase.type, { id: testCase.id, ...testCase.createData });
      });

      act(() => {
        fillFormData(ref.current!, testCase.updateData);
      });

      await act(async () => {
        await ref.current!.handleSave();
      });

      const api = configApi as Record<string, any>;
      expect(api[testCase.updateMethod]).toHaveBeenCalledWith(
        testCase.id,
        expect.objectContaining(testCase.updateData)
      );
      expect(refreshMocks[testCase.refresh]).toHaveBeenCalled();
    });
  });
});
