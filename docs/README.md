# 前端文档目录

本目录包含前端项目的所有文档。

## 目录结构

```text
docs/
├── README.md                     # 本文件
├── development/                  # 开发规范
│   ├── CODE_STANDARDS.md         # 代码规范标准
│   ├── CONFIGURATION_GUIDE.md    # 配置化指南
│   └── CONSTANTS_MANAGEMENT.md   # 常量管理规范
├── requirements/                 # 需求文档
│   └── PRODUCT_REQUIREMENTS.md   # 产品需求文档
├── architecture/                 # 架构设计
│   ├── ARCHITECTURE.md           # 前端架构总览
│   └── TECH_ROADMAP.md           # 技术升级路线图
└── best-practices/               # 最佳实践
    ├── react-closure-trap.md     # React 闭包陷阱
    └── react-19.2-upgrade-guide.md  # React 19.2 升级指南
```

---

## 文档分类

### 开发规范 (必读)

| 文档                                                  | 描述                                   |
| ----------------------------------------------------- | -------------------------------------- |
| [代码规范标准](./development/CODE_STANDARDS.md)       | React + TypeScript + Tailwind 开发规范 |
| [配置化指南](./development/CONFIGURATION_GUIDE.md)    | 配置管理开发指南                       |
| [常量管理规范](./development/CONSTANTS_MANAGEMENT.md) | 常量定义与管理规范                     |

### 架构设计

| 文档                                             | 描述                                       |
| ------------------------------------------------ | ------------------------------------------ |
| [前端架构总览](./architecture/ARCHITECTURE.md)   | 技术栈、分层架构、状态管理、组件设计       |
| [技术升级路线图](./architecture/TECH_ROADMAP.md) | TanStack Query、React Hook Form 等升级计划 |

### 最佳实践

| 文档                                                                | 描述                         |
| ------------------------------------------------------------------- | ---------------------------- |
| [React 闭包陷阱](./best-practices/react-closure-trap.md)            | React Hooks 闭包问题解决方案 |
| [React 19.2 升级指南](./best-practices/react-19.2-upgrade-guide.md) | React 19 升级注意事项        |

### 需求文档

| 文档                                                   | 描述                         |
| ------------------------------------------------------ | ---------------------------- |
| [产品需求文档](./requirements/PRODUCT_REQUIREMENTS.md) | 产品需求与设计文档 (PRD+HLD) |

---

## 快速开始

新加入项目的开发者请按以下顺序阅读：

1. **必读**: [代码规范标准](./development/CODE_STANDARDS.md)
2. **架构**: [前端架构总览](./architecture/ARCHITECTURE.md)
3. **升级计划**: [技术升级路线图](./architecture/TECH_ROADMAP.md)
4. **最佳实践**: [React 闭包陷阱](./best-practices/react-closure-trap.md)

---

## 相关文档

- [项目总览](../../README.md)
- [总需求文档](../../docs/REQUIREMENTS.md)
- [开发进度](../../docs/DEVELOPMENT_PROGRESS.md)
- [阶段计划](../../docs/ROADMAP.md)

---

**最后更新**: 2024-01-18
