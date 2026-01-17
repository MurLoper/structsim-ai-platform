// ============ 提单页面类型定义 ============

// 求解器配置
export interface SolverConfig {
  solverId: number;
  solverVersion: string;
  cpuType: number; // -1: 不并行(单节点), 1: 并行服务器节点
  cpuCores: number; // -1: 单节点不关注核数, 1-512: 并行核数
}

// 参数配置
export interface ParamConfig {
  mode: 'template' | 'custom'; // 模板应用 or 自定义
  templateSetId: number | null; // 参数模板集ID
  templateItemId: number | null; // 参数模板明细ID
  algorithm: 'bayesian' | 'doe'; // 贝叶斯优化 or DOE覆盖
  customValues: Record<string, number>; // 自定义参数值
}

// 工况输出配置
export interface CondOutConfig {
  mode: 'template' | 'custom'; // 模板应用 or 自定义
  condOutSetId: number | null; // 工况输出集ID
  selectedConditionIds: number[]; // 自定义选择的工况
  conditionValues: Record<number, Record<string, any>>; // 工况参数值
  selectedOutputIds: number[]; // 自定义选择的输出
}

// 仿真类型配置
export interface SimTypeConfig {
  simTypeId: number;
  params: ParamConfig;
  condOut: CondOutConfig;
  solver: SolverConfig;
}

// 全局求解器配置（可应用到所有仿真类型）
export interface GlobalSolverConfig extends SolverConfig {
  applyToAll: boolean;
}

// 源文件配置
export interface OriginFile {
  type: number; // 1: 路径, 2: ID, 3: 上传
  path: string;
  name: string;
}

// 画布变换状态
export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

// 抽屉模式
export type DrawerMode = 'project' | 'params' | 'condOut' | 'solver';
