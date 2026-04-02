# Batch D：Configuration 第二轮

状态：已完成，待人工回归  
最后更新：2026-04-02

## 已完成

- `OutputGroupsManagement` 已拆分为 toolbar / table / row builder
- `ParamDefsTab`、`OutputDefsTab` 已拆出导入弹层，tab 容器只保留装配职责
- 组合管理弹层与管理页共用样式 token 已收口
- `configuration` 领域的大型平铺文件继续下降

## 当前基线

- `src/pages/configuration/components/OutputGroupsManagement.tsx`：254 行
- `src/pages/configuration/tabs/ParamDefsTab.tsx`：301 行
- `src/pages/configuration/tabs/OutputDefsTab.tsx`：277 行

## 待人工回归

- tab 切换
- 参数定义 CRUD
- 输出定义 CRUD
- 批量导入
- 输出组合编辑 / 删除 / 移除输出
