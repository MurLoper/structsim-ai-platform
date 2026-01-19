# 前端技术升级路线图

## 1. 升级背景

### 1.1 当前技术栈

| 技术         | 版本   | 用途        | 状态    |
| ------------ | ------ | ----------- | ------- |
| React        | 19.2.0 | UI 框架     | ✅ 已有 |
| TypeScript   | 5.8    | 类型安全    | ✅ 已有 |
| Zustand      | 5.0.0  | 状态管理    | ✅ 已有 |
| Axios        | 1.7.0  | HTTP 客户端 | ✅ 已有 |
| Recharts     | 3.6.0  | 图表        | ✅ 已有 |
| TailwindCSS  | 3.4.0  | 样式        | ✅ 已有 |
| React Router | 7.12.0 | 路由        | ✅ 已有 |
| i18next      | -      | 国际化      | ✅ 已有 |

### 1.2 当前痛点

| 问题           | 描述                         | 影响                   |
| -------------- | ---------------------------- | ---------------------- |
| 服务端状态分散 | API 数据缓存逻辑手动管理     | 重复请求、状态同步困难 |
| 表单管理繁琐   | 自定义 useFormState 功能有限 | 复杂表单开发效率低     |
| 大数据性能     | 列表渲染无虚拟化             | 几千条数据卡顿         |
| 图表性能       | Recharts 大数据量渲染慢      | 2万数据点体验差        |
| 测试覆盖为零   | 无单元测试基础设施           | 代码质量无保障         |
| 错误监控缺失   | 生产环境错误无感知           | 问题发现滞后           |

### 1.3 升级目标

- 引入专业化工具链，提升开发效率
- 建立测试体系，保证代码质量
- 优化性能，支持海量数据场景
- 完善监控，及时发现生产问题

---

## 2. 技术选型方案

### 2.1 TanStack Query v5 (服务端状态)

**为什么选择**:

- 自动缓存、后台刷新、请求去重
- 内置 loading/error 状态管理
- DevTools 支持
- React 19 完美兼容

**与 Zustand 共存策略**:

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

**代码示例**:

```typescript
// queries/useProjects.ts
export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => configApi.getProjects(),
    staleTime: 5 * 60 * 1000,  // 5分钟后过期
  });
};

// 组件使用
const ProjectList = () => {
  const { data, isLoading, error } = useProjects();

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;

  return <Table data={data} />;
};
```

### 2.2 React Hook Form + Zod (表单)

**为什么选择**:

- 非受控组件，高性能
- Schema 驱动验证
- TypeScript 类型安全
- 与 Zod 完美集成

**代码示例**:

```typescript
// schemas/configSchema.ts
const projectSchema = z.object({
  name: z.string().min(1, '名称必填').max(100),
  code: z.string().regex(/^[A-Z0-9_]+$/, '只允许大写字母、数字、下划线'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

type ProjectForm = z.infer<typeof projectSchema>;

// 组件使用
const ProjectForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('name')} error={errors.name?.message} />
      <Input {...register('code')} error={errors.code?.message} />
      <Button type="submit">提交</Button>
    </form>
  );
};
```

### 2.3 TanStack Table + Virtual (表格)

**为什么选择**:

- Headless UI，完全自定义样式
- 功能丰富：排序、筛选、分页、行选择
- TanStack Virtual 支持虚拟滚动
- TypeScript 类型安全

**代码示例**:

```typescript
// 虚拟化表格
const VirtualTable = ({ data }) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const { rows } = table.getRowModel();
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableRef.current,
    estimateSize: () => 50,
    overscan: 10,
  });

  return (
    <div ref={tableRef} style={{ height: 500, overflow: 'auto' }}>
      {virtualizer.getVirtualItems().map(virtualRow => (
        <TableRow key={virtualRow.key} row={rows[virtualRow.index]} />
      ))}
    </div>
  );
};
```

### 2.4 ECharts (图表)

**为什么选择**:

- 大数据量支持 (10万+数据点)
- 丰富的图表类型
- 交互能力强
- 国内生态好

**替代 Recharts 原因**:

| 指标          | Recharts | ECharts            |
| ------------- | -------- | ------------------ |
| 2万数据点渲染 | 卡顿明显 | 流畅               |
| 图表类型      | 基础类型 | 非常丰富           |
| 交互功能      | 有限     | 强大               |
| 包体积        | 较小     | 较大(支持按需加载) |

**代码示例**:

```typescript
import ReactECharts from 'echarts-for-react';

const ResultChart = ({ data }) => {
  const option = {
    xAxis: { type: 'category', data: data.map(d => d.time) },
    yAxis: { type: 'value' },
    series: [{
      data: data.map(d => d.value),
      type: 'line',
      smooth: true,
      sampling: 'lttb',  // 大数据降采样
    }],
    dataZoom: [{ type: 'inside' }],  // 缩放
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
};
```

### 2.5 Vitest + React Testing Library (测试)

**为什么选择**:

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

## 3. 统一里程碑映射

### M1: 性能与体验基线

- TanStack Query 接入与迁移
- TanStack Table + Virtual（大列表虚拟化）
- ECharts 替换关键图表
- 性能采样与基线验证（Lighthouse）

### M2: 体验与核心功能闭环

- React Hook Form + Zod（提单表单升级）
- 表单交互优化（校验、跳转定位、错误提示）

### M3: 稳定性与文档完备

- Vitest + React Testing Library
- Sentry + Error Boundary

### M4: 生产就绪

- 依赖体积优化与按需加载（按发布需要）

---

## 4. 依赖安装命令（按里程碑）

### 4.1 M1: 性能与体验基线

```bash
# TanStack Query
npm install @tanstack/react-query @tanstack/react-query-devtools

# TanStack Table + Virtual
npm install @tanstack/react-table @tanstack/react-virtual

# ECharts
npm install echarts echarts-for-react
```

### 4.2 M2: 体验与核心功能闭环

```bash
# React Hook Form + Zod
npm install react-hook-form zod @hookform/resolvers
```

### 4.3 M3: 稳定性与文档完备

```bash
# Vitest + RTL
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @vitest/coverage-v8 jsdom

# Sentry
npm install @sentry/react
```

### 4.4 完整安装（一次性）

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools \
  react-hook-form zod @hookform/resolvers \
  @tanstack/react-table @tanstack/react-virtual \
  echarts echarts-for-react \
  @sentry/react

npm install -D vitest @testing-library/react @testing-library/jest-dom \
  @vitest/coverage-v8 jsdom
```

---

## 5. 配置文件模板

### 5.1 vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 5.2 src/test/setup.ts

```typescript
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

### 5.3 src/lib/queryClient.ts

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟
      gcTime: 30 * 60 * 1000, // 30分钟
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

---

## 6. 验收标准（前端升级）

### 6.1 M1 验收

- [ ] TanStack Query DevTools 可见
- [ ] 大列表 (1000 条) 虚拟滚动流畅
- [ ] 结果页图表 2 万数据点渲染流畅
- [ ] Lighthouse 性能评分 >= 85

### 6.2 M2 验收

- [ ] 提单表单使用 React Hook Form
- [ ] Zod 验证错误正确显示
- [ ] 关键交互（跳转定位、实时校验、错误提示）可用

### 6.3 M3 验收

- [ ] Vitest 测试运行通过
- [ ] 前端测试覆盖率 >= 50%
- [ ] Sentry 错误上报正常

---

## 7. 相关文档

- [前端架构设计](./ARCHITECTURE.md)
- [代码规范](../development/CODE_STANDARDS.md)
- [React 19.2 升级指南](../best-practices/react-19.2-upgrade-guide.md)

---

**最后更新**: 2026-01-19
