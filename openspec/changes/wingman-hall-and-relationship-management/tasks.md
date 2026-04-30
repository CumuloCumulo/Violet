## 1. 数据库 Schema 扩展

- [x] 1.1 WingmanTask 模型新增 `relationshipId` 可选字段，Relationship 模型新增 `wingmanTasks` 反向关系
- [x] 1.2 运行 `prisma migrate dev` 生成迁移，验证迁移无误

## 2. 后端：关系列表 API

- [x] 2.1 DiscoveryService 新增 `listRelationships(userId)` 方法：查询用户作为 user1 或 user2 的非 ENDED 关系，包含对方匿名信息、军师分配信息
- [x] 2.2 DiscoveryController 新增 `GET /api/discovery/relationships` 端点（需 JWT 认证）

## 3. 后端：WingmanTask 模块

- [x] 3.1 创建 WingmanTaskModule、WingmanTaskService、WingmanTaskController
- [x] 3.2 WingmanTaskService 实现 `createTask(clientId, relationshipId, title, description)` — 校验同一关系同侧无 OPEN 任务
- [x] 3.3 WingmanTaskService 实现 `listOpenTasks()` — 返回 OPEN 状态任务列表，含当事人匿名标签
- [x] 3.4 WingmanTaskService 实现 `applyForTask(taskId, wingmanId)` — 校验军师认证状态，更新为 ASSIGNED
- [x] 3.5 WingmanTaskService 实现 `approveTask(taskId, clientId)` — 创建 WingmanAssignment，更新为 IN_PROGRESS
- [x] 3.6 WingmanTaskService 实现 `rejectTask(taskId, clientId)` — 重置为 OPEN，清空 wingmanId
- [x] 3.7 WingmanTaskService 实现 `cancelTask(taskId, clientId)` — 如有军师则设置 leftAt，更新为 CANCELLED
- [x] 3.8 WingmanTaskController 注册所有端点：POST /api/wingman-task、GET /api/wingman-task、POST /api/wingman-task/:id/apply、POST /api/wingman-task/:id/approve、POST /api/wingman-task/:id/reject、DELETE /api/wingman-task/:id

## 4. 后端：暧昧期触发事件

- [x] 4.1 ChatGateway 新增 `proposeFlirting` 事件处理：接收发起方请求，向对方客户端推送 `proposeFlirting` 事件
- [x] 4.2 ChatLifecycleService 新增 `proposeFlirting` 存储机制：如果对方不在线，记录待确认状态（可存 Redis 或数据库字段），下次对方加入时推送

## 5. 前端：关系列表 Tab

- [x] 5.1 DiscoveryPage 新增"关系"tab（第四个 tab），调用 GET /api/discovery/relationships 获取数据
- [x] 5.2 实现关系卡片组件：展示对方匿名信息（性别、校区、标签、宣言）、关系状态、军师信息、"进入聊天"按钮
- [x] 5.3 关系卡片点击"进入聊天"后调用 authStore.enterChat(relationshipId)，传递必要的 wingmanId 和 privateChatTargetId

## 6. 前端：ChatPage 军师面板

- [x] 6.1 ChatPage 新增可折叠右侧面板（"军师面板"），使用 glass 风格，默认折叠
- [x] 6.2 面板内实现"发布任务"表单（标题 + 描述输入框 + 提交按钮），调用 POST /api/wingman-task
- [x] 6.3 面板内实现申请人列表：调用 GET /api/wingman-task（按 relationshipId 过滤），展示申请人昵称和标签，提供同意/拒绝按钮
- [x] 6.4 面板内实现已加入军师展示：从 room 数据中读取 wingmanId1/wingmanId2，展示军师昵称和当前模式，提供"请出"按钮
- [x] 6.5 审批通过后，自动刷新聊天室状态（重新 joinRoom 以获取新的 wingman 信息），军师面板显示模式切换控件

## 7. 前端：军师大厅页面

- [x] 7.1 authStore 的 `AppPage` 类型新增 `'wingman-hall'`，App.tsx 新增路由渲染 WingmanHallPage
- [x] 7.2 创建 WingmanHallPage 组件：调用 GET /api/wingman-task 获取 OPEN 任务列表
- [x] 7.3 实现任务卡片：展示当事人匿名标签（性别、校区、兴趣）和任务标题/描述，提供"申请接单"按钮
- [x] 7.4 DiscoveryPage header 区域新增"军师大厅"入口按钮（仅 WINGMAN 角色可见）
- [x] 7.5 申请成功后卡片状态更新为"已申请，等待审批"

## 8. 前端：暧昧期触发 UI

- [x] 8.1 ChatPage 军师面板底部新增"发起暧昧期"按钮（仅当事人 + ICEBREAKING 状态可见）
- [x] 8.2 点击后发送 `proposeFlirting` socket 事件，界面显示"等待对方确认"状态
- [x] 8.3 实现 `proposeFlirting` 事件监听：收到后弹出确认弹窗（"对方希望进入暧昧期，交换联系方式？"），提供"同意"和"再想想"按钮
- [x] 8.4 同意后发送 `transitionStatus(FLIRTING)` 事件，处理 `roomClosed` 事件：展示"恭喜进入暧昧期"页面 + 对方联系方式（wechat/qq）
- [x] 8.5 chatStore 新增 `proposeFlirting` 事件处理和 `roomClosed` 时的页面状态管理

## 9. 集成与清理

- [x] 9.1 AppModule 注册 WingmanTaskModule
- [x] 9.2 更新 seed 数据，包含 WingmanTask 样本
- [ ] 9.3 端到端手动验证：注册 → 画像 → 浏览 → 牵线 → 接受 → 关系列表 → 进入聊天 → 发布军师任务 → 军师大厅接单 → 当事人审批 → 军师进入聊天 → 模式切换 → 发起暧昧期 → 交换联系方式
