## 1. 基础设施搭建

- [x] 1.1 新增 Prisma schema 变更：`MessageType` 枚举（MAIN, PRIVATE, PENDING, SYSTEM），Message 模型新增 `type` 和 `targetUserId` 字段，执行迁移
- [x] 1.2 后端安装 `ioredis` 和 `socket.io-client`（测试用）依赖
- [x] 1.3 前端安装 `socket.io-client` 依赖
- [x] 1.4 创建 NestJS `ChatModule`（chat.module.ts），注册到 AppModule
- [x] 1.5 配置 NestJS WebSocket Gateway 基础（`ChatGateway`，空壳，验证连接可建立）

## 2. 测试基础设施

- [x] 2.1 创建测试工具模块：`test/utils/test-app.ts`——封装 NestJS 测试模块创建，配置测试数据库
- [x] 2.2 创建测试工具模块：`test/utils/test-client.ts`——封装 Socket.io-client，提供 `connect()`、`joinRoom()`、`sendMessage()`、`waitForEvent()` 方法
- [x] 2.3 创建测试工具模块：`test/utils/fixture.ts`——创建测试用户、关系、军师分配等数据
- [x] 2.4 配置测试数据库：添加 `.env.test` 文件，指向 `violet_test` 数据库，在 `test/jest-e2e.json` 中配置测试环境
- [x] 2.5 验证测试基础设施：编写一个 smoke test 验证 TestApp 可启动、TestClient 可连接

## 3. 核心服务层

- [x] 3.1 实现 `RoomService`：房间创建逻辑（关联 Relationship ID）、成员资格验证、权限矩阵计算（根据角色和军师模式）
- [x] 3.2 实现 `ChatService`：消息创建、消息持久化（Prisma）、消息可见性计算（根据接收者角色和军师模式过滤）
- [x] 3.3 实现 `PresenceService`：Redis 在线状态管理（设置/移除/查询）、房间成员列表管理
- [ ] 3.4 为 RoomService、ChatService、PresenceService 编写单元测试

## 4. WebSocket Gateway 实现

- [x] 4.1 实现 `ChatGateway` 连接处理：`handleConnection`（认证 userId，注册在线状态）、`handleDisconnect`（清理在线状态）
- [x] 4.2 实现 `handleJoinRoom`：验证成员资格、加入 Socket.io Room、返回历史消息、广播 `userJoined`
- [x] 4.3 实现 `handleSendMessage`：验证权限、调用 ChatService 持久化、根据可见性规则向特定成员广播
- [x] 4.4 实现私聊消息处理：`handleSendPrivateMessage`（PRIVATE 类型，仅当事人+己方军师可见）
- [x] 4.5 实现待确认消息处理：`handleDraftMessage`（PENDING 类型，辅助模式）、`handleConfirmMessage`、`handleRejectMessage`
- [x] 4.6 实现系统消息生成：军师加入/离开、模式切换、状态变更时自动发送 SYSTEM 类型消息
- [ ] 4.7 编写集成测试：四人聊天完整流程（创建关系→破冰→加入→发消息→验证接收）

## 5. REST API

- [x] 5.1 实现 `ChatController`：`GET /api/chat/:relationshipId/messages`（分页加载历史消息，含 cursor 参数）
- [x] 5.2 实现 `ChatController`：`GET /api/chat/:relationshipId/presence`（查询房间在线成员）
- [ ] 5.3 编写 REST API 集成测试

## 6. 军师介入模式

- [x] 6.1 实现 Solo 模式：军师以当事人名义发送主窗口消息，对方看到发送者为当事人
- [x] 6.2 实现 Private 模式：军师仅私聊窗口可见，主窗口消息被过滤
- [x] 6.3 实现 Assist 模式：军师草拟 PENDING 消息 → 当事人确认/拒绝 → 转为 MAIN 广播
- [x] 6.4 实现消息转发功能：当事人可选中主窗口消息转发给私聊模式的军师
- [x] 6.5 实现模式切换：当事人切换军师模式 → 更新 WingmanAssignment → 立即生效 → 广播通知
- [ ] 6.6 编写军师模式集成测试：验证三种模式下消息可见性隔离

## 7. 聊天室生命周期

- [x] 7.1 实现关系状态变更触发器：MATCHING → ICEBREAKING 时自动创建房间
- [x] 7.2 实现状态变更联动：ICEBREAKING → FLIRTING 时关闭房间（禁止新消息、保留只读、移除军师）
- [x] 7.3 实现状态变更联动：任意状态 → ENDED 时关闭房间、断开所有连接
- [ ] 7.4 编写生命周期集成测试：验证完整状态流转下的聊天室行为

## 8. 前端聊天界面

- [x] 8.1 实现 `useChatStore`（Zustand）：socket 连接管理、rooms 映射、messages 映射、activeRoom、connect/joinRoom/sendMessage/confirmMessage actions
- [x] 8.2 实现 `ChatPage` 页面：双面板布局（主聊天窗口 + 军师私聊窗口），根据用户角色和军师模式切换显示
- [x] 8.3 实现 `MessageList` 组件：消息列表展示、自动滚动、上拉加载历史、PENDING 消息特殊样式（确认/拒绝按钮）
- [x] 8.4 实现 `MessageInput` 组件：文字输入、内置表情选择器、空消息拦截
- [x] 8.5 实现 `PresenceIndicator` 组件：显示房间成员在线/离线状态
- [x] 8.6 实现 Socket 连接生命周期管理：页面 mount 时连接+加入房间、unmount 时离开房间、断线重连恢复
