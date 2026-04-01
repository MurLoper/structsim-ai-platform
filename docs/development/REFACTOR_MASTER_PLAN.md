# 结构治理总计划

适用范围：`structsim-ai-platform` 前端结构治理与规范收口  
当前状态：执行中  
最后更新：2026-04-02

## 基线

- 不改页面功能、业务逻辑、接口字段、提交 payload、路由语义。
- 当前唯一正式规范基线为 [`CODE_STANDARDS.md`](./CODE_STANDARDS.md)。
- 若历史计划与代码现状不一致，以代码现状为准，并同步回写文档。

## 批次状态

| 批次 | 领域                 | 状态   | 说明                                                         |
| ---- | -------------------- | ------ | ------------------------------------------------------------ |
| A    | Submission 第一轮    | 已完成 | 页面、抽屉、主 Hook 已完成止血拆分                           |
| B    | Submission 第二轮    | 进行中 | 继续收口页面编排、恢复链路、提交链路与目录语义               |
| C    | Configuration 第一轮 | 已完成 | permissions / relations / group modal 首轮拆分完成           |
| D    | Configuration 第二轮 | 进行中 | 继续消化大组件、平铺目录、过渡命名                           |
| E    | Dashboard            | 进行中 | results / processFlow / conditionAnalysis 已进入语义拆分阶段 |
| F    | Access               | 进行中 | 页面状态、Tab、Modal 已拆开，继续清理主题与文案              |
| G    | Foundation           | 进行中 | locale / constants / theme / docs 正在统一收口               |

## 当前热点

- `src/pages/submission/index.tsx`
- `src/pages/configuration/components/OutputGroupsManagement.tsx`
- `src/pages/configuration/tabs/ParamDefsTab.tsx`
- `src/pages/configuration/tabs/OutputDefsTab.tsx`
- `src/pages/dashboard/hooks/useResultsData.ts`
- `src/components/layout/Layout.tsx`

## 推进顺序

1. 先按批次清理剩余结构债。
2. 每完成一批都执行 `lint / typecheck / build`。
3. 每完成一批都回写 batch 文档和总计划文档。
4. 全部代码收口后，再完成人工回归与文档归档。
