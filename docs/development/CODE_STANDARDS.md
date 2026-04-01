# 代码规范标准

适用范围：`structsim-ai-platform` 前端项目  
目标：在不改变功能和业务逻辑的前提下，持续降低复杂度并完成结构化收口。

## 1. 执行优先级

1. 正确性
2. 可维护性
3. 一致性
4. 性能
5. 风格

## 2. 文件规模阈值

### 逻辑层

- 建议：`<= 150` 行
- 警戒：`> 200` 行
- 硬上限：`300` 行

### 组件层

- 建议：`<= 250-300` 行
- 警戒：`> 400` 行
- 硬上限：`600` 行

### 页面入口

- 建议：`<= 400-600` 行
- 警戒：`> 800` 行
- 硬上限：`1200` 行

超过硬上限必须拆分；超过警戒线必须说明原因并列入待办。

## 3. 结构拆分标准

- 页面目录默认结构：`index.tsx / components / hooks / utils / types.ts / constants.ts`
- `components` 超过 4 个同域文件时，必须建语义子目录。
- 页面入口只做布局、组装子组件、连接 store/query/router、少量协调状态。
- 页面级 Hook 只做状态协调，不能同时承担查询、归一化、初始化、持久化、提交组装等全部职责。
- 纯逻辑必须进入 `selectors / restorers / serializers / adapters / mappers / constants / types`。

## 4. 命名约束

禁止新增以下泛名文件：

- `utils.ts`
- `helpers.ts`
- `sections.tsx`
- `styles.ts`
- `shared.ts`

允许带 feature 前缀的短期过渡文件，但必须在同一批次内继续收口。

## 5. 样式与主题

- 优先使用语义 token：`bg-background`、`text-foreground`、`bg-card`、`border-border`、`text-muted-foreground`
- 优先级：语义组件 > variant 基底 > token/class 常量
- 不允许在业务组件中继续扩散 `bg-slate-* / text-slate-* / border-slate-* / 十六进制色值`
- 十六进制色值仅允许存在于语义 token 文件中

## 6. Hook 与 Effect

- 同文件 `useEffect > 4` 时，优先拆 Hook
- 一个 `useEffect` 只负责一个副作用主题
- 拉数、预填充、持久化、订阅不要混在同一个 effect 里
- 派生数据优先 `useMemo` 或 render 阶段计算，不要用 effect 回写状态

## 7. 校验要求

每一批结构改造结束都必须执行：

- `npm run lint`
- `npm run typecheck`
- `npm run build`

任何 warning 都视为待修问题，不允许长期保留。
