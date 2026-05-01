## Why

军师流程存在5个阻断性 bug，导致核心体验不可用：当事人双方都能看到彼此的军师申请、军师加入后聊天界面不会自动更新、模式切换通知发错窗口、任务只允许一个军师申请、以及进入暧昧期后聊天记录不可查看。这些问题使得军师机制几乎无法正常运作。

## What Changes

- **军师申请隔离**：`listTasksByRelationship` API 需要按 `clientId` 过滤，每个当事人只能看到自己发布的任务的申请
- **多军师申请支持**：将 `WingmanTask` 从单申请人模型改为多申请人模型，引入 `WingmanApplication` 中间表，一个任务可以有多个军师同时申请
- **军师加入实时通知**：通过 WebSocket 推送 `wingmanAssigned` 事件，客户端收到后自动更新聊天界面（显示私聊面板、军师信息等），无需手动刷新
- **模式切换通知改到私聊**：系统消息从发送到主聊天（MAIN）改为发送到当事人与军师的私聊（PRIVATE）
- **暧昧期聊天记录保留**：进入暧昧期后不关闭房间，改为只读模式，保留聊天记录的可查看性

## Capabilities

### New Capabilities
- `wingman-multi-apply`: 多军师申请机制，支持多个军师同时申请同一任务，由当事人选择
- `wingman-realtime-notify`: 军师状态变更的 WebSocket 实时推送，包括申请、审批、加入等事件

### Modified Capabilities
（无现有 spec 需要修改）

## Impact

- **数据库**：新增 `WingmanApplication` 表；`WingmanTask` 表移除 `wingmanId` 字段，改为通过中间表关联
- **后端 API**：`WingmanTaskService` 重写申请逻辑；`ChatGateway` 新增 `wingmanAssigned` 事件、修改模式切换系统消息目标
- **前端**：`WingmanPanel` 适配多申请列表 UI；`chatStore` 处理新的 WebSocket 事件；`ChatPage` 处理暧昧期只读模式
- **依赖**：需要 Prisma migration
