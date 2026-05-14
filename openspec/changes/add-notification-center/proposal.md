## Why

Violet 的通知事件（心动请求、心动被接受/拒绝、军师申请/审批、关系状态变更等）散落在不同的页面和 WebSocket 事件中，没有一个统一的入口让用户快速查看所有待处理事项。用户需要手动切换多个 tab 才能发现新事件，容易遗漏重要的互动（如军师加入、心动被接受），导致体验断裂和响应延迟。

## What Changes

- 新增 **通知中心页面** (`/notifications`)，聚合所有通知类型：
  - 心动通知：收到心动请求、发出的心动被接受/拒绝
  - 关系动态：军师申请加入、军师审批结果、关系状态变更（破冰→暧昧）
  - 系统消息：未来可扩展的通知类型
- 新增后端 `Notification` 模型和 CRUD 接口，持久化存储通知记录
- 在现有 WebSocket 基础上新增通知推送事件，用户上线时推送未读通知
- 在 DiscoveryPage 顶部导航栏右侧加入"消息"入口按钮（带未读计数 badge）
- 各通知条目支持点击跳转到对应页面（聊天、关系详情等）

## Capabilities

### New Capabilities
- `notification-center`: 通知中心——包含通知数据模型、后端 API、WebSocket 推送、前端通知列表页面、未读计数和导航入口

### Modified Capabilities
<!-- 无现有 spec 需要修改 -->

## Impact

- **后端**: 新增 Prisma `Notification` 模型 + migration；新增 `NotificationModule` / `NotificationController` / `NotificationService`；在现有业务逻辑（match-request accept/reject、wingman approve/reject、relationship transition）中创建通知记录
- **前端**: 新增 `NotificationsPage` 组件和路由；修改 DiscoveryPage 导航栏添加消息入口按钮；修改 chatStore 或新建 notificationStore 管理 WebSocket 推送的通知
- **WebSocket**: 在现有 chat.gateway 中新增 `notification` 事件类型，或在通知创建时通过现有连接推送
- **数据库**: 新增 Notification 表，关联 User 表
