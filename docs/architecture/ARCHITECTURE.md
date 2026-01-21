# 前端架构设计文档

> **版本**: v2.0
> **最后更新**: 2025-01-19
> **状态**: ✅ 生产就绪

## 1. 架构总览

### 1.1 技术栈

#### 核心框架
| 技术 | 版本 | 用途 | 状态 |
|------|------|------|------|
| React | 19.2.0 | UI 框架 | ✅ |
| TypeScript | 5.8 | 类型安全 | ✅ |
| Vite | 6.2 | 构建工具 | ✅ |

#### 状态管理
| 技术 | 版本 | 用途 | 状态 |
|------|------|------|------|
| Zustand | 5.0 | 客户端状态 | ✅ |
| TanStack Query | 5.60 | 服务端状态 | ✅ |

#### UI 与样式
| 技术 | 版本 | 用途 | 状态 |
|------|------|------|------|
| Tailwind CSS | 3.4 | 样式框架 | ✅ |
| Shadcn/ui | - | 基础组件库 (Radix UI) | ✅ |
| Lucide React | 0.460 | 图标库 | ✅ |
| Framer Motion | 11.12 | 动画库 | ✅ |
| class-variance-authority | 0.7 | 组件变体 | ✅ |

#### 表单与验证
| 技术 | 版本 | 用途 | 状态 |
|------|------|------|------|
| React Hook Form | 7.53 | 表单管理 | ✅ |
| Zod | 3.23 | Schema 验证 | ✅ |
| @hookform/resolvers | 3.9 | RHF + Zod 集成 | ✅ |

#### 数据可视化
| 技术 | 版本 | 用途 | 状态 |
|------|------|------|------|
| ECharts | 5.5 | 2D 图表 | ✅ |
| echarts-for-react | 3.0 | ECharts React 封装 | ✅ |
| Recharts | 3.6 | 简单图表 | ✅ |
| React Flow (@xyflow/react) | 12.3 | 流程图/画布 | ✅ |

#### 表格与虚拟化
| 技术 | 版本 | 用途 | 状态 |
|------|------|------|------|
| TanStack Table | 8.20 | 表格管理 | ✅ |
| TanStack Virtual | 3.10 | 虚拟滚动 | ✅ |

#### 路由与网络
| 技术 | 版本 | 用途 | 状态 |
|------|------|------|------|
| React Router | 7.12 | 路由管理 | ✅ |
| Axios | 1.7 | HTTP 客户端 | ✅ |

#### 监控与质量
| 技术 | 版本 | 用途 | 状态 |
|------|------|------|------|
| Sentry | 8.0 | 错误监控 | ✅ |
| Vitest | 2.1 | 单元测试 | ✅ |
| Testing Library | 16.0 | 组件测试 | ✅ |
| MSW | 2.6 | API Mock | ✅ |

### 1.2 分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Pages (页面层)                        │
│    Dashboard / Submission / Configuration / Access          │
├─────────────────────────────────────────────────────────────┤
│                     Features (功能模块)                      │
│      config/queries / config/schemas / orders/queries       │
├─────────────────────────────────────────────────────────────┤
│                     Components (组件层)                      │
│    UI (Shadcn) / Layout / Forms / Tables / Charts          │
├─────────────────────────────────────────────────────────────┤
│                       Hooks (逻辑层)                         │
│   useFormState / useTheme / useStableCallback              │
├─────────────────────────────────────────────────────────────┤
│                       Stores (状态层)                        │
│         authStore / configStore / uiStore                   │
├─────────────────────────────────────────────────────────────┤
│                        API (数据层)                          │
│      client / auth / config / orders / rbac                 │
├─────────────────────────────────────────────────────────────┤
│                        Lib (基础设施)                        │
│         queryClient / sentry / utils                        │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 目录结构

```
src/
├── app/                        # 应用配置层
│   ├── providers/              # 全局 Providers
│   │   ├── index.tsx           # Provider 组合
│   │   └── ThemeProvider.tsx   # 主题 Provider
│   └── router/                 # 路由配置
│       ├── config.tsx          # 路由配置
│       ├── guards/             # 路由守卫
│       ├── layouts/            # 路由布局
│       └── routes/             # 路由定义
│
├── api/                        # API 调用层
│   ├── client.ts               # Axios 客户端配置
│   ├── auth.ts                 # 认证 API
│   ├── projects.ts             # 项目 API
│   ├── orders.ts               # 订单 API
│   ├── rbac.ts                 # 权限 API
│   ├── simulations.ts          # 仿真 API
│   └── config/                 # 配置 API 模块
│       ├── base.ts             # 基础配置 API
│       ├── groups.ts           # 组合配置 API
│       └── index.ts
│
├── components/                 # 组件层
│   ├── ui/                     # 通用 UI 组件 (Shadcn/ui 风格)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── Tabs.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Toast.tsx
│   │   ├── Loading.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── ThemeSwitcher.tsx
│   │   └── index.ts
│   ├── layout/                 # 布局组件
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── forms/                  # 表单组件
│   ├── tables/                 # 表格组件
│   ├── charts/                 # 图表组件
│   └── access/                 # 权限组件
│
├── features/                   # 功能模块 (Feature-based)
│   ├── config/                 # 配置管理功能
│   │   ├── queries/            # TanStack Query Hooks
│   │   │   ├── useProjects.ts
│   │   │   ├── useSimTypes.ts
│   │   │   ├── useParamDefs.ts
│   │   │   ├── useSolvers.ts
│   │   │   ├── useConditionDefs.ts
│   │   │   ├── useOutputDefs.ts
│   │   │   ├── useFoldTypes.ts
│   │   │   ├── useCompositeConfigs.ts
│   │   │   └── index.ts
│   │   └── schemas/            # Zod 验证 Schemas
│   │       ├── project.schema.ts
│   │       ├── simType.schema.ts
│   │       ├── paramDef.schema.ts
│   │       ├── solver.schema.ts
│   │       ├── conditionDef.schema.ts
│   │       ├── outputDef.schema.ts
│   │       ├── foldType.schema.ts
│   │       └── index.ts
│   ├── orders/                 # 订单功能
│   │   └── queries/
│   └── canvas/                 # 画布功能 (React Flow)
│       └── components/
│
├── hooks/                      # 自定义 Hooks
│   ├── useFormState.ts         # 通用表单状态管理
│   ├── useTheme.ts             # 主题管理
│   └── useStableCallback.ts    # 稳定回调 (解决闭包问题)
│
├── pages/                      # 页面组件
│   ├── auth/                   # 认证页面
│   │   └── Login.tsx
│   ├── dashboard/              # 仪表盘
│   │   └── Dashboard.tsx
│   ├── configuration/          # 配置管理
│   │   ├── Configuration.tsx
│   │   └── hooks/
│   │       └── useConfigurationState.ts
│   ├── submission/             # 申请单
│   │   └── Submission.tsx
│   └── access/                 # 权限管理
│       └── AccessManagement.tsx
│
├── stores/                     # Zustand 状态管理
│   ├── authStore.ts            # 认证状态
│   ├── configStore.ts          # 配置状态 (迁移中)
│   ├── uiStore.ts              # UI 状态 (主题/侧边栏)
│   └── index.ts
│
├── types/                      # TypeScript 类型定义
│   ├── index.ts                # 类型导出
│   ├── config.ts               # 配置类型
│   ├── configGroups.ts         # 配置组合类型
│   ├── simulation.ts           # 仿真类型
│   ├── order.ts                # 订单类型
│   ├── user.ts                 # 用户类型
│   ├── process.ts              # 流程类型
│   └── enums.ts                # 枚举类型
│
├── lib/                        # 库配置
│   ├── queryClient.ts          # TanStack Query 配置
│   ├── sentry.ts               # Sentry 配置
│   └── utils.ts                # 工具函数 (cn, etc.)
│
├── locales/                    # 国际化
│   ├── index.ts
│   └── modules/
│       ├── common.ts
│       └── config.ts
│
├── constants/                  # 常量定义
│   ├── index.ts
│   ├── common.ts
│   └── submission/
│
├── styles/                     # 样式文件
│   └── themes.css              # 主题 CSS 变量
│
├── test/                       # 测试配置
│   ├── setup.ts
│   └── test-utils.tsx
│
├── routes/                     # 路由入口
│   └── index.tsx
│
├── App.tsx                     # 应用入口
├── main.tsx                    # 渲染入口
└── index.css                   # 全局样式
```

---

## 2. 状态管理架构

### 2.1 当前方案：TanStack Query + Zustand + React Hook Form

**职责划分**:

| 状态类型 | 管理工具 | 示例 | 状态 |
|----------|----------|------|------|
| 服务端状态 | TanStack Query | 项目列表、配置数据、订单数据 | ✅ 已实现 |
| 客户端状态 | Zustand | 主题、语言、侧边栏展开状态 | ✅ 已实现 |
| 表单状态 | React Hook Form + Zod | 提单表单、配置编辑表单 | ✅ 已实现 |

**数据流**:

```
┌──────────────────────────────────────────────────────────────┐
│                        Component                              │
├──────────────────────────────────────────────────────────────┤
│  useQuery (服务端数据)  │  useStore (客户端状态)  │  useForm  │
├──────────────────────────────────────────────────────────────┤
│      TanStack Query     │       Zustand          │  RHF+Zod  │
│  (自动缓存/后台刷新)     │    (UI状态/偏好)        │  (表单)   │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 TanStack Query 使用示例

```typescript
// features/config/queries/useProjects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { baseConfigApi } from '@/api/config/base';
import { queryKeys } from '@/lib/queryClient';

// 查询 Hook
export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: async () => {
      const response = await baseConfigApi.getProjects();
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5分钟
  });
}

// 变更 Hook
export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: baseConfigApi.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}
```

### 2.3 Zustand Store 使用示例

```typescript
// stores/uiStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'eyecare';

interface UiState {
  theme: Theme;
  sidebarCollapsed: boolean;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarCollapsed: false,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: 'ui-storage' }
  )
);
```

### 2.4 React Hook Form + Zod 使用示例

```typescript
// features/config/schemas/project.schema.ts
import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().min(1, '项目名称必填').max(100),
  code: z.string().max(50).optional(),
  defaultSimTypeId: z.number().positive().optional(),
  remark: z.string().optional(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

// 组件中使用
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm<ProjectFormData>({
  resolver: zodResolver(projectSchema),
  defaultValues: { name: '', code: '' },
});
```

---

## 3. 数据流架构

### 3.1 服务端数据流 (TanStack Query)

```
Component
    ↓
useQuery({ queryKey, queryFn })
    ↓
TanStack Query Cache (自动管理)
    ↓
API 请求 (Axios)
    ↓
后端响应
    ↓
缓存更新 → 组件重渲染
```

### 3.2 表单数据流 (React Hook Form)

```
用户输入
    ↓
React Hook Form (非受控组件)
    ↓
Zod Schema 验证
    ↓
useMutation 提交
    ↓
invalidateQueries 刷新列表
```

### 3.3 API 响应格式

```typescript
interface ApiResponse<T> {
  code: number;      // 0 成功, 其他失败
  msg: string;       // 提示信息
  data: T;           // 响应数据
  trace_id: string;  // 追踪ID
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}
```

---

## 4. 组件架构

### 4.1 组件分类

| 类型     | 目录                 | 描述                 | 示例                    |
| -------- | -------------------- | -------------------- | ----------------------- |
| UI 组件  | `components/ui/`     | 无业务逻辑的通用组件 | Button, Modal, Table    |
| 布局组件 | `components/layout/` | 页面布局相关         | Layout, Sidebar, Header |
| 业务组件 | `components/config/` | 特定业务功能         | ConfigTable, ConfigForm |
| 页面组件 | `pages/`             | 路由对应的页面       | Dashboard, Submission   |

### 4.2 组件规范

**文件大小限制** (参考 CODE_STANDARDS.md):

- 逻辑层 Hooks: ≤150 行
- UI 组件: ≤300 行
- 页面组件: ≤600 行
- 函数: ≤60 行

**Props 规范**:

- Props 数量: ≤12 个
- 必须定义 TypeScript 类型
- 使用解构参数

**State 规范**:

- 单组件 State 数量: ≤8 个
- 复杂状态提升到 Store

---

## 5. 路由架构

### 5.1 路由结构

```typescript
const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'submission', element: <Submission /> },
      { path: 'orders', element: <OrderList /> },
      { path: 'orders/:id', element: <OrderDetail /> },
      { path: 'results/:id', element: <Results /> },
      {
        path: 'configuration',
        children: [
          { path: 'basic/:type', element: <BasicConfig /> },
          { path: 'composite/:type', element: <CompositeConfig /> },
          { path: 'relations/:type', element: <RelationConfig /> },
        ]
      },
      { path: 'admin/*', element: <AdminRoutes /> },
    ]
  },
  { path: '/login', element: <Login /> },
];
```

### 5.2 路由懒加载

```typescript
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Submission = lazy(() => import('./pages/Submission'));
const Configuration = lazy(() => import('./pages/Configuration'));
```

### 5.3 权限路由保护

```typescript
const ProtectedRoute = ({ children, requiredPermission }) => {
  const { user, hasPermission } = useAuthStore();

  if (!user) return <Navigate to="/login" />;
  if (!hasPermission(requiredPermission)) return <NoPermission />;

  return children;
};
```

---

## 6. 错误处理

### 6.1 API 错误处理

```typescript
// api/client.ts
client.interceptors.response.use(
  response => response,
  error => {
    const { code, msg } = error.response?.data || {};

    if (code === 401001) {
      // Token 过期，尝试刷新
      return refreshTokenAndRetry(error.config);
    }

    // 显示错误提示
    toast.error(msg || '请求失败');
    return Promise.reject(error);
  }
);
```

### 6.2 Error Boundary

```typescript
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // 上报错误到 Sentry (计划)
    console.error('Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### 6.3 错误码处理

| 错误码范围 | 描述       | 处理方式     |
| ---------- | ---------- | ------------ |
| 400xxx     | 参数错误   | 表单提示     |
| 401xxx     | 认证错误   | 跳转登录     |
| 403xxx     | 权限错误   | 无权限页面   |
| 404xxx     | 资源不存在 | 404 页面     |
| 500xxx     | 服务器错误 | 通用错误提示 |

---

## 7. 性能优化

### 7.1 代码分割

- 路由级别懒加载
- 大型组件动态导入
- 第三方库按需加载

### 7.2 虚拟滚动 (计划)

```typescript
// 使用 TanStack Virtual 处理大数据列表
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualList = ({ items }) => {
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });
  // ...
};
```

### 7.3 缓存策略

**TanStack Query 缓存配置** (计划):

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟后数据过期
      gcTime: 30 * 60 * 1000, // 30分钟后垃圾回收
      refetchOnWindowFocus: false,
    },
  },
});
```

### 7.4 渲染优化

- 使用 `React.memo` 避免不必要渲染
- 使用 `useMemo` / `useCallback` 缓存计算结果和回调
- 避免在渲染函数中创建对象/数组

---

## 8. 相关文档

- [代码规范](../development/CODE_STANDARDS.md)
- [配置化指南](../development/CONFIGURATION_GUIDE.md)
- [常量管理](../development/CONSTANTS_MANAGEMENT.md)
- [技术升级路线图](./TECH_ROADMAP.md)
- [React 闭包陷阱](../best-practices/react-closure-trap.md)
- [React 19.2 升级指南](../best-practices/react-19.2-upgrade-guide.md)

---

**最后更新**: 2024-01-18
