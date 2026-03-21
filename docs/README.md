# 前端文档目录

面向 `structsim-ai-platform` 当前代码实现的前端文档索引。
**最后更新**: 2026-03-21

## 1. 首先阅读

如果当前目标是收口上线主链路，建议按以下顺序阅读：

1. [前端现状与开发计划](./architecture/CURRENT_STATUS_AND_PLAN.md)
2. [配置驱动开发指南](./development/CONFIGURATION_GUIDE.md)
3. [后端提单协议](../../structsim-backend/docs/architecture/SUBMISSION_PROTOCOL.md)
4. [后端提单字段清单与联调清单](../../structsim-backend/docs/architecture/SUBMISSION_FIELD_CHECKLIST.md)
5. [登录与 SSO 说明](../../structsim-backend/docs/SSO.md)

## 2. 架构与规范

| 文档                                                                    | 用途                           |
| ----------------------------------------------------------------------- | ------------------------------ |
| [ARCHITECTURE.md](./architecture/ARCHITECTURE.md)                       | 前端架构总览                   |
| [CURRENT_STATUS_AND_PLAN.md](./architecture/CURRENT_STATUS_AND_PLAN.md) | 当前现状、主问题与阶段计划     |
| [CONFIGURATION_GUIDE.md](./development/CONFIGURATION_GUIDE.md)          | 配置驱动开发与提单快照设计说明 |
| [CODE_STANDARDS.md](./development/CODE_STANDARDS.md)                    | React / TypeScript 开发规范    |
| [CONSTANTS_MANAGEMENT.md](./development/CONSTANTS_MANAGEMENT.md)        | 常量管理规范                   |

## 3. 当前主判断

当前前端最需要收口的不是新增页面能力，而是：

- 统一登录 / SSO 入口与认证状态
- 稳定提单页树状运行态
- 稳定 `inputJson` 快照序列化与回填
- 降低页面对隐式字段语义的依赖

## 4. 对应后端文档

强关联后端文档如下：

- [后端文档目录](../../structsim-backend/docs/README.md)
- [登录与 SSO 说明](../../structsim-backend/docs/SSO.md)
- [提单初始化与订单快照协议](../../structsim-backend/docs/architecture/SUBMISSION_PROTOCOL.md)
- [提单主链路字段清单与联调清单](../../structsim-backend/docs/architecture/SUBMISSION_FIELD_CHECKLIST.md)
