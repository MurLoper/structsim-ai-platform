import { create } from 'zustand';
import { Project } from '@/types';
import { configApi } from '@/api';
import type {
  SimType,
  ParamDef,
  ConditionDef,
  OutputDef,
  Solver,
  StatusDef,
  FoldType,
  AutomationModule,
  Workflow,
  ParamTplSet,
  CondOutSet,
} from '@/api';

interface ConfigState {
  // Data
  projects: Project[];
  simTypes: SimType[];
  paramDefs: ParamDef[];
  conditionDefs: ConditionDef[];
  outputDefs: OutputDef[];
  solvers: Solver[];
  statusDefs: StatusDef[];
  foldTypes: FoldType[];
  automationModules: AutomationModule[];
  workflows: Workflow[];
  paramTplSets: ParamTplSet[];
  condOutSets: CondOutSet[];

  // State
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAllConfig: () => Promise<void>;
  addProject: (project: Project) => void;
  getStatus: (id: number) => StatusDef | undefined;
  getSimType: (id: number) => SimType | undefined;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
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

  fetchAllConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      // 先获取基础数据
      const baseData = await configApi.getBaseData();

      // 并行获取其他数据
      const [projects, workflows, paramTplSets, condOutSets] = await Promise.all([
        configApi.getProjects().catch(() => []),
        configApi.getWorkflows().catch(() => []),
        configApi.getParamTplSets().catch(() => []),
        configApi.getCondOutSets().catch(() => []),
      ]);

      set({
        projects: projects || [],
        workflows: workflows || [],
        paramTplSets: paramTplSets || [],
        condOutSets: condOutSets || [],
        simTypes: baseData?.simTypes || [],
        paramDefs: baseData?.paramDefs || [],
        conditionDefs: baseData?.conditionDefs || [],
        outputDefs: baseData?.outputDefs || [],
        solvers: baseData?.solvers || [],
        statusDefs: baseData?.statusDefs || [],
        foldTypes: baseData?.foldTypes || [],
        automationModules: baseData?.automationModules || [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load config:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load config',
        isLoading: false,
      });
    }
  },

  addProject: project => {
    set(state => ({ projects: [...state.projects, project] }));
  },

  getStatus: id => {
    return get().statusDefs.find(s => s.id === id);
  },

  getSimType: id => {
    return get().simTypes.find(s => s.id === id);
  },
}));
