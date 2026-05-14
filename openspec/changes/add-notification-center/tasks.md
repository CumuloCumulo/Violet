## 1. 后端数据模型与迁移

- [x] 1.1 在 prisma/schema.prisma 中新增 Notification 模型（id, userId, type, title, content, data, read, createdAt, @@index）
- [x] 1.2 运行 prisma migrate dev 生成数据库迁移（prisma generate 已完成，migrate 需在部署时执行）

## 2. 后端 Notification 模块

- [x] 2.1 创建 notification.module.ts、notification.controller.ts、notification.service.ts，注册到 AppModule
- [x] 2.2 实现 GET /notifications 分页查询接口（支持 cursor + limit，按 createdAt DESC）
- [x] 2.3 实现 GET /notifications/unread-count 接口
- [x] 2.4 实现 PUT /notifications/:id/read 标记单条已读
- [x] 2.5 实现 PUT /notifications/read-all 全部标记已读
- [x] 2.6 NotificationService 中实现 createNotification 方法（创建记录 + EventEmitter2 推送）

## 3. 后端业务逻辑集成通知创建

- [x] 3.1 DiscoveryService.sendMatchRequest 中创建 MATCH_REQUEST_RECEIVED 通知给 toUserId
- [x] 3.2 DiscoveryService.acceptMatchRequest 中创建 MATCH_REQUEST_ACCEPTED 通知给 fromUserId
- [x] 3.3 DiscoveryService.rejectMatchRequest 中创建 MATCH_REQUEST_REJECTED 通知给 fromUserId
- [x] 3.4 WingmanTaskService.applyForTask 中创建 WINGMAN_APPLIED 通知给 clientId
- [x] 3.5 WingmanTaskService.approveTask 中创建 WINGMAN_APPROVED 通知给 wingmanId
- [x] 3.6 WingmanTaskService.rejectApplication 中创建 WINGMAN_REJECTED 通知给 wingmanId
- [x] 3.7 ChatLifecycleService.onIcebreaking 中创建 RELATIONSHIP_ICEBREAKING 通知给双方
- [x] 3.8 ChatLifecycleService.onFlirting 中创建 RELATIONSHIP_FLIRTING 通知给双方
- [x] 3.9 ChatLifecycleService.onEnded 中创建 RELATIONSHIP_ENDED 通知给双方

## 4. WebSocket 通知推送

- [x] 4.1 在 chat.gateway.ts 中新增 @OnEvent('notification.created') 监听器，NotificationService 通过 EventEmitter2 解耦
- [x] 4.2 处理用户不在线场景（不推送，下次拉取时获取）

## 5. 前端状态管理

- [x] 5.1 创建 notificationStore.ts（Zustand），包含 notifications 列表、unreadCount、fetchNotifications、fetchUnreadCount、markAsRead、markAllAsRead
- [x] 5.2 在 chatStore 的 socket 连接中监听 `notification` 事件，更新 notificationStore 的 unreadCount

## 6. 前端通知中心页面

- [x] 6.1 创建 NotificationsPage.tsx，路由 /notifications，使用 ntf- 前缀的 CSS 类名
- [x] 6.2 实现通知列表渲染：按日期分组（今天、昨天、更早），未读高亮，类型图标
- [x] 6.3 点击通知跳转：心动通知→DiscoveryPage，关系通知→/chat/:relationshipId，军师通知→对应页面
- [x] 6.4 点击通知时调用 markAsRead + 标记全部已读按钮
- [x] 6.5 在 App.tsx 中注册 /notifications 路由（ProtectedRoute 包裹）

## 7. 导航栏入口

- [x] 7.1 在 DiscoveryPage 导航栏右侧（积分旁）新增"消息"按钮，使用 notificationStore.unreadCount 显示 badge
- [x] 7.2 确保导航栏 badge 实时更新（WebSocket 推送时递增，标记已读时递减）

## 8. 样式

- [x] 8.1 编写通知中心页面样式（ntf- 前缀），保持与 Violet 设计系统一致（玻璃态、圆角、字体）
- [x] 8.2 导航栏消息按钮样式与现有 dg-nav-btn 风格统一，badge 样式复用 dg-nav-badge
