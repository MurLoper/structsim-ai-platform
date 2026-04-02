# 前端代码规范标准

适用范围：`structsim-ai-platform` 前端项目  
目标：在不改变页面功能、业务逻辑、接口字段和用户可见行为的前提下，持续降低复杂度并完成结构化收口。

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
- `components` 超过 4 个同域文件时，必须建立语义子目录，例如 `params/`、`permissions/`、`results/`
- 页面入口只做布局、组装子组件、连接 store/query/router、少量页面级协调
- 页面级 Hook 只做状态协调，不同时承担查询、归一化、初始化、持久化、提交流程等全部职责
- 纯逻辑必须进入语义目录，例如 `selectors / restorers / serializers / adapters / mappers / constants / types`
- 不允许仅为了“降行数”制造新的隐性聚合层

## 4. 命名约束

禁止新增以下泛名文件作为长期终态：

- `utils.ts`
- `helpers.ts`
- `sections.tsx`
- `styles.ts`
- `shared.ts`

允许带 feature 前缀的短期过渡文件，但必须在同一批次内继续收口。

## 5. 样式与主题规范

- 优先使用语义 token：`bg-background`、`text-foreground`、`bg-card`、`border-border`、`text-muted-foreground`
- 复用优先级固定为：语义组件 > variant 基底 > token/class 常量
- 不允许在业务组件中继续扩散 `bg-slate-* / text-slate-* / border-slate-* / 十六进制色值`
- 十六进制色值只允许存在于语义 token 文件中

## 6. Hook 与 Effect 规范

- 同文件 `useEffect > 4` 时，优先拆 Hook
- 一个 `useEffect` 只负责一个副作用主题
- 拉数、预填充、持久化、订阅不要混在同一个 effect 中
- 派生数据优先 `useMemo` 或渲染阶段计算，不用 effect 回写状态

## 7. 业务语义约束

### 用户身份

- `domain_account / domainAccount` 是用户唯一业务标识
- 不允许再把 `user.id`、历史外部 ID、显示名当作用户主键使用
- 订单、权限、提交页中凡是“按用户关联”的逻辑，一律以 `domainAccount` 为准

### 申请单与工况

- `conditionId` 是提交页内部的唯一工况标识
- `foldTypeId + simTypeId` 只作为 `conditionId` 的业务组合来源，不再承担页面主状态职责
- `simTypeIds` 可以作为申请单列表的聚合展示和筛选字段保留，但不能作为提交页内部核心状态

## 8. 文档治理规范

- `docs/development` 只保留三类文档：执行基线、长期规范、仍在复用的模板
- 已归档且不再维护的准备文档应当物理删除，不继续占用目录
- 文档状态必须与代码现状一致，禁止“代码已完成但文档仍未开始”
- 阶段性结论必须沉淀到主计划、执行计划、待办，而不是散落在历史文件中

## 9. 校验要求

每一批结构改造结束都必须执行：

- `npm run lint`
- `npm run typecheck`
- `npm run build`

任何 warning 都视为待修问题，不允许长期保留。
