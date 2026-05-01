## Context

当前 Violet 的军师流程基于单申请人模型（`WingmanTask.wingmanId`），存在以下问题：

1. **申请隔离缺失**：`listTasksByRelationship` 返回该 relationship 的所有任务，不区分当事人身份，导致双方都能看到对方的军师申请
2. **单申请人限制**：`applyForTask` 直接将 task status 从 `OPEN` 改为 `ASSIGNED`，第一个军师申请后任务就对其他军师不可见
3. **无实时更新**：军师审批通过后没有 WebSocket 事件通知客户端，聊天界面不会自动显示私聊面板
4. **通知位置错误**：`handleSwitchMode` 将系统消息作为 MAIN 类型广播到整个房间
5. **暧昧期房间关闭**：`onFlirting` 返回 `roomClosed` 事件，前端直接显示结束画面并断开连接

## Goals / Non-Goals

**Goals:**
- 修复全部5个 bug，使军师核心流程可用
- 保持现有架构不变（NestJS + Socket.io + Zustand）
- 数据库变更最小化

**Non-Goals:**
- 不重构军师大厅 UI 设计
- 不增加军师评价/信用系统
- 不做离线推送（已有 Redis pending proposal 机制）

## Decisions

### Decision 1: WingmanApplication 中间表 vs 数组字段

**选择**：新增 `WingmanApplication` 中间表

**替代方案**：在 `WingmanTask` 上使用 JSON 数组字段存储申请人列表

**理由**：Prisma 原生支持关系查询和事务，JSON 字段难以做唯一约束（同一军师不能重复申请同一任务）。中间表也更易扩展（未来可在申请上加消息、状态等）。

Schema:
```
model WingmanApplication {
  id        String   @id @default(cuid())
  taskId    String
  wingmanId String
  status    ApplicationStatus @default(PENDING)  // PENDING | APPROVED | REJECTED
  createdAt DateTime @default(now())

  task     WingmanTask @relation(...)
  wingman  User        @relation(...)

  @@unique([taskId, wingmanId])
}
```

`WingmanTask.wingmanId` 字段保留但语义变更：仅在 `APPROVED` 后填入，表示最终选中的军师。`WingmanTask.status` 在首个申请后仍保持 `OPEN`，直到当事人审批通过才变为 `ASSIGNED`。

### Decision 2: WebSocket 事件 vs 轮询

**选择**：WebSocket 事件推送 `wingmanAssigned`

**理由**：聊天室已有 Socket.io 连接，新增事件成本为零。客户端收到 `wingmanAssigned` 后重新查询 room 状态即可更新 UI。

新增事件：
- `wingmanAssigned`: `{ relationshipId, wingmanId, side, mode }` — 当事人收到后自动更新聊天布局

### Decision 3: 模式切换通知改到私聊

**选择**：将 `createSystemMessage` 的 type 从默认（MAIN）改为 PRIVATE，设置 `targetUserId` 为当事人 ID

**理由**：模式切换是军师与当事人之间的操作信息，与对方当事人无关。PRIVATE 消息的 visibility 已正确限制为只有当事人和军师可见。

### Decision 4: 暧昧期只读而非关闭

**选择**：`onFlirting` 返回 `roomClosed` 事件但 reason 改为 `FLIRTING_READONLY`，前端区分处理

**替代方案**：新增事件类型 `roomReadOnly`

**理由**：复用现有事件类型，前端已按 `reason` 区分行为。FLIRTING reason 时显示恭喜弹窗但不阻断 UI，允许返回查看聊天记录。同时 `canSendToRoom` 已经会阻止非 ICEBREAKING 状态下的消息发送，天然支持只读。

## Risks / Trade-offs

- **[Migration]** 新增 `WingmanApplication` 表需要 migration，但无 breaking change → 确保迁移脚本幂等
- **[数据迁移]** 已存在的 `WingmanTask` 记录中部分已有 `wingmanId`（ASSIGNED/IN_PROGRESS 状态），需要数据迁移脚本为这些记录生成对应的 `WingmanApplication` → 在 migration 中用 SQL 补数据
- **[前端缓存]** `chatStore` 中的 room state 需要在收到 `wingmanAssigned` 事件后更新，否则 wingmanId/wingmanMode 字段为空 → 在事件处理中合并新状态
- **[暧昧期兼容]** 修改 FLIRTING 的 roomClosed 处理逻辑可能影响已有的暧昧期 relationship → 只改前端处理逻辑，后端行为不变（仍然发出 roomClosed 事件），前端对 FLIRTING reason 不再阻断
