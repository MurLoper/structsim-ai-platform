# 代码规范标准

适用范围：`structsim-ai-platform` 前端项目（React + TypeScript + Tailwind）。

目标：

- 保持页面交互稳定，不因重构或修警告引入行为变化。
- 控制文件复杂度，避免“大组件 + 大页面 + 大 Hook”继续膨胀。
- 统一 Hook、主题、目录和命名约束，让 lint 能真正发挥约束作用。

## 1. 执行优先级

规范冲突时，按以下顺序执行：

1. 正确性
2. 可维护性
3. 一致性
4. 性能优化
5. 代码风格

默认原则：

- 不为了“好看”改变现有业务逻辑。
- 修复 lint、类型或构建问题时，优先做最小改动。
- 非必要不要在同一提交里混入重构、文案调整和功能修改。

## 2. 文件规模阈值

### 2.1 逻辑层

适用目录：`utils/`、`lib/`、`services/`、`hooks/`

| 级别   | 行数   |
| ------ | ------ |
| 建议   | <= 150 |
| 警戒   | > 200  |
| 硬上限 | 300    |

### 2.2 单个函数 / 方法

| 级别   | 行数     |
| ------ | -------- |
| 建议   | <= 40-60 |
| 警戒   | > 80     |
| 硬上限 | 120      |

### 2.3 通用 / 页面级组件

适用目录：`components/`、`pages/**/components/`

| 级别   | 行数       |
| ------ | ---------- |
| 建议   | <= 250-300 |
| 警戒   | > 400      |
| 硬上限 | 600        |

### 2.4 页面入口

适用目录：`pages/`、`views/`

| 级别   | 行数       |
| ------ | ---------- |
| 建议   | <= 400-600 |
| 警戒   | > 800      |
| 硬上限 | 1200       |

说明：

- 超过“警戒”必须在评审中说明原因。
- 超过“硬上限”必须拆分，除非是临时过渡文件，并附后续拆分计划。

## 3. React / Hook 规范

### 3.1 `eslint` 警告视为待修复问题

以下告警默认不允许长期保留：

- `react-hooks/exhaustive-deps`
- `@typescript-eslint/no-unused-vars`
- `react-refresh/only-export-components`

处理原则：

- 优先补全依赖，而不是关闭规则。
- 只有在明确说明原因时，才允许局部 `eslint-disable-next-line`。
- 禁止为了压警告而改动业务行为。

### 3.2 事件函数与闭包

推荐顺序：

1. 事件处理函数优先使用 `useCallback` 或项目内 `useStableCallback`
2. `useEffect` 内部事件回调优先考虑 React 19.2 的 `useEffectEvent`
3. 需要读取最新值但不希望重新创建函数时，使用 `ref + stable callback`

禁止：

- 空依赖数组里直接读取会变化的 `props` / `state`
- 为了“省事”删除依赖项
- 在 `useMemo` / `useEffect` 中引用不稳定函数却不处理依赖

### 3.3 `useEffect` 约束

- `useEffect > 4` 时，优先考虑拆 Hook 或重构数据流
- 拉数、订阅、副作用清理必须职责单一
- 纯派生数据不要放进 `useEffect`，改用 `useMemo`

### 3.4 `useMemo` 约束

仅在以下场景使用：

- 计算量确实大
- 结果对象 / 数组需要稳定引用
- 作为表格列、图数据、树结构的派生结果

不要把 `useMemo` 当作“默认写法”。

## 4. 组件职责规范

### 4.1 单一职责

一个文件最多承担：

- 1 个主职责
- 1 个辅助职责

示例：

- 页面入口负责布局、状态组装、路由参数协调
- 复杂业务逻辑放到 `hooks/`
- API 调用与转换放到 `api/` 或 `features/**/queries/`

### 4.2 页面文件只做 4 件事

- Layout 布局
- 组装子组件
- 连接 store / query
- 处理少量页面级状态

不建议在页面入口中堆积：

- 大量表格列定义
- 多个弹窗表单实现
- 复杂数据归一化
- 多段异步流程控制

## 5. 状态复杂度阈值

### 5.1 State 数量

- `useState + useReducer > 8`：高风险，建议拆分

### 5.2 Props 数量

- 单组件 `props > 12`：提示边界不清晰

### 5.3 圈复杂度

- 核心函数建议控制在 `10-15` 以内

## 6. Tailwind 与主题规范

项目支持三套主题：

- `Light`
- `Dark`
- `Eyecare`

### 6.1 优先使用语义化主题变量

推荐：

- `bg-background` / `text-foreground`
- `bg-card` / `text-card-foreground`
- `bg-muted` / `text-muted-foreground`
- `bg-primary` / `text-primary-foreground`
- `bg-secondary` / `text-secondary-foreground`
- `bg-accent` / `text-accent-foreground`
- `bg-destructive` / `text-destructive-foreground`
- `border-border`
- `border-input`
- `ring-ring`

避免：

- `bg-slate-*`
- `text-gray-*`
- `border-zinc-*`
- 硬编码十六进制颜色
- 只有 `dark:` 没有考虑 `eyecare`

### 6.2 `className` 长度

- 单元素 `className` 超过 160-200 字符时，优先拆成子组件或抽 `cn()`

### 6.3 JSX 嵌套深度

- 嵌套层级超过 6 层时，优先拆组件

## 7. 目录与命名规范

```text
src/
├─ api/                    # API 请求与协议适配
├─ components/             # 通用组件
│  ├─ ui/                  # 基础 UI
│  └─ layout/              # 布局组件
├─ features/               # 按领域组织的 query / mutation / helper
├─ hooks/                  # 通用 Hook
├─ pages/                  # 页面入口
│  └─ [page]/
│     ├─ index.tsx
│     ├─ components/
│     ├─ hooks/
│     └─ types.ts
├─ stores/                 # Zustand 等状态容器
├─ types/                  # 全局类型
├─ utils/                  # 工具函数
└─ locales/                # 国际化
```

命名规则：

- 组件文件：`PascalCase.tsx`
- Hook / 工具：`camelCase.ts`
- 类型文件：`camelCase.ts`
- 页面目录名与路由语义保持一致

## 8. 拆分策略

### 8.1 何时拆组件

- JSX 超过 100 行
- 存在独立交互逻辑
- 可复用于其他页面
- 局部区域已形成独立视觉区块

### 8.2 何时拆 Hook

- 多个 `useEffect` 处理同一业务
- 状态和操作函数已经形成内聚单元
- 同一逻辑在多个页面 / 弹窗复用

### 8.3 何时拆 query / service

- 出现 API 请求拼装
- 返回数据需要统一归一化
- 存在 mock 与正式接口的双态逻辑

## 9. 文档联动要求

以下文档与本规范配套使用：

- [React 闭包陷阱](../best-practices/react-closure-trap.md)
- [React 19.2 升级指南](../best-practices/react-19.2-upgrade-guide.md)
- [配置开发指南](./CONFIGURATION_GUIDE.md)

当出现以下情况时，必须同步更新规范文档：

- 引入新的 Hook 约定
- 引入新的主题变量或 UI 约束
- 增加新的目录分层规则
- 约定“正式接口承载 mock 数据”的实现方式

## 10. 提交前检查清单

- [ ] `npm run lint` 无 warning / error
- [ ] `npm run typecheck` 通过
- [ ] `npm run build` 通过
- [ ] 未引入与任务无关的行为变更
- [ ] 新增文案已考虑主题、可读性和已有术语
- [ ] 超过阈值的文件是否附带拆分计划

## 11. 当前项目特别关注项

当前仓库已出现以下高风险模式，后续优先治理：

- 超大页面入口文件
- 超大页面级组件
- 超大业务 Hook
- 配置页中表格列、弹窗表单、拉数逻辑混在同一文件

治理优先级建议：

1. `pages/submission/**`
2. `pages/configuration/components/**`
3. `pages/access/**`
4. `locales/modules/**`
