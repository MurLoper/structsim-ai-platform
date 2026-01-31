import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query 客户端配置
 *
 * 配置说明:
 * - staleTime: 数据过期时间，5分钟内不会重新请求
 * - gcTime: 垃圾回收时间，30分钟后清理未使用的缓存
 * - refetchOnWindowFocus: 禁用窗口聚焦时自动刷新
 * - retry: 请求失败重试1次
 * - refetchOnReconnect: 网络恢复时自动刷新
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟
      gcTime: 30 * 60 * 1000, // 30分钟
      refetchOnWindowFocus: false,
      retry: 1,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * Query Keys 工厂函数
 * 统一管理所有 Query 的缓存键
 */
export const queryKeys = {
  // 项目
  projects: {
    all: ['projects'] as const,
    list: () => [...queryKeys.projects.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.projects.all, 'detail', id] as const,
  },
  // 仿真类型
  simTypes: {
    all: ['simTypes'] as const,
    list: () => [...queryKeys.simTypes.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.simTypes.all, 'detail', id] as const,
    byFoldType: (foldTypeId: number | null) =>
      [...queryKeys.simTypes.all, 'byFoldType', foldTypeId] as const,
  },
  // 参数定义
  paramDefs: {
    all: ['paramDefs'] as const,
    list: () => [...queryKeys.paramDefs.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.paramDefs.all, 'detail', id] as const,
  },
  // 工况定义
  conditionDefs: {
    all: ['conditionDefs'] as const,
    list: () => [...queryKeys.conditionDefs.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.conditionDefs.all, 'detail', id] as const,
  },
  // 输出定义
  outputDefs: {
    all: ['outputDefs'] as const,
    list: () => [...queryKeys.outputDefs.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.outputDefs.all, 'detail', id] as const,
  },
  // 求解器
  solvers: {
    all: ['solvers'] as const,
    list: () => [...queryKeys.solvers.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.solvers.all, 'detail', id] as const,
  },
  // 姿态类型 (FoldType)
  foldTypes: {
    all: ['foldTypes'] as const,
    list: () => [...queryKeys.foldTypes.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.foldTypes.all, 'detail', id] as const,
  },
  // 参数组合 (ParamGroup)
  paramGroups: {
    all: ['paramGroups'] as const,
    list: (simTypeId?: number) =>
      simTypeId
        ? ([...queryKeys.paramGroups.all, 'list', { simTypeId }] as const)
        : ([...queryKeys.paramGroups.all, 'list'] as const),
    detail: (id: number) => [...queryKeys.paramGroups.all, 'detail', id] as const,
  },
  // 输出组合
  outputGroups: {
    all: ['outputGroups'] as const,
    list: (simTypeId?: number) =>
      simTypeId
        ? ([...queryKeys.outputGroups.all, 'list', { simTypeId }] as const)
        : ([...queryKeys.outputGroups.all, 'list'] as const),
    detail: (id: number) => [...queryKeys.outputGroups.all, 'detail', id] as const,
  },
  // 订单
  orders: {
    all: ['orders'] as const,
    list: () => [...queryKeys.orders.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.orders.all, 'detail', id] as const,
    statistics: () => [...queryKeys.orders.all, 'statistics'] as const,
    trends: (days: number) => [...queryKeys.orders.all, 'trends', days] as const,
    statusDistribution: () => [...queryKeys.orders.all, 'statusDistribution'] as const,
  },
  // 工作流
  workflows: {
    all: ['workflows'] as const,
    list: () => [...queryKeys.workflows.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.workflows.all, 'detail', id] as const,
  },
  // 自动化模块
  automationModules: {
    all: ['automationModules'] as const,
    list: () => [...queryKeys.automationModules.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.automationModules.all, 'detail', id] as const,
  },
  // 工况配置
  workingConditions: {
    all: ['workingConditions'] as const,
    list: () => [...queryKeys.workingConditions.all, 'list'] as const,
    byFoldType: (foldTypeId: number | null) =>
      [...queryKeys.workingConditions.all, 'byFoldType', foldTypeId] as const,
  },
  // 姿态-仿真类型关联
  foldTypeSimTypeRels: {
    all: ['foldTypeSimTypeRels'] as const,
    list: () => [...queryKeys.foldTypeSimTypeRels.all, 'list'] as const,
  },
} as const;
