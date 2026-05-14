## Context

Violet 是一个校园交友平台，核心流程包括：心动匹配 → 破冰聊天 → 暧昧期。当前系统的通知机制存在以下问题：

1. **心动请求**：只在 DiscoveryPage 的"收到心动" tab 中展示，用户需要手动切换 tab 才能看到
2. **心动结果**：发出的心动被接受/拒绝后，发起者没有任何通知
3. **军师动态**：军师申请加入、审批结果等事件通过 WebSocket 推送但仅 console.log，没有持久化
4. **关系变更**：关系状态转换（破冰→暧昧→结束）仅在聊天室内展示系统消息

当前前端采用 react-router-dom 路由，DiscoveryPage 内含顶部导航栏（`.dg-nav-bar`），导航栏左侧有内部 tab（发现、已发起、收到心动、关系），右侧有功能按钮（积分、军师大厅、管理、个人中心、退出）。通知中心将作为独立路由页面 `/notifications`，在导航栏右侧新增入口按钮。

后端采用 NestJS + Prisma + PostgreSQL，已有完整的 WebSocket 基础设施（chat.gateway）。

## Goals / Non-Goals

**Goals:**
- 提供统一的通知中心页面，聚合所有互动事件
- 持久化通知记录，用户离线时的事件也能在上线后查看
- 利用现有 WebSocket 连接实时推送新通知
- 导航栏入口带未读计数 badge，用户一目了然
- 各通知条目支持点击跳转到对应页面

**Non-Goals:**
- 不做推送通知（浏览器 Notification API、邮件、短信）
- 不做通知偏好设置（未来可扩展）
- 不修改现有的 DiscoveryPage tab 结构（收到心动 tab 保留，与通知中心并存）
- 不做通知删除功能（只做已读/未读）

## Decisions

### 1. Notification 数据模型

**选择**: 在 Prisma 中新建 `Notification` 模型，包含 `userId`、`type`、`title`、`content`、`data`（Json）、`read` 字段。

**理由**: `data` 使用 Json 类型存储关联数据（relationshipId、fromUserId 等），避免为每种通知类型建外键关联。未来新增通知类型时无需修改 schema。

**替代方案**: 为每种通知类型建独立表（如 MatchRequestNotification、WingmanNotification）——过于复杂，且 Violet 目前处于测试阶段，通知类型有限。

### 2. 通知推送方式

**选择**: 混合方案（C）——进入通知页面时全量拉取 + WebSocket 实时推送新通知。

**实现**:
- 用户打开 `/notifications` 页面时，调用 `GET /notifications` 全量拉取
- WebSocket 新增 `notification` 事件，业务逻辑创建通知后立即推送给目标用户
- 前端 notificationStore 监听 `notification` 事件，更新列表和未读计数

**理由**: 充分利用已有 WebSocket 基础设施，全量拉取保证不遗漏历史通知。

### 3. 通知创建位置

**选择**: 在各 Service 的业务方法中直接注入 NotificationService 调用。

**创建点**:
| 业务动作 | 通知接收者 | 触发位置 |
|---------|-----------|---------|
| 发送心动 | toUserId | DiscoveryService.sendMatchRequest |
| 接受心动 | fromUserId | DiscoveryService.acceptMatchRequest |
| 拒绝心动 | fromUserId | DiscoveryService.rejectMatchRequest |
| 军师申请 | clientId | WingmanTaskService.applyForTask |
| 军师审批通过 | wingmanId | WingmanTaskService.approveTask |
| 军师审批拒绝 | wingmanId | WingmanTaskService.rejectApplication |
| 关系进入破冰 | 双方 | ChatLifecycleService.onIcebreaking |
| 关系进入暧昧 | 双方 | ChatLifecycleService.onFlirting |
| 关系结束 | 双方 | ChatLifecycleService.onEnded |

### 4. 前端路由与导航

**选择**: 新增 `/notifications` 路由，在 DiscoveryPage 导航栏右侧（积分旁边）新增"消息"按钮，点击导航到通知页面。

**理由**: 不修改现有导航栏 tab 结构，保持发现页的完整性。通知中心作为独立页面，有更大的展示空间。

### 5. 前端状态管理

**选择**: 新建 `notificationStore`（Zustand），独立于 chatStore。

**理由**: 通知与聊天消息是不同领域，保持 store 职责单一。notificationStore 管理通知列表、未读计数、标记已读等。

### 6. CSS 类名策略

**选择**: 通知页面使用独立的 CSS 类名前缀 `ntf-`（notification），避免与现有 `dg-`（discovery-gallery）前缀冲突。

**理由**: 用户要求不修改已有类名，独立前缀彻底避免冲突。

## Risks / Trade-offs

- **[通知风暴]** → 如果用户同时收到大量通知（如多个心动请求），列表可能过长。缓解：分页加载 + 按时间分组展示。
- **[WebSocket 连接时机]** → 用户可能在上传通知后才建立 WebSocket 连接（如刷新页面）。缓解：通知页面进入时全量拉取兜底。
- **[Notification 表膨胀]** → 长期运行后通知记录可能很多。缓解：暂不处理，未来可加定期清理策略。
