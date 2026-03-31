import type { GlobalSolverConfig } from './types';

export const DRAFT_SCOPE_SESSION_KEY = 'submission_draft_scope_id';
export const PROJECT_HABIT_STORAGE_KEY = 'submission_project_habits';

export const DEFAULT_GLOBAL_SOLVER: GlobalSolverConfig = {
  solverId: 1,
  solverVersion: '2024',
  cpuType: 1,
  cpuCores: 16,
  double: 0,
  applyGlobal: null,
  useGlobalConfig: 0,
  resourceId: null,
  applyToAll: true,
};

export const MOCK_RESOURCE_POOLS = [
  {
    id: 1,
    name: '标准节点',
    code: 'STD',
    description: '标准计算节点',
    cpuCores: 16,
    memoryGb: 64,
    valid: 1,
    sort: 10,
  },
  {
    id: 2,
    name: '大内存节点',
    code: 'MEM',
    description: '高内存计算节点',
    cpuCores: 32,
    memoryGb: 256,
    valid: 1,
    sort: 20,
  },
  {
    id: 3,
    name: 'GPU节点',
    code: 'GPU',
    description: 'GPU 计算节点',
    cpuCores: 16,
    memoryGb: 128,
    valid: 1,
    sort: 30,
  },
] as const;
