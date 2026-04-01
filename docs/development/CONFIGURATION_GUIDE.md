# Configuration 领域指南

适用范围：`src/pages/configuration/**`  
最后更新：2026-04-02

## 目标

- 让 `configuration` 页面只做 tab 编排与页面协调
- 将各配置子域按语义目录组织
- 保持 CRUD、回填、删除确认、权限流转不变

## 目录建议

- `components/permissions`
- `components/relations`
- `components/paramGroups`
- `components/outputGroups`
- `components/conditions`
- `components/status`

## 约束

- `*Management.tsx` 只保留容器职责
- 表单弹层必须拆到语义子目录
- 列定义、表单选项、派生映射分别放到 `constants / selectors / adapters / types`
- 不允许继续把共享 class 常量当作终态结构

## 当前重点

- `OutputGroupsManagement.tsx`
- `ParamDefsTab.tsx`
- `OutputDefsTab.tsx`
