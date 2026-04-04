# 平台治理能力开发规范

适用范围：`structsim-ai-platform` 中与登录会话、平台内容、埋点分析相关的长期能力

## 1. 目标

平台治理能力包括四条主线：

- 登录与会话
- 公告与隐私协议
- 统一埋点
- 平台分析

这四类能力都必须按结构化标准开发，不允许以“大页面 + 大 Hook + 零散事件名”的方式扩散。

## 2. 目录约束

`features/platform` 固定按语义目录收口：

- `session/`
- `tracking/`
- `analytics/`
- `content/`
- `queries/`
- `types/`

`tracking/` 下继续分层：

- `client/`：队列、flush、重试、sessionId
- `catalog/`：事件名、页面 key、feature key 规则
- `domains/`：各业务域显式埋点入口

不允许继续在页面里散落：

- 直接写字符串事件名
- 直接手写 metadata key
- 直接操作本地埋点队列

## 3. 登录与会话规则

前端统一流程：

1. 获取公钥
2. 加密密码
3. 登录或 SSO 回调获取 token
4. 拉取 `/auth/session`
5. 渲染业务页面

固定规则：

- 登录接口和 SSO 回调接口不返回用户快照
- `/auth/session` 是唯一会话真源
- Zustand 持久化不能把本地 user 快照当作最终真值
- 用户唯一业务标识固定为 `domainAccount`

## 4. 埋点规则

### 4.1 事件命名

统一采用命名空间形式：

- `dashboard.shortcut_click`
- `orders.filter_apply`
- `submission.submit_success`
- `results.tab_change`
- `configuration.save`
- `platform.announcement_view`

### 4.2 metadata 标准字段

统一字段：

- `pageKey`
- `featureKey`
- `moduleKey`
- `result`
- `step`
- `entityId`
- `orderNo`
- `durationMs`

业务页面不得自行发明同义字段名。

### 4.3 采集边界

只采集“已提交/已确认”的动作，不采集键盘逐字输入。

允许采集：

- 页面访问
- 筛选应用 / 重置
- 查看结果
- 抽屉打开
- 提交成功 / 失败
- 保存成功 / 失败
- 公告曝光 / 关闭 / 点击
- 隐私查看 / 同意

不建议采集：

- 文本输入每个字符
- 鼠标移动
- 高频 hover

## 5. 分析页规则

分析页 `/analytics` 必须至少包含：

- 总览卡片
- 页面使用排行
- 功能使用排行
- 关键流程转化
- 失败热点

分析聚合规则：

- 页面统计以 `page_view + pageKey` 为准
- 功能统计以 `featureKey + eventName` 为准
- 失败统计以 `result=failure` 或失败事件名为准

## 6. 公告与隐私协议规则

平台内容唯一配置入口固定为：

- 系统配置 -> 平台内容

公告支持：

- 启用 / 停用
- 排序
- 生效时间窗
- 是否允许关闭
- 跳转链接

隐私协议支持：

- 标题
- 版本
- 摘要
- 正文
- 是否强制同意

隐私协议版本变化后，旧同意记录必须失效并重新确认。

## 7. 文档要求

涉及平台治理能力的改动，必须同步更新长期文档，至少包含：

- 登录与会话架构
- 登录加密说明
- 埋点事件目录与 metadata 约定
- 分析页使用说明
- 公告与隐私协议配置说明

禁止新增阶段性垃圾文档。若需要补说明，应优先更新：

- 本文档
- 后端 `docs/api/PLATFORM_API.md`
- 后端 `docs/SSO.md`
