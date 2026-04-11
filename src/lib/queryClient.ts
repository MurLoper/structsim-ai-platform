import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query 瀹㈡埛绔厤缃? *
 * 閰嶇疆璇存槑:
 * - staleTime: 鏁版嵁杩囨湡鏃堕棿锛?鍒嗛挓鍐呬笉浼氶噸鏂拌姹?
 * - gcTime: 鍨冨溇鍥炴敹鏃堕棿锛?0鍒嗛挓鍚庢竻鐞嗘湭浣跨敤鐨勭紦瀛?
 * - refetchOnWindowFocus: 绂佺敤绐楀彛鑱氱劍鏃惰嚜鍔ㄥ埛鏂?
 * - retry: 璇锋眰澶辫触閲嶈瘯1娆?
 * - refetchOnReconnect: 缃戠粶鎭㈠鏃惰嚜鍔ㄥ埛鏂?
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
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
 * Query Keys 宸ュ巶鍑芥暟
 * 缁熶竴绠＄悊鎵€鏈?Query 鐨勭紦瀛橀敭
 */
export const queryKeys = {
  projects: {
    all: ['projects'] as const,
    list: () => [...queryKeys.projects.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.projects.all, 'detail', id] as const,
  },
  simTypes: {
    all: ['simTypes'] as const,
    list: () => [...queryKeys.simTypes.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.simTypes.all, 'detail', id] as const,
    byFoldType: (foldTypeId: number | null) =>
      [...queryKeys.simTypes.all, 'byFoldType', foldTypeId] as const,
  },
  paramDefs: {
    all: ['paramDefs'] as const,
    list: () => [...queryKeys.paramDefs.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.paramDefs.all, 'detail', id] as const,
  },
  conditionDefs: {
    all: ['conditionDefs'] as const,
    list: () => [...queryKeys.conditionDefs.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.conditionDefs.all, 'detail', id] as const,
  },
  outputDefs: {
    all: ['outputDefs'] as const,
    list: () => [...queryKeys.outputDefs.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.outputDefs.all, 'detail', id] as const,
  },
  postProcessModes: {
    all: ['postProcessModes'] as const,
    list: () => [...queryKeys.postProcessModes.all, 'list'] as const,
  },
  solvers: {
    all: ['solvers'] as const,
    list: () => [...queryKeys.solvers.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.solvers.all, 'detail', id] as const,
  },
  foldTypes: {
    all: ['foldTypes'] as const,
    list: () => [...queryKeys.foldTypes.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.foldTypes.all, 'detail', id] as const,
  },
  paramGroups: {
    all: ['paramGroups'] as const,
    list: (simTypeId?: number) =>
      simTypeId
        ? ([...queryKeys.paramGroups.all, 'list', { simTypeId }] as const)
        : ([...queryKeys.paramGroups.all, 'list'] as const),
    detail: (id: number) => [...queryKeys.paramGroups.all, 'detail', id] as const,
  },
  outputGroups: {
    all: ['outputGroups'] as const,
    list: (simTypeId?: number) =>
      simTypeId
        ? ([...queryKeys.outputGroups.all, 'list', { simTypeId }] as const)
        : ([...queryKeys.outputGroups.all, 'list'] as const),
    detail: (id: number) => [...queryKeys.outputGroups.all, 'detail', id] as const,
  },
  orders: {
    all: ['orders'] as const,
    list: () => [...queryKeys.orders.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.orders.all, 'detail', id] as const,
    statistics: () => [...queryKeys.orders.all, 'statistics'] as const,
    trends: (days: number) => [...queryKeys.orders.all, 'trends', days] as const,
    statusDistribution: () => [...queryKeys.orders.all, 'statusDistribution'] as const,
  },
  workflows: {
    all: ['workflows'] as const,
    list: () => [...queryKeys.workflows.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.workflows.all, 'detail', id] as const,
  },
  automationModules: {
    all: ['automationModules'] as const,
    list: () => [...queryKeys.automationModules.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.automationModules.all, 'detail', id] as const,
  },
  workingConditions: {
    all: ['workingConditions'] as const,
    list: () => [...queryKeys.workingConditions.all, 'list'] as const,
    byFoldType: (foldTypeId: number | null) =>
      [...queryKeys.workingConditions.all, 'byFoldType', foldTypeId] as const,
  },
  conditionConfigs: {
    all: ['conditionConfigs'] as const,
    list: () => [...queryKeys.conditionConfigs.all, 'list'] as const,
    byFoldSim: (foldTypeId: number | null, simTypeId: number | null) =>
      [...queryKeys.conditionConfigs.all, 'byFoldSim', foldTypeId, simTypeId] as const,
    byFoldType: (foldTypeId: number | null) =>
      [...queryKeys.conditionConfigs.all, 'byFoldType', foldTypeId] as const,
  },
  foldTypeSimTypeRels: {
    all: ['foldTypeSimTypeRels'] as const,
    list: () => [...queryKeys.foldTypeSimTypeRels.all, 'list'] as const,
  },
  careDevices: {
    all: ['careDevices'] as const,
    list: () => [...queryKeys.careDevices.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.careDevices.all, 'detail', id] as const,
  },
  platform: {
    all: ['platform'] as const,
    bootstrap: () => [...queryKeys.platform.all, 'bootstrap'] as const,
    privacyPolicy: () => [...queryKeys.platform.all, 'privacyPolicy'] as const,
    adminContent: () => [...queryKeys.platform.all, 'adminContent'] as const,
    analyticsSummary: (days: number) =>
      [...queryKeys.platform.all, 'analytics', 'summary', days] as const,
    analyticsFeatures: (days: number) =>
      [...queryKeys.platform.all, 'analytics', 'features', days] as const,
    analyticsFunnels: (days: number) =>
      [...queryKeys.platform.all, 'analytics', 'funnels', days] as const,
    analyticsFailures: (days: number) =>
      [...queryKeys.platform.all, 'analytics', 'failures', days] as const,
    analyticsAll: () => [...queryKeys.platform.all, 'analytics'] as const,
  },
} as const;
