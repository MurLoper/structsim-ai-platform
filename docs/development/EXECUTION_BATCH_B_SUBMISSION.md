# Batch B：Submission 第二轮

状态：已完成，待人工回归  
最后更新：2026-04-02

## 已完成

- `src/pages/submission/index.tsx` 已回到页面编排层
- 抽屉动作已下沉到页面级 hook
- 提交流程已从页面入口抽离到页面级 hook
- 草稿恢复、项目偏好、订单恢复链路已与页面装配分离

## 当前基线

- `src/pages/submission/index.tsx`：447 行
- `src/pages/submission/utils/submissionPageUtils.ts`：保留为过渡工具文件，待继续语义收口

## 待人工回归

- 新建提单
- 编辑提单
- 草稿恢复
- 抽屉切换
- 画布联动
- 提交流程
