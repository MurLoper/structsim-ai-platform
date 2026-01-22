# 前端文档目录

> **版本**: v2.0
> **最后更新**: 2025-01-19
> **状态**: ✅ 生产就绪

本目录包含前端项目的所有文档。

---

## 📁 目录结构

```text
docs/
├── README.md                     # 本文件
├── architecture/                 # 架构设计
│   ├── ARCHITECTURE.md           # 前端架构总览 ✅ 已更新
│   └── TECH_ROADMAP.md           # 技术升级路线图
├── development/                  # 开发规范
│   ├── CODE_STANDARDS.md         # 代码规范标准
│   ├── CONFIGURATION_GUIDE.md    # 配置化指南
│   └── CONSTANTS_MANAGEMENT.md   # 常量管理规范
├── best-practices/               # 最佳实践
│   ├── react-closure-trap.md     # React 闭包陷阱
│   └── react-19.2-upgrade-guide.md  # React 19.2 升级指南
└── requirements/                 # 需求文档
    └── PRODUCT_REQUIREMENTS.md   # 产品需求文档
```

---

## 📖 文档分类

### 🏗️ 架构设计（必读）

| 文档                                             | 描述                                       | 状态      |
| ------------------------------------------------ | ------------------------------------------ | --------- |
| [前端架构总览](./architecture/ARCHITECTURE.md)   | 技术栈、分层架构、状态管理、组件设计       | ✅ 已更新 |
| [技术升级路线图](./architecture/TECH_ROADMAP.md) | TanStack Query、React Hook Form 等升级计划 | ✅ 已完成 |

### 📝 开发规范（必读）

| 文档                                                  | 描述                                   | 状态 |
| ----------------------------------------------------- | -------------------------------------- | ---- |
| [代码规范标准](./development/CODE_STANDARDS.md)       | React + TypeScript + Tailwind 开发规范 | ✅   |
| [配置化指南](./development/CONFIGURATION_GUIDE.md)    | 配置管理开发指南                       | ✅   |
| [常量管理规范](./development/CONSTANTS_MANAGEMENT.md) | 常量定义与管理规范                     | ✅   |

### 💡 最佳实践

| 文档                                                                | 描述                         | 状态 |
| ------------------------------------------------------------------- | ---------------------------- | ---- |
| [React 闭包陷阱](./best-practices/react-closure-trap.md)            | React Hooks 闭包问题解决方案 | ✅   |
| [React 19.2 升级指南](./best-practices/react-19.2-upgrade-guide.md) | React 19 升级注意事项        | ✅   |

### 📋 需求文档

| 文档                                                   | 描述                         | 状态 |
| ------------------------------------------------------ | ---------------------------- | ---- |
| [产品需求文档](./requirements/PRODUCT_REQUIREMENTS.md) | 产品需求与设计文档 (PRD+HLD) | ✅   |

---

## 🎯 核心技术栈

| 分类         | 技术             | 版本   | 状态 |
| ------------ | ---------------- | ------ | ---- |
| **框架**     | React            | 19.2.0 | ✅   |
|              | TypeScript       | 5.8    | ✅   |
|              | Vite             | 6.2    | ✅   |
| **状态管理** | Zustand          | 5.0    | ✅   |
|              | TanStack Query   | 5.60   | ✅   |
| **UI/样式**  | Tailwind CSS     | 3.4    | ✅   |
|              | Shadcn/ui        | -      | ✅   |
|              | Lucide React     | 0.460  | ✅   |
| **表单**     | React Hook Form  | 7.53   | ✅   |
|              | Zod              | 3.23   | ✅   |
| **表格**     | TanStack Table   | 8.20   | ✅   |
|              | TanStack Virtual | 3.10   | ✅   |
| **可视化**   | ECharts          | 5.5    | ✅   |
|              | React Flow       | 12.3   | ✅   |
| **路由**     | React Router     | 7.12   | ✅   |

---

## 🚀 快速开始

### 新加入项目的开发者请按以下顺序阅读：

#### 第一步：了解架构

1. ✅ **必读**: [前端架构总览](./architecture/ARCHITECTURE.md)
2. ✅ **技术栈**: 查看架构文档中的技术栈部分

#### 第二步：学习规范

1. ✅ **必读**: [代码规范标准](./development/CODE_STANDARDS.md)
2. ✅ **配置化**: [配置化指南](./development/CONFIGURATION_GUIDE.md)

#### 第三步：最佳实践

1. ✅ **闭包问题**: [React 闭包陷阱](./best-practices/react-closure-trap.md)
2. ✅ **React 19**: [React 19.2 升级指南](./best-practices/react-19.2-upgrade-guide.md)

---

## 📦 已实现功能

### 核心功能

- ✅ 三主题系统（亮色/暗色/护眼）
- ✅ TanStack Query 服务端状态管理
- ✅ React Hook Form + Zod 表单验证
- ✅ 路由守卫和权限控制
- ✅ 国际化支持框架

### 配置管理

- ✅ 项目管理 CRUD
- ✅ 仿真类型管理 CRUD
- ✅ 参数定义管理 CRUD
- ✅ 求解器管理 CRUD
- ✅ 工况定义管理 CRUD
- ✅ 输出定义管理 CRUD
- ✅ 姿态类型管理 CRUD
- ✅ 参数组合管理
- ✅ 工况输出组合管理

### UI 组件

- ✅ Button, Input, Modal, Table
- ✅ Card, Badge, Tabs
- ✅ Toast, Loading, ConfirmDialog
- ✅ ThemeSwitcher

---

## 🔗 相关文档

### 项目文档

- [项目总览](../../README.md)
- [文档中心](../../docs/README.md)
- [总需求文档](../../docs/REQUIREMENTS.md)
- [开发计划与进度](../../docs/DEVELOPMENT_PLAN.md)

### 后端文档

- [后端文档目录](../../structsim-backend/docs/README.md)
- [API 参考文档](../../structsim-backend/docs/api/API_REFERENCE.md)

---

**最后更新**: 2025-01-22
**文档版本**: v2.0
**维护者**: 前端团队
