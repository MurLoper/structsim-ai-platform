# 结构治理总计划

适用范围：`structsim-ai-platform` 前端结构治理与规范收口  
当前状态：进行中  
最后更新：2026-04-02

## 目标

- 不改页面功能、不改业务逻辑、不改接口字段、不改提交流程
- 把首轮“止血式拆分”收口为长期可维护的语义结构
- 让 `docs/development` 中的执行基线、长期规范、历史归档与代码现实一致

## 批次状态

| 批次 | 领域                 | 状态               | 说明                                                          |
| ---- | -------------------- | ------------------ | ------------------------------------------------------------- |
| A    | Submission 第一轮    | 已完成             | 页面、抽屉、主 Hook 已完成首轮止血拆分                        |
| B    | Submission 第二轮    | 已完成，待人工回归 | 页面入口压到编排层，提交流程和抽屉动作已下沉                  |
| C    | Configuration 第一轮 | 已完成             | permissions / relations / group modal 首轮拆分完成            |
| D    | Configuration 第二轮 | 已完成，待人工回归 | OutputGroups / ParamDefs / OutputDefs 已收口为语义组件        |
| E    | Dashboard            | 已完成，待人工回归 | results hook、condition analysis、process flow 已完成语义拆分 |
| F    | Access               | 已完成，待人工回归 | 页面状态、Tab、Modal 已完成分层                               |
| G    | Foundation           | 进行中             | locale / constants / theme / docs 继续统一收口                |

## 当前代码基线

- `src/pages/submission/index.tsx`：447 行
- `src/pages/dashboard/hooks/useResultsData.ts`：268 行
- `src/pages/configuration/components/OutputGroupsManagement.tsx`：254 行
- `src/pages/configuration/tabs/ParamDefsTab.tsx`：301 行
- `src/pages/configuration/tabs/OutputDefsTab.tsx`：277 行
- `src/components/layout/Layout.tsx`：283 行

## 当前剩余重点

- 清理剩余业务组件级 `slate / hex` 主题硬编码
- 继续修复零散历史中文乱码
- 补齐人工回归记录
- 将 Foundation 批次从“进行中”推进到“已完成 / 可归档”

## 验收要求

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- 批次文档和待办文档同步更新
- 人工回归记录补齐
