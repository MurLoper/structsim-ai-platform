import React, { createRef, forwardRef, useImperativeHandle } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { useConfigurationState } from '../useConfigurationState';
import {
  useProjects,
  useSimTypes,
  useParamDefs,
  useSolvers,
  useConditionDefs,
  useOutputDefs,
  useFoldTypes,
  useWorkflows,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useCreateSimType,
  useUpdateSimType,
  useDeleteSimType,
  useCreateParamDef,
  useUpdateParamDef,
  useDeleteParamDef,
  useCreateSolver,
  useUpdateSolver,
  useDeleteSolver,
  useCreateConditionDef,
  useUpdateConditionDef,
  useDeleteConditionDef,
  useCreateOutputDef,
  useUpdateOutputDef,
  useDeleteOutputDef,
  useCreateFoldType,
  useUpdateFoldType,
  useDeleteFoldType,
} from '@/features/config/queries';
import { useToast, useConfirmDialog } from '@/components/ui';

vi.mock('@/features/config/queries', () => ({
  useProjects: vi.fn(),
  useSimTypes: vi.fn(),
  useParamDefs: vi.fn(),
  useSolvers: vi.fn(),
  useConditionDefs: vi.fn(),
  useOutputDefs: vi.fn(),
  useFoldTypes: vi.fn(),
  useWorkflows: vi.fn(),
  useCreateProject: vi.fn(),
  useUpdateProject: vi.fn(),
  useDeleteProject: vi.fn(),
  useCreateSimType: vi.fn(),
  useUpdateSimType: vi.fn(),
  useDeleteSimType: vi.fn(),
  useCreateParamDef: vi.fn(),
  useUpdateParamDef: vi.fn(),
  useDeleteParamDef: vi.fn(),
  useCreateSolver: vi.fn(),
  useUpdateSolver: vi.fn(),
  useDeleteSolver: vi.fn(),
  useCreateConditionDef: vi.fn(),
  useUpdateConditionDef: vi.fn(),
  useDeleteConditionDef: vi.fn(),
  useCreateOutputDef: vi.fn(),
  useUpdateOutputDef: vi.fn(),
  useDeleteOutputDef: vi.fn(),
  useCreateFoldType: vi.fn(),
  useUpdateFoldType: vi.fn(),
  useDeleteFoldType: vi.fn(),
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
  const mutationMocks = {
    createProject: vi.fn().mockResolvedValue(undefined),
    updateProject: vi.fn().mockResolvedValue(undefined),
    deleteProject: vi.fn().mockResolvedValue(undefined),
    createSimType: vi.fn().mockResolvedValue(undefined),
    updateSimType: vi.fn().mockResolvedValue(undefined),
    deleteSimType: vi.fn().mockResolvedValue(undefined),
    createParamDef: vi.fn().mockResolvedValue(undefined),
    updateParamDef: vi.fn().mockResolvedValue(undefined),
    deleteParamDef: vi.fn().mockResolvedValue(undefined),
    createSolver: vi.fn().mockResolvedValue(undefined),
    updateSolver: vi.fn().mockResolvedValue(undefined),
    deleteSolver: vi.fn().mockResolvedValue(undefined),
    createConditionDef: vi.fn().mockResolvedValue(undefined),
    updateConditionDef: vi.fn().mockResolvedValue(undefined),
    deleteConditionDef: vi.fn().mockResolvedValue(undefined),
    createOutputDef: vi.fn().mockResolvedValue(undefined),
    updateOutputDef: vi.fn().mockResolvedValue(undefined),
    deleteOutputDef: vi.fn().mockResolvedValue(undefined),
    createFoldType: vi.fn().mockResolvedValue(undefined),
    updateFoldType: vi.fn().mockResolvedValue(undefined),
    deleteFoldType: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();

    vi.mocked(useProjects).mockReturnValue({ data: [] } as any);
    vi.mocked(useParamDefs).mockReturnValue({ data: [] } as any);
    vi.mocked(useWorkflows).mockReturnValue({ data: [] } as any);
    vi.mocked(useSimTypes).mockReturnValue({ data: [] } as any);
    vi.mocked(useSolvers).mockReturnValue({ data: [] } as any);
    vi.mocked(useConditionDefs).mockReturnValue({ data: [] } as any);
    vi.mocked(useOutputDefs).mockReturnValue({ data: [] } as any);
    vi.mocked(useFoldTypes).mockReturnValue({ data: [] } as any);

    vi.mocked(useCreateProject).mockReturnValue({
      mutateAsync: mutationMocks.createProject,
    } as any);
    vi.mocked(useUpdateProject).mockReturnValue({
      mutateAsync: mutationMocks.updateProject,
    } as any);
    vi.mocked(useDeleteProject).mockReturnValue({
      mutateAsync: mutationMocks.deleteProject,
    } as any);

    vi.mocked(useCreateSimType).mockReturnValue({
      mutateAsync: mutationMocks.createSimType,
    } as any);
    vi.mocked(useUpdateSimType).mockReturnValue({
      mutateAsync: mutationMocks.updateSimType,
    } as any);
    vi.mocked(useDeleteSimType).mockReturnValue({
      mutateAsync: mutationMocks.deleteSimType,
    } as any);

    vi.mocked(useCreateParamDef).mockReturnValue({
      mutateAsync: mutationMocks.createParamDef,
    } as any);
    vi.mocked(useUpdateParamDef).mockReturnValue({
      mutateAsync: mutationMocks.updateParamDef,
    } as any);
    vi.mocked(useDeleteParamDef).mockReturnValue({
      mutateAsync: mutationMocks.deleteParamDef,
    } as any);

    vi.mocked(useCreateSolver).mockReturnValue({ mutateAsync: mutationMocks.createSolver } as any);
    vi.mocked(useUpdateSolver).mockReturnValue({ mutateAsync: mutationMocks.updateSolver } as any);
    vi.mocked(useDeleteSolver).mockReturnValue({ mutateAsync: mutationMocks.deleteSolver } as any);

    vi.mocked(useCreateConditionDef).mockReturnValue({
      mutateAsync: mutationMocks.createConditionDef,
    } as any);
    vi.mocked(useUpdateConditionDef).mockReturnValue({
      mutateAsync: mutationMocks.updateConditionDef,
    } as any);
    vi.mocked(useDeleteConditionDef).mockReturnValue({
      mutateAsync: mutationMocks.deleteConditionDef,
    } as any);

    vi.mocked(useCreateOutputDef).mockReturnValue({
      mutateAsync: mutationMocks.createOutputDef,
    } as any);
    vi.mocked(useUpdateOutputDef).mockReturnValue({
      mutateAsync: mutationMocks.updateOutputDef,
    } as any);
    vi.mocked(useDeleteOutputDef).mockReturnValue({
      mutateAsync: mutationMocks.deleteOutputDef,
    } as any);

    vi.mocked(useCreateFoldType).mockReturnValue({
      mutateAsync: mutationMocks.createFoldType,
    } as any);
    vi.mocked(useUpdateFoldType).mockReturnValue({
      mutateAsync: mutationMocks.updateFoldType,
    } as any);
    vi.mocked(useDeleteFoldType).mockReturnValue({
      mutateAsync: mutationMocks.deleteFoldType,
    } as any);

    vi.mocked(useToast).mockReturnValue({ showToast: vi.fn() });
    vi.mocked(useConfirmDialog).mockReturnValue({
      showConfirm: vi.fn(),
      ConfirmDialogComponent: () => null,
    });
  });

  const cases: Array<{
    type: ModalType;
    createMock: keyof typeof mutationMocks;
    updateMock: keyof typeof mutationMocks;
    createData: Record<string, any>;
    updateData: Record<string, any>;
    id: number;
  }> = [
    {
      type: 'project',
      createMock: 'createProject',
      updateMock: 'updateProject',
      createData: { name: '项目A', code: 'P-A', sort: 10, remark: '备注A' },
      updateData: { name: '项目B', code: 'P-B', sort: 20, remark: '备注B' },
      id: 1,
    },
    {
      type: 'simType',
      createMock: 'createSimType',
      updateMock: 'updateSimType',
      createData: { name: '结构仿真', code: 'ST', category: 'STRUCTURE', sort: 5 },
      updateData: { name: '热分析', code: 'TH', category: 'THERMAL', sort: 6 },
      id: 2,
    },
    {
      type: 'paramDef',
      createMock: 'createParamDef',
      updateMock: 'updateParamDef',
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
      createMock: 'createSolver',
      updateMock: 'updateSolver',
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
      createMock: 'createConditionDef',
      updateMock: 'updateConditionDef',
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
      createMock: 'createOutputDef',
      updateMock: 'updateOutputDef',
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
      createMock: 'createFoldType',
      updateMock: 'updateFoldType',
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

      expect(mutationMocks[testCase.createMock]).toHaveBeenCalledWith(
        expect.objectContaining(testCase.createData)
      );
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

      expect(mutationMocks[testCase.updateMock]).toHaveBeenCalledWith({
        id: testCase.id,
        data: expect.objectContaining(testCase.updateData),
      });
    });
  });
});
