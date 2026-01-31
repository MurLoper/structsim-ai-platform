/**
 * 配置数据 Store
 *
 * ⚠️ 迁移说明:
 * 服务端数据正在迁移到 TanStack Query，请逐步使用新的 Query Hooks:
 *
 * 旧方式 (已弃用):
 *   const { projects, simTypes } = useConfigStore();
 *
 * 新方式 (推荐):
 *   import { useProjects, useSimTypes } from '@/features/config';
 *   const { data: projects } = useProjects();
 *   const { data: simTypes } = useSimTypes();
 *
 * 迁移进度:
 * - [x] useProjects, useSimTypes, useParamDefs, useSolvers
 * - [x] useConditionDefs, useOutputDefs, useFoldTypes
 * - [x] useParamTplSets, useCondOutSets, useStatusDefs
 * - [ ] 组件迁移中...
 */
import { create } from 'zustand';
import { configApi } from '@/api';
import type {
  Project,
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
} from '@/types';

interface ConfigState {
  // ============ 服务端数据 (迁移到 TanStack Query) ============
  /** @deprecated 使用 useProjects() 替代 */
  projects: Project[];
  /** @deprecated 使用 useSimTypes() 替代 */
  simTypes: SimType[];
  /** @deprecated 使用 useParamDefs() 替代 */
  paramDefs: ParamDef[];
  /** @deprecated 使用 useConditionDefs() 替代 */
  conditionDefs: ConditionDef[];
  /** @deprecated 使用 useOutputDefs() 替代 */
  outputDefs: OutputDef[];
  /** @deprecated 使用 useSolvers() 替代 */
  solvers: Solver[];
  /** @deprecated 使用 useStatusDefs() 替代 */
  statusDefs: StatusDef[];
  /** @deprecated 使用 useFoldTypes() 替代 */
  foldTypes: FoldType[];
  /** @deprecated 使用 useAutomationModules() 替代 */
  automationModules: AutomationModule[];
  /** @deprecated 使用 useWorkflows() 替代 */
  workflows: Workflow[];
  /** @deprecated 使用 useParamTplSets() 替代 */
  paramTplSets: ParamTplSet[];
  /** @deprecated 使用 useCondOutSets() 替代 */
  condOutSets: CondOutSet[];

  // ============ UI 状态 (保留在 Zustand) ============
  /** 全局配置加载状态 */
  isLoading: boolean;
  /** 全局错误信息 */
  error: string | null;

  // ============ Actions ============
  /** @deprecated 使用 TanStack Query hooks 自动管理数据获取 */
  fetchAllConfig: () => Promise<void>;
  /** @deprecated 使用 useProjects() + queryClient.invalidateQueries */
  refreshProjects: () => Promise<void>;
  /** @deprecated 使用 useSimTypes() + queryClient.invalidateQueries */
  refreshSimTypes: () => Promise<void>;
  /** @deprecated 使用 useParamDefs() + queryClient.invalidateQueries */
  refreshParamDefs: () => Promise<void>;
  /** @deprecated 使用 useSolvers() + queryClient.invalidateQueries */
  refreshSolvers: () => Promise<void>;
  /** @deprecated 使用 useConditionDefs() + queryClient.invalidateQueries */
  refreshConditionDefs: () => Promise<void>;
  /** @deprecated 使用 useOutputDefs() + queryClient.invalidateQueries */
  refreshOutputDefs: () => Promise<void>;
  /** @deprecated 使用 useFoldTypes() + queryClient.invalidateQueries */
  refreshFoldTypes: () => Promise<void>;
  /** @deprecated 使用 useCreateProject mutation */
  addProject: (project: Project) => void;
  /** 根据 ID 获取状态定义 */
  getStatus: (id: number) => StatusDef | undefined;
  /** 根据 ID 获取仿真类型 */
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
      const baseDataResponse = await configApi.getBaseData();
      const baseData = baseDataResponse?.data || baseDataResponse;

      // 并行获取其他数据
      const [projectsRes, workflowsRes, paramTplSetsRes, condOutSetsRes] = await Promise.all([
        configApi.getProjects().catch(() => ({ data: [] })),
        configApi.getWorkflows().catch(() => ({ data: [] })),
        configApi.getParamTplSets().catch(() => ({ data: [] })),
        configApi.getOutputGroups().catch(() => ({ data: [] })),
      ]);

      set({
        projects: Array.isArray(projectsRes?.data) ? projectsRes.data : [],
        workflows: Array.isArray(workflowsRes?.data) ? workflowsRes.data : [],
        paramTplSets: Array.isArray(paramTplSetsRes?.data) ? paramTplSetsRes.data : [],
        condOutSets: Array.isArray(condOutSetsRes?.data) ? condOutSetsRes.data : [],
        simTypes: Array.isArray(baseData?.simTypes) ? baseData.simTypes : [],
        paramDefs: Array.isArray(baseData?.paramDefs) ? baseData.paramDefs : [],
        conditionDefs: Array.isArray(baseData?.conditionDefs) ? baseData.conditionDefs : [],
        outputDefs: Array.isArray(baseData?.outputDefs) ? baseData.outputDefs : [],
        solvers: Array.isArray(baseData?.solvers) ? baseData.solvers : [],
        statusDefs: Array.isArray(baseData?.statusDefs) ? baseData.statusDefs : [],
        foldTypes: Array.isArray(baseData?.foldTypes) ? baseData.foldTypes : [],
        automationModules: Array.isArray(baseData?.automationModules)
          ? baseData.automationModules
          : [],
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

  // 单独刷新项目列表
  refreshProjects: async () => {
    try {
      const response = await configApi.getProjects();
      const projects = Array.isArray(response?.data) ? response.data : [];
      set({ projects });
    } catch (error) {
      console.error('Failed to refresh projects:', error);
    }
  },

  // 单独刷新仿真类型列表
  refreshSimTypes: async () => {
    try {
      const response = await configApi.getSimTypes();
      const simTypes = Array.isArray(response?.data) ? response.data : [];
      set({ simTypes });
    } catch (error) {
      console.error('Failed to refresh simTypes:', error);
    }
  },

  // 单独刷新参数定义列表
  refreshParamDefs: async () => {
    try {
      const response = await configApi.getParamDefs();
      const paramDefs = Array.isArray(response?.data) ? response.data : [];
      set({ paramDefs });
    } catch (error) {
      console.error('Failed to refresh paramDefs:', error);
    }
  },

  // 单独刷新求解器列表
  refreshSolvers: async () => {
    try {
      const response = await configApi.getSolvers();
      const solvers = Array.isArray(response?.data) ? response.data : [];
      set({ solvers });
    } catch (error) {
      console.error('Failed to refresh solvers:', error);
    }
  },

  // 单独刷新工况定义列表
  refreshConditionDefs: async () => {
    try {
      const response = await configApi.getConditionDefs();
      const conditionDefs = Array.isArray(response?.data) ? response.data : [];
      set({ conditionDefs });
    } catch (error) {
      console.error('Failed to refresh conditionDefs:', error);
    }
  },

  // 单独刷新输出定义列表
  refreshOutputDefs: async () => {
    try {
      const response = await configApi.getOutputDefs();
      const outputDefs = Array.isArray(response?.data) ? response.data : [];
      set({ outputDefs });
    } catch (error) {
      console.error('Failed to refresh outputDefs:', error);
    }
  },

  // 单独刷新姿态类型列表
  refreshFoldTypes: async () => {
    try {
      const response = await configApi.getFoldTypes();
      const foldTypes = Array.isArray(response?.data) ? response.data : [];
      set({ foldTypes });
    } catch (error) {
      console.error('Failed to refresh foldTypes:', error);
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
