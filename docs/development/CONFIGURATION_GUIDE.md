# Configuration 领域结构指南

适用范围：`src/pages/configuration/**`

## 1. 目标

- 页面入口只负责 tab 组装、查询接线和少量页面级协调
- 管理型页面拆成语义子域，而不是继续在顶层平铺大组件
- `permissions / relations / param-groups / output-groups / conditions / status` 各自独立收口

## 2. 推荐目录

```text
configuration/
  Configuration.tsx
  hooks/
  tabs/
  components/
    permissions/
    relations/
    paramGroups/
    outputGroups/
    conditions/
    status/
```

## 3. 拆分原则

- `*Management.tsx` 只保留列表状态、查询、保存入口
- 表格列定义、工具栏、弹层表单、预览区分别拆出
- `permissions` 继续细分 `users / roles / menus / shared`
- `tabs` 只做切换与装配，不隐藏批量导入、预览、批量创建等业务细节

## 4. 数据与命名

- 配置映射、下拉选项、默认值进入 `constants / selectors / adapters / types`
- 不允许继续新增 `*Options.tsx`、`*Data.ts` 这类无边界聚合文件作为长期终态
- 配置关系型字段优先用明确命名，例如 `defaultParamGroupId`、`defaultOutputGroupId`

## 5. 主题与展示

- `configuration` 页面壳层和管理弹层统一使用主题 token
- 共享样式优先抽成语义组件，不只抽 class 常量
