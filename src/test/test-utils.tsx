/**
 * 测试工具函数
 *
 * 提供带 Providers 的渲染函数和其他测试辅助工具
 */
import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';

// ============================================================
// 类型定义
// ============================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** 初始路由路径 */
  initialEntries?: MemoryRouterProps['initialEntries'];
  /** QueryClient 实例（可选，默认创建新实例） */
  queryClient?: QueryClient;
  /** 是否包含路由 */
  withRouter?: boolean;
}

// ============================================================
// 创建测试用 QueryClient
// ============================================================

/**
 * 创建测试专用的 QueryClient
 * 关闭重试和缓存，确保测试隔离
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// ============================================================
// Provider 包装器
// ============================================================

interface AllProvidersProps {
  children: React.ReactNode;
  queryClient: QueryClient;
  initialEntries?: MemoryRouterProps['initialEntries'];
  withRouter?: boolean;
}

function AllProviders({
  children,
  queryClient,
  initialEntries = ['/'],
  withRouter = true,
}: AllProvidersProps) {
  const content = <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

  if (withRouter) {
    return <MemoryRouter initialEntries={initialEntries}>{content}</MemoryRouter>;
  }

  return content;
}

// ============================================================
// 自定义渲染函数
// ============================================================

/**
 * 带 Providers 的渲染函数
 *
 * @example
 * ```tsx
 * const { getByText } = renderWithProviders(<MyComponent />);
 * expect(getByText('Hello')).toBeInTheDocument();
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    initialEntries = ['/'],
    queryClient = createTestQueryClient(),
    withRouter = true,
    ...renderOptions
  }: CustomRenderOptions = {}
): RenderResult & { queryClient: QueryClient } {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AllProviders
        queryClient={queryClient}
        initialEntries={initialEntries}
        withRouter={withRouter}
      >
        {children}
      </AllProviders>
    );
  }

  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 等待指定毫秒数
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 创建 Mock 函数并返回类型安全的版本
 */
export function createMockFn<T extends (...args: never[]) => unknown>() {
  return vi.fn() as unknown as T;
}

/**
 * 生成随机测试 ID
 */
export function generateTestId(): number {
  return Math.floor(Math.random() * 10000) + 1;
}

/**
 * 创建 Mock API 响应
 */
export function createMockResponse<T>(data: T, status = 200) {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {},
    config: {},
  };
}

// ============================================================
// Mock 数据工厂
// ============================================================

/**
 * 创建 Mock 项目数据
 */
export function createMockProject(overrides = {}) {
  return {
    id: generateTestId(),
    name: `Test Project ${Date.now()}`,
    code: `PROJ_${Date.now()}`,
    description: 'Test project description',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * 创建 Mock 仿真类型数据
 */
export function createMockSimType(overrides = {}) {
  return {
    id: generateTestId(),
    name: `SimType ${Date.now()}`,
    code: `ST_${Date.now()}`,
    description: 'Test simulation type',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * 创建 Mock 用户数据
 */
export function createMockUser(overrides = {}) {
  return {
    id: generateTestId(),
    username: `user_${Date.now()}`,
    email: `user_${Date.now()}@test.com`,
    role: 'user',
    permissions: ['VIEW_DASHBOARD', 'VIEW_CONFIG'],
    ...overrides,
  };
}

// 导出 vi 供测试文件使用
export { vi } from 'vitest';

// 重新导出 testing-library 的所有内容
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
