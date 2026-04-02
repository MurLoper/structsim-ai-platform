# Batch E：Dashboard

状态：已完成，待人工回归  
最后更新：2026-04-02

## 已完成

- `useResultsData` 已压回组合层
- 结果页工况状态、分页状态与分析过滤状态已分离
- detail / analysis 查询逻辑已拆出独立 hook
- `ConditionResultTable`、`ProcessFlowView`、`ConditionAnalysisWorkbench` 已完成语义拆分

## 当前基线

- `src/pages/dashboard/hooks/useResultsData.ts`：268 行
- `src/pages/dashboard/Results.tsx`：305 行
- `src/pages/dashboard/Dashboard.tsx`：219 行

## 待人工回归

- 工况筛选
- 图表联动
- 结果表分页
- 流程图回放
- 详情 / 分析页切换
