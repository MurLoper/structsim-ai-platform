# 代码规范标准 (React + TypeScript + Tailwind)

## 1. 文件行数规范

### 1.1 纯逻辑层 (`utils/`, `lib/`, `services/`, `hooks/`)

| 级别   | 行数     |
| ------ | -------- |
| 建议   | ≤ 150 行 |
| 警戒   | > 200 行 |
| 硬上限 | 300 行   |

### 1.2 单个函数/方法

| 级别   | 行数       |
| ------ | ---------- |
| 建议   | ≤ 40-60 行 |
| 警戒   | > 80 行    |
| 硬上限 | 120 行     |

### 1.3 UI 组件层 (`components/`)

| 级别   | 行数         |
| ------ | ------------ |
| 建议   | ≤ 250-300 行 |
| 警戒   | > 400 行     |
| 硬上限 | 600 行       |

### 1.4 页面层 (`pages/`, `views/`)

| 级别   | 行数                  |
| ------ | --------------------- |
| 建议   | ≤ 400-600 行          |
| 警戒   | > 800 行              |
| 硬上限 | 1200 行（需说明原因） |

## 2. Tailwind 专属规范

### 2.1 className 长度控制

- 单个元素 `className` 超过 **160-200 字符** 或 **2 行以上**：
  - 抽成 `cn()` 组合函数
  - 或抽成子组件

### 2.2 JSX 嵌套层级

- 嵌套层级 **> 6 层** 需考虑拆分结构

### 2.3 主题适配规范 ⭐ 重要

项目支持三种主题模式：**Light（亮色）**、**Dark（暗色）**、**Eyecare（护眼）**。所有组件必须正确适配这三种主题。

#### 2.3.1 使用 CSS 变量而非硬编码颜色

**❌ 错误示例（硬编码颜色）：**

```tsx
// 只适配了 light 和 dark，护眼模式会显示不正确
<div className="bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white">
  内容
</div>

<button className="bg-blue-500 hover:bg-blue-600 text-white">
  按钮
</button>
```

**✅ 正确示例（使用 CSS 变量）：**

```tsx
// 自动适配所有三种主题
<div className="bg-background text-foreground">
  内容
</div>

<div className="bg-muted text-muted-foreground">
  次要内容
</div>

<button className="bg-primary text-primary-foreground hover:bg-primary/90">
  按钮
</button>
```

#### 2.3.2 可用的 CSS 变量类

| CSS 变量类                                       | 用途            | 示例               |
| ------------------------------------------------ | --------------- | ------------------ |
| `bg-background` / `text-foreground`              | 主背景/主文字   | 页面背景、主要文字 |
| `bg-card` / `text-card-foreground`               | 卡片背景/文字   | Card 组件          |
| `bg-muted` / `text-muted-foreground`             | 静音色/次要文字 | 禁用状态、辅助信息 |
| `bg-primary` / `text-primary-foreground`         | 主色/主色文字   | 主按钮、强调元素   |
| `bg-secondary` / `text-secondary-foreground`     | 次要色          | 次要按钮           |
| `bg-accent` / `text-accent-foreground`           | 强调色          | hover 状态         |
| `bg-destructive` / `text-destructive-foreground` | 危险色          | 删除按钮、错误提示 |
| `bg-success` / `text-success`                    | 成功色          | 成功状态           |
| `bg-warning` / `text-warning`                    | 警告色          | 警告提示           |
| `border-border`                                  | 边框            | 所有边框           |
| `border-input`                                   | 输入框边框      | 表单输入框         |
| `ring-ring`                                      | 焦点环          | focus 状态         |

#### 2.3.3 主题变量定义位置

所有主题的 CSS 变量定义在 `src/styles/themes.css`：

- `:root` - 亮色主题（默认）
- `.dark` - 暗色主题
- `[data-theme='eyecare']` - 护眼主题（Solarized Light 配色）

#### 2.3.4 检查清单

在编写或修改组件时，请检查：

- [ ] 是否使用了 `bg-slate-*`、`text-slate-*`、`border-slate-*` 等硬编码颜色？
- [ ] 是否使用了 `bg-gray-*`、`bg-blue-*`、`bg-red-*` 等具体颜色值？
- [ ] 是否只有 `dark:` 前缀而没有考虑护眼模式？
- [ ] 是否使用了十六进制颜色值（如 `#cbd5e1`）？

**如果以上任何一项为"是"，请改用 CSS 变量类。**

#### 2.3.5 特殊情况

**自定义颜色（如状态徽章）：**

```tsx
// 当需要使用用户自定义的颜色时，可以使用 style 属性
<span
  style={{
    color: customColor,
    borderColor: customColor,
    backgroundColor: `${customColor}15`, // 15 是透明度
  }}
>
  自定义颜色内容
</span>
```

**品牌色保留：**

```tsx
// 品牌色（brand-*）可以保留用于特定的品牌元素
// 但建议优先使用 primary 变量
<div className="bg-primary">推荐</div>
<div className="bg-brand-500">品牌色（特殊情况）</div>
```

#### 2.3.6 测试主题适配

开发时请切换三种主题模式测试：

1. 点击右上角主题切换按钮
2. 依次切换到 Light、Dark、Eyecare 模式
3. 检查组件在三种模式下的显示效果
4. 确保文字清晰可读、对比度足够

## 3. 组件质量指标

### 3.1 State 数量

- `useState/useReducer` 合计 **> 8** 为高风险，需拆分

### 3.2 useEffect 数量

- **> 4** 个需抽 hooks 或重新划分数据流

### 3.3 Props 数量

- 单组件 props **> 12** 提示组件边界不清

### 3.4 圈复杂度

- 核心函数建议 **≤ 10-15**

## 4. 文件职责原则

### 4.1 单一职责

- 一个文件最多做 **1 个主职责 + 1 个辅助职责**

### 4.2 页面文件职责

页面文件只做：

- Layout 布局
- 组装子组件
- 连接 Store
- 业务规则全部在 `hooks/` 或 `domain/` 里

## 5. 目录结构规范

```
src/
├── api/              # API 调用层 (≤150行/文件)
├── components/       # 通用组件
│   ├── ui/          # 基础 UI 组件 (≤300行)
│   └── layout/      # 布局组件 (≤300行)
├── hooks/           # 自定义 Hooks (≤150行)
├── pages/           # 页面组件
│   └── [page]/      # 每个页面一个目录
│       ├── index.tsx           # 页面入口 (≤600行)
│       ├── components/         # 页面专属组件
│       ├── hooks/              # 页面专属 hooks
│       └── types.ts            # 页面类型定义
├── stores/          # 状态管理 (≤200行)
├── types/           # 全局类型定义 (≤150行)
├── utils/           # 工具函数 (≤150行)
└── locales/         # 国际化
```

## 6. 命名规范

### 6.1 文件命名

- 组件文件：PascalCase (`Button.tsx`)
- 工具/hooks：camelCase (`useAuth.ts`, `formatDate.ts`)
- 类型文件：camelCase (`user.ts`)
- 常量文件：camelCase (`constants.ts`)

### 6.2 组件命名

- 组件名与文件名一致
- 页面组件以 `Page` 结尾可选

### 6.3 Hook 命名

- 以 `use` 开头 (`useSubmission`, `useCanvasZoom`)

## 7. 拆分策略

### 7.1 何时拆分组件

- JSX 超过 100 行
- 有独立的交互逻辑
- 可复用于其他地方
- 嵌套层级过深

### 7.2 何时抽取 Hook

- 多个 `useEffect` 处理相关逻辑
- State + 操作函数形成内聚单元
- 逻辑可复用

### 7.3 何时抽取 Service

- API 调用逻辑
- 复杂数据转换
- 业务规则计算
