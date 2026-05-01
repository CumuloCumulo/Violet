## 1. 数据库 Schema 变更

- [x] 1.1 在 Prisma schema 中新增 `WingmanApplication` 模型（id, taskId, wingmanId, status: PENDING/APPROVED/REJECTED, createdAt），添加 `@@unique([taskId, wingmanId])` 约束
- [x] 1.2 在 `WingmanTask` 模型上添加 `applications` 关联到 `WingmanApplication`
- [x] 1.3 在 `User` 模型上添加 `wingmanApplications` 关联
- [x] 1.4 在 Prisma schema 中新增 `ApplicationStatus` 枚举（PENDING, APPROVED, REJECTED）
- [x] 1.5 运行 `prisma migrate dev` 生成迁移文件，并编写数据迁移 SQL 将现有 `WingmanTask.wingmanId`（ASSIGNED/IN_PROGRESS 状态）转换为对应的 `WingmanApplication` 记录

## 2. 后端：军师申请逻辑重构（多申请人支持）

- [x] 2.1 重写 `WingmanTaskService.applyForTask`：不再将 task status 改为 ASSIGNED，而是创建 `WingmanApplication` 记录（status=PENDING），task 保持 OPEN
- [x] 2.2 重写 `WingmanTaskService.approveTask`：根据 taskId + wingmanId 查找 application，在事务中：将该 application 设为 APPROVED、同 task 其他 PENDING application 设为 REJECTED、创建 WingmanAssignment、将 task status 改为 ASSIGNED
- [x] 2.3 重写 `WingmanTaskService.rejectTask`：将指定 application status 改为 REJECTED（而非 task 级别），task 保持 OPEN
- [x] 2.4 修改 `WingmanTaskService.listTasksByRelationship`：增加 `clientId` 参数，只返回该当事人的任务（解决双方都能看到申请的问题）
- [x] 2.5 修改 `WingmanTaskController.listByRelationship`：从 JWT 中取 userId 传给 service
- [x] 2.6 修改 `WingmanTaskService.listOpenTasks`：返回数据中包含每个 task 的 pending application 数量（供前端展示）

## 3. 后端：WebSocket 实时通知

- [x] 3.1 在 `ChatGateway` 中注入 `WingmanTaskService`（或通过事件机制），在 `approveTask` 成功后向当事人推送 `wingmanAssigned` 事件
- [x] 3.2 向被批准的军师推送 `wingmanApproved` 事件（通过 presence service 查找 socket）
- [x] 3.3 修改 `handleSwitchMode`：将 `createSystemMessage` 改为 PRIVATE 类型，设置 `targetUserId` 为当事人的 userId

## 4. 后端：暧昧期只读模式

- [x] 4.1 修改 `chat-lifecycle.service.ts` 的 `onFlirting`：返回的 event reason 保持 `'FLIRTING'`，type 改为 `'roomReadOnly'`（或新增类型），不再返回 `roomClosed`
- [x] 4.2 修改 `chat.gateway.ts` 的 `handleTransitionStatus`：对 FLIRTING 事件发送 `roomReadOnly` 事件（而非 `roomClosed`），不 disconnect 任何 socket

## 5. 前端：适配多申请人 UI

- [x] 5.1 修改 `WingmanPanel` 的 task 列表展示：为 ASSIGNED 状态的 task 展示所有 PENDING application 列表（包含军师昵称、兴趣等），每个申请人单独显示同意/拒绝按钮
- [x] 5.2 修改 `WingmanPanel` 的申请展示：只展示当前用户创建的 task 的申请（后端已过滤）
- [x] 5.3 修改 `WingmanHallPage`：task card 中显示当前申请人数量（如 "3人申请"）

## 6. 前端：聊天界面实时更新

- [x] 6.1 在 `chatStore` 中添加 `wingmanAssigned` 事件监听：收到后更新对应 room 的 wingmanId 和 wingmanMode 字段
- [x] 6.2 在 `chatStore` 中添加 `wingmanApproved` 事件监听：收到后让军师可以导航到聊天室
- [x] 6.3 验证 `ChatPage` 在 room state 更新后自动显示私聊面板（无需刷新）

## 7. 前端：暧昧期只读模式

- [x] 7.1 修改 `ChatPage` 对 `roomClosed` 事件的 FLIRTING 处理：显示恭喜弹窗，但弹窗可关闭，关闭后显示只读聊天界面
- [x] 7.2 在只读模式下隐藏消息输入框，显示 "已进入暧昧期" 提示
- [x] 7.3 添加 `roomReadOnly` 事件监听，更新 chatStore 中的 relationship status

## 8. 测试与验证

- [x] 8.1 本地构建后端并验证 Prisma migration 成功
- [x] 8.2 端到端手动测试：当事人1发布任务 → 多个军师申请 → 只能看到自己的申请 → 审批后聊天界面自动更新
- [x] 8.3 端到端手动测试：模式切换通知只出现在私聊窗口
- [x] 8.4 端到端手动测试：进入暧昧期后可查看聊天记录（只读）
