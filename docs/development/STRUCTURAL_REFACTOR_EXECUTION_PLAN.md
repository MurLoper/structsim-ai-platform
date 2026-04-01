# 结构治理执行计划

适用范围：`docs/development` 执行基线  
当前状态：执行中  
最后更新：2026-04-02

## 执行原则

- 先止血，再语义收口，不允许只做物理拆文件。
- 页面入口只做编排，页面级 Hook 只做状态协调。
- 纯逻辑只允许落在 `selectors / restorers / serializers / adapters / mappers / constants / types`。
- 不新增 `utils.ts`、`helpers.ts`、`sections.tsx`、`styles.ts`、`shared.tsx` 一类泛名文件。

## 固定阶段

1. Submission Batch B 收口  
   目标：页面只保留初始化、编排、提交入口和抽屉协调。
2. Configuration Batch D 收口  
   目标：消化剩余大管理组件和平铺目录。
3. Dashboard Batch E 收口  
   目标：结果数据流和展示流完全语义化。
4. Access / Foundation 收尾  
   目标：主题 token、locale、constants 与历史文档归档完成。

## 每阶段强制动作

- 执行 `npm run lint`
- 执行 `npm run typecheck`
- 执行 `npm run build`
- 回写批次文档
- 更新总计划与待办

## 完成判定

- 无新增泛名中间态文件
- 主要业务域目录语义稳定
- `lint / typecheck / build` 全绿
- 关键人工回归通过
- 历史计划与准备文档进入归档态
