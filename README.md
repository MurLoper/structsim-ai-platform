# StructSim AI Platform - 前端应用

基于 React + TypeScript + Tailwind CSS 的现代化前端应用。

## 文档

详细文档请查看 [docs/](./docs/) 目录：

- **开发规范 (必读)**: [CODE_STANDARDS.md](./docs/development/CODE_STANDARDS.md)
- **架构设计**: [ARCHITECTURE.md](./docs/architecture/ARCHITECTURE.md)
- **技术路线图**: [TECH_ROADMAP.md](./docs/architecture/TECH_ROADMAP.md)
- **最佳实践**: [best-practices/](./docs/best-practices/)

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 <http://127.0.0.1:3000>

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 📁 项目结构

```
src/
├── api/              # API 调用层
├── components/       # 通用组件
│   ├── ui/          # 基础 UI 组件
│   └── layout/      # 布局组件
├── hooks/           # 自定义 Hooks
├── pages/           # 页面组件
│   ├── configuration/  # 配置管理页
│   ├── submission/     # 提交页
│   └── dashboard/      # 仪表盘
├── stores/          # 状态管理 (Zustand)
├── types/           # TypeScript 类型定义
├── utils/           # 工具函数
├── locales/         # 国际化
└── routes/          # 路由配置
```

## 🛠️ 技术栈

- **框架**: React 19
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **路由**: React Router v7
- **构建工具**: Vite
- **图标**: Heroicons
- **图表**: Recharts
- **HTTP客户端**: Axios

## 📝 开发规范

### 代码规范

- 遵循 [CODE_STANDARDS.md](./docs/development/CODE_STANDARDS.md)
- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化

### 文件行数限制

- 页面组件: ≤ 600 行
- 业务组件: ≤ 300 行
- Hooks: ≤ 150 行
- 工具函数: ≤ 150 行

### 命名规范

- 组件文件: PascalCase (`Button.tsx`)
- 工具/Hooks: camelCase (`useAuth.ts`)
- 类型文件: camelCase (`user.ts`)

## 🔧 可用脚本

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览生产构建
npm run lint         # 运行 ESLint 检查
npm run lint:fix     # 自动修复 ESLint 问题
npm run format       # 格式化代码
npm run format:check # 检查代码格式
```

## 🌐 环境配置

### 开发环境

- 前端: <http://127.0.0.1:3000>
- 后端API: <http://127.0.0.1:5000>
- API代理已配置在 `vite.config.ts`

### 环境变量

在项目根目录创建 `.env` 文件：

```
VITE_API_BASE_URL=http://127.0.0.1:5000
```

## 📦 主要功能模块

### 1. 配置管理

- 仿真类型管理
- 参数定义管理
- 求解器管理
- 工况定义管理
- 输出定义管理
- 姿态类型管理

### 2. 提交管理

- 项目选择
- 仿真类型配置
- 参数设置
- 工况配置
- 可视化画布

### 3. 仪表盘

- 数据统计
- 图表展示
- 快速操作

## 🎨 UI 组件

### 基础组件

- Button - 按钮
- Input - 输入框
- Select - 下拉选择
- Modal - 模态框
- Card - 卡片
- Table - 表格
- Tabs - 标签页

### 布局组件

- Layout - 主布局
- Header - 页头
- Sidebar - 侧边栏

## 🔗 相关链接

- [后端项目](../structsim-backend/)
- [项目文档](../README.md)
- [开发规范](./docs/development/CODE_STANDARDS.md)

## 📄 许可证

内部项目，保留所有权利。
