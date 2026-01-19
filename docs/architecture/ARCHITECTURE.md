# 前端架构设计文档

## 1. 架构总览

### 1.1 技术栈

| 技术         | 版本   | 用途           |
| ------------ | ------ | -------------- |
| React        | 19.2.0 | UI 框架        |
| TypeScript   | 5.8    | 类型安全       |
| Vite         | 6.2    | 构建工具       |
| TailwindCSS  | 3.4    | 样式系统       |
| Zustand      | 5.0    | 客户端状态管理 |
| Axios        | 1.7    | HTTP 客户端    |
| React Router | 7.12   | 路由管理       |
| Recharts     | 3.6    | 图表可视化     |
| i18next      | -      | 国际化         |

### 1.2 分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Pages (页面层)                        │
│    Dashboard / Submission / Configuration / Results         │
├─────────────────────────────────────────────────────────────┤
│                     Components (组件层)                      │
│         UI Components / Layout / Business Components        │
├─────────────────────────────────────────────────────────────┤
│                       Hooks (逻辑层)                         │
│    useFormState / useConfigurationState / useValidation     │
├─────────────────────────────────────────────────────────────┤
│                       Stores (状态层)                        │
│         authStore / configStore / uiStore / orderStore      │
├─────────────────────────────────────────────────────────────┤
│                        API (数据层)                          │
│            authApi / configApi / orderApi / client          │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 目录结构

```
src/
├── api/                    # API 调用层
│   ├── client.ts           # Axios 客户端配置
│   ├── authApi.ts          # 认证 API
│   ├── configApi.ts        # 配置 API
│   └── orderApi.ts         # 订单 API
│
├── components/             # 组件层
│   ├── ui/                 # 通用 UI 组件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   └── Toast.tsx
│   ├── layout/             # 布局组件
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   └── config/             # 配置业务组件
│       ├── ConfigTable.tsx
│       └── ConfigForm.tsx
│
├── hooks/                  # 自定义 Hooks
│   ├── useFormState.ts     # 表单状态管理
│   ├── useConfigurationState.ts
│   └── useValidation.ts
│
├── pages/                  # 页面组件
│   ├── Dashboard/
│   ├── Submission/
│   ├── Configuration/
│   └── Results/
│
├── stores/                 # Zustand 状态管理
│   ├── authStore.ts        # 认证状态
│   ├── configStore.ts      # 配置状态
│   └── uiStore.ts          # UI 状态
│
├── types/                  # TypeScript 类型定义
│   ├── api.ts
│   ├── config.ts
│   └── order.ts
│
├── locales/                # 国际化文件
│   ├── en/
│   └── zh/
│
├── constants/              # 常量定义
│   └── config.ts
│
├── utils/                  # 工具函数
│   └── helpers.ts
│
├── App.tsx                 # 应用入口
├── main.tsx                # 渲染入口
└── router.tsx              # 路由配置
```

---

## 2. 状态管理架构

### 2.1 当前方案：Zustand + Axios

**职责划分**:

- **Zustand Store**: 管理所有状态（客户端状态 + 服务端缓存数据）
- **Axios API**: 纯粹的 HTTP 请求封装

**数据流**:

```
Component -> Store Action -> API Call -> Store State Update -> Component Re-render
```

**代码示例**:

```typescript
// stores/configStore.ts
export const useConfigStore = create<ConfigState>((set, get) => ({
  projects: [],
  loading: false,

  fetchProjects: async () => {
    set({ loading: true });
    const data = await configApi.getProjects();
    set({ projects: data, loading: false });
  },
}));
```

### 2.2 升级方案：TanStack Query + Zustand

**职责划分**:

| 状态类型   | 管理工具        | 示例                         |
| ---------- | --------------- | ---------------------------- |
| 服务端状态 | TanStack Query  | 项目列表、配置数据、订单数据 |
| 客户端状态 | Zustand         | 主题、语言、侧边栏展开状态   |
| 表单状态   | React Hook Form | 提单表单、配置编辑表单       |

**升级后数据流**:

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

---

## 3. 数据流架构

### 3.1 请求数据流

**当前方案**:

```
Component -> useStore().fetchData() -> api.getData() -> setState() -> Re-render
```

**升级方案**:

```
Component -> useQuery({ queryFn: api.getData }) -> 自动缓存 -> Re-render
```

### 3.2 表单数据流

**当前方案**:

```
User Input -> useState/useFormState -> 手动验证 -> API Submit
```

**升级方案**:

```
User Input -> React Hook Form -> Zod Schema 验证 -> API Submit
                    ↓
              非受控组件 (高性能)
```

### 3.3 API 响应格式

```typescript
interface ApiResponse<T> {
  code: number; // 0 成功, 其他失败
  msg: string; // 提示信息
  data: T; // 响应数据
  trace_id: string; // 追踪ID
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
