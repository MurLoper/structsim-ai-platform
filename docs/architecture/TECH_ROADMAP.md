# 前端技术升级路线图

> **版本**: v2.0
> **最后更新**: 2025-01-19
> **状态**: ✅ 升级已完成

## 1. 升级概述

### 1.1 升级完成状态

| 技术 | 版本 | 用途 | 状态 |
|------|------|------|------|
| React | 19.2.0 | UI 框架 | ✅ 已升级 |
| TypeScript | 5.8 | 类型安全 | ✅ 已有 |
| Zustand | 5.0.0 | 客户端状态 | ✅ 已有 |
| **TanStack Query** | **5.60.0** | **服务端状态** | ✅ **已实现** |
| **React Hook Form** | **7.53.0** | **表单管理** | ✅ **已实现** |
| **Zod** | **3.23.0** | **Schema验证** | ✅ **已实现** |
| **TanStack Table** | **8.20.0** | **表格** | ✅ **已实现** |
| **TanStack Virtual** | **3.10.0** | **虚拟滚动** | ✅ **已实现** |
| **ECharts** | **5.5.0** | **图表** | ✅ **已实现** |
| **React Flow** | **12.3.0** | **流程画布** | ✅ **已实现** |
| **Vitest** | **2.1.0** | **单元测试** | ✅ **已实现** |
| **Sentry** | **8.0.0** | **错误监控** | ✅ **已实现** |
| Tailwind CSS | 3.4.0 | 样式 | ✅ 已有 |
| React Router | 7.12.0 | 路由 | ✅ 已有 |
| Axios | 1.7.0 | HTTP 客户端 | ✅ 已有 |
| **Shadcn/ui** | **-** | **UI组件库** | ✅ **已实现** |
| **Lucide React** | **0.460.0** | **图标库** | ✅ **已实现** |
| **Framer Motion** | **11.12.0** | **动画库** | ✅ **已实现** |

### 1.2 已解决的痛点

| 问题 | 解决方案 | 状态 |
|------|----------|------|
| 服务端状态分散 | TanStack Query 自动缓存 | ✅ 已解决 |
| 表单管理繁琐 | React Hook Form + Zod | ✅ 已解决 |
| 大数据性能 | TanStack Virtual 虚拟滚动 | ✅ 已解决 |
| 图表性能 | ECharts 替代 Recharts | ✅ 已解决 |
| 测试覆盖为零 | Vitest + Testing Library | ✅ 已解决 |
| 错误监控缺失 | Sentry 集成 | ✅ 已解决 |

---

## 2. 技术实现详情

### 2.1 TanStack Query v5 (服务端状态) ✅

**实现位置**: `src/features/config/queries/`

**状态管理策略**:

```text
┌────────────────────────────────────────────────────┐
│                    状态管理策略                      │
├────────────────────────────────────────────────────┤
│  TanStack Query          │  Zustand                │
│  (服务端状态)             │  (客户端状态)            │
├────────────────────────────────────────────────────┤
│  - 项目列表               │  - 主题设置              │
│  - 配置数据               │  - 语言偏好              │
│  - 订单数据               │  - 侧边栏状态            │
│  - 用户信息               │  - 模态框状态            │
└────────────────────────────────────────────────────┘
```

**已实现的 Query Hooks**:
- `useProjects` / `useCreateProject` / `useUpdateProject` / `useDeleteProject`
- `useSimTypes` / `useCreateSimType` / `useUpdateSimType` / `useDeleteSimType`
- `useParamDefs` / `useSolvers` / `useConditionDefs` / `useOutputDefs` / `useFoldTypes`
- `useCompositeConfigs` (参数组合、工况输出组合)
- `useOrders`

**代码示例**:

```typescript
// features/config/queries/useProjects.ts
export const useProjects = () => {
  return useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: async () => {
      const response = await baseConfigApi.getProjects();
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: baseConfigApi.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
};
```

### 2.2 React Hook Form + Zod (表单) ✅

**实现位置**: `src/features/config/schemas/`

**已实现的 Schemas**:
- `projectSchema`
- `simTypeSchema`
- `paramDefSchema`
- `solverSchema`
- `conditionDefSchema`
- `outputDefSchema`
- `foldTypeSchema`

**代码示例**:

```typescript
// features/config/schemas/project.schema.ts
import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().min(1, '项目名称必填').max(100),
  code: z.string().max(50).optional(),
  defaultSimTypeId: z.number().positive().optional(),
  defaultSolverId: z.number().positive().optional(),
  remark: z.string().optional(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;
```

### 2.3 TanStack Table + Virtual (表格) ✅

**实现位置**: `src/components/tables/`

**特性**:
- 虚拟滚动支持 2万+ 行数据
- 列排序、筛选
- 行选择
- 自定义渲染

### 2.4 ECharts (图表) ✅

**实现位置**: `src/components/charts/`

**替代 Recharts 原因**:

| 指标 | Recharts | ECharts |
|------|----------|---------|
| 2万数据点渲染 | 卡顿明显 | 流畅 |
| 图表类型 | 基础类型 | 非常丰富 |
| 交互功能 | 有限 | 强大 |

### 2.5 Vitest + Testing Library (测试) ✅

**测试覆盖**:
- 20 个测试文件
- 139 个测试用例
- 100% 通过率

**测试分类**:
- API Client 测试
- Hooks 测试 (useFormState, useTheme, useStableCallback)
- Stores 测试 (authStore, uiStore, configStore)
- UI 组件测试 (Button, Input, Modal, Table, etc.)
- Query Hooks 测试 (useProjects, useSimTypes, useOrders)

### 2.6 Sentry (错误监控) ✅

**实现位置**: `src/lib/sentry.ts`

**功能**:
- 生产环境错误自动上报
- 用户行为追踪
- 性能监控

- Vite 原生支持，速度快
- 与 Jest API 兼容
- React Testing Library 最佳实践
- 内置覆盖率报告

**测试策略**:

| 测试类型 | 工具              | 覆盖范围     |
| -------- | ----------------- | ------------ |
| 单元测试 | Vitest            | Hooks, Utils |
| 组件测试 | RTL + Vitest      | UI 组件      |
| 集成测试 | Vitest + MSW      | API 交互     |
| E2E 测试 | Playwright (可选) | 关键流程     |

**代码示例**:

```typescript
// __tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../components/ui/Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('handles click events', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

### 2.6 Sentry (错误监控)

**为什么选择**:

- 实时错误监控
- 详细错误堆栈
- 性能监控
- 用户会话回放

**集成示例**:

```typescript
// main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
});

// Error Boundary 集成
const SentryErrorBoundary = Sentry.withErrorBoundary(App, {
  fallback: <ErrorFallback />,
});
```

### 2.7 React Flow (流程图) - P3

**用途**:

- 工作流可视化
- 状态流转图
- 配置关系图

**计划在后期需要时引入**

---

## 3. 里程碑完成状态

### M1: 性能与体验基线 ✅ 已完成

- ✅ TanStack Query 接入与迁移
- ✅ TanStack Table + Virtual（大列表虚拟化）
- ✅ ECharts 替换关键图表
- ✅ React Flow 流程画布集成

### M2: 体验与核心功能闭环 ✅ 已完成

- ✅ React Hook Form + Zod（表单升级）
- ✅ 表单交互优化（校验、错误提示）
- ✅ 三主题系统（亮色/暗色/护眼）

### M3: 稳定性与文档完备 ✅ 已完成

- ✅ Vitest + React Testing Library (139个测试用例)
- ✅ Sentry 错误监控集成
- ✅ 文档更新完善

### M4: 生产就绪 🔄 进行中

- 🔄 依赖体积优化与按需加载
- ⏳ 性能基线验证（Lighthouse）
- ⏳ E2E 测试（Playwright）

---

## 4. 已安装依赖

### 核心依赖 (dependencies)

```json
{
  "@hookform/resolvers": "^3.9.0",
  "@radix-ui/react-slot": "^1.1.0",
  "@sentry/react": "^8.0.0",
  "@tanstack/react-query": "^5.60.0",
  "@tanstack/react-query-devtools": "^5.60.0",
  "@tanstack/react-table": "^8.20.0",
  "@tanstack/react-virtual": "^3.10.0",
  "@xyflow/react": "^12.3.0",
  "axios": "^1.7.0",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.0",
  "echarts": "^5.5.0",
  "echarts-for-react": "^3.0.0",
  "framer-motion": "^11.12.0",
  "lucide-react": "^0.460.0",
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-hook-form": "^7.53.0",
  "react-router-dom": "^7.12.0",
  "recharts": "^3.6.0",
  "tailwind-merge": "^2.5.0",
  "zod": "^3.23.0",
  "zustand": "^5.0.0"
}
```

### 开发依赖 (devDependencies)

```json
{
  "@testing-library/jest-dom": "^6.6.0",
  "@testing-library/react": "^16.0.0",
  "@testing-library/user-event": "^14.5.0",
  "@vitest/coverage-v8": "^2.1.0",
  "msw": "^2.6.0",
  "vitest": "^2.1.0"
}
```

---

## 5. 后续优化方向

### 5.1 性能优化

- [ ] Bundle 分析和优化
- [ ] 图片懒加载
- [ ] 路由预加载
- [ ] Service Worker 缓存

### 5.2 开发体验

- [ ] Storybook 组件文档
- [ ] 更多 E2E 测试
- [ ] CI/CD 集成测试

### 5.3 功能增强

- [ ] 离线支持 (PWA)
- [ ] 实时通知 (WebSocket)
- [ ] 3D 可视化 (Three.js)

---

**最后更新**: 2025-01-19
**维护者**: 前端团队
