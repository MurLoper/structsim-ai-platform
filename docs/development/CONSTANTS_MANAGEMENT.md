# 常量管理规范

## 1. 目标

- 消除魔法值和散落 options
- 让常量和其所属业务域绑定，而不是堆在页面文件中
- 避免“为了拆分”把真实业务语义藏进无名常量仓库

## 2. 放置规则

- 全局常量：进入 `src/constants/**`
- 页面或 feature 专属常量：进入该域的 `constants.ts` 或 `constants/`
- 一次性渲染片段、仅局部使用的小常量，可以保留在组件内，但不得跨多个组件复制

## 3. 命名规则

- 使用语义命名，例如 `ORDER_STATUS_OPTIONS`、`SUBMISSION_DRAWER_WIDTH`
- 禁止 `miscConstants`、`sharedValues`、`pageData` 这类泛名常量集合
- 主题 token 与业务常量分离，不混放

## 4. 不应进入常量层的内容

- 复杂逻辑函数
- 仅为绕开大文件而机械搬出的 JSX 片段
- 仍在频繁变化、尚未稳定的临时流程变量

## 5. 校验要求

- 新增常量前先确认是否已有同类定义
- 同一业务值不允许同时存在 camelCase、snake_case 两套常量命名
- 用户唯一标识相关常量统一使用 `domainAccount` 语义
