## ADDED Requirements

### Requirement: Room creation and management
系统 SHALL 在关系（Relationship）进入破冰期（ICEBREAKING）状态时自动创建对应的聊天室房间。房间 ID 为 `relationship:{relationshipId}`。

#### Scenario: Relationship enters ICEBREAKING status
- **WHEN** Relationship 的 status 变更为 ICEBREAKING
- **THEN** 系统 SHALL 创建 Socket.io Room `relationship:{relationshipId}` 并允许参与者加入

#### Scenario: Room already exists
- **WHEN** Room 已存在且用户尝试重复创建
- **THEN** 系统 SHALL 忽略创建请求，返回现有房间信息

### Requirement: User joins chatroom
用户 SHALL 通过 WebSocket 连接并加入聊天室房间。加入时系统 MUST 验证用户身份和房间成员资格。

#### Scenario: Valid user joins room
- **WHEN** 用户发送 `joinRoom` 事件，携带 `{ relationshipId, userId }` 且用户是该 Relationship 的当事人或已分配的军师
- **THEN** 系统 SHALL 将用户加入 Socket.io Room，向房间内其他成员广播 `userJoined` 事件，并返回房间历史消息

#### Scenario: Unauthorized user attempts to join
- **WHEN** 非该 Relationship 参与者的用户尝试加入房间
- **THEN** 系统 SHALL 拒绝加入并返回错误 `FORBIDDEN`

### Requirement: Send main chat message
当事人 SHALL 能够在主聊天窗口发送文字消息，消息对所有房间成员可见（受军师模式约束）。

#### Scenario: Client sends main message
- **WHEN** 当事人发送 `sendMessage` 事件，携带 `{ relationshipId, content, type: "MAIN" }`
- **THEN** 系统 SHALL 持久化消息到数据库，并根据接收者的角色和军师介入模式向有权限的成员广播 `newMessage` 事件

#### Scenario: Message content validation
- **WHEN** 发送的消息内容为空或超过 2000 字符
- **THEN** 系统 SHALL 返回验证错误，不广播消息

### Requirement: System messages
系统 SHALL 在关键事件发生时自动生成系统消息（如军师加入、模式切换、状态变更），无需用户主动发送。

#### Scenario: Wingman joins relationship
- **WHEN** 军师被分配到 Relationship 并加入房间
- **THEN** 系统 SHALL 向房间内所有成员广播系统消息 `"{wingmanNickname} 已作为军师加入"`

#### Scenario: Wingman mode changed
- **WHEN** 当事人更改其军师的介入模式
- **THEN** 系统 SHALL 向房间内所有成员广播系统消息 `"{wingmanNickname} 的介入模式已切换为 {mode}"`

### Requirement: Load message history
用户 SHALL 能够通过 REST API 加载历史消息，支持分页。

#### Scenario: Load recent messages
- **WHEN** 用户请求 `GET /api/chat/:relationshipId/messages?limit=50`
- **THEN** 系统 SHALL 返回该用户有权查看的最近 50 条消息，按时间倒序排列

#### Scenario: Load messages with cursor
- **WHEN** 用户请求 `GET /api/chat/:relationshipId/messages?cursor={messageId}&limit=50`
- **THEN** 系统 SHALL 返回该消息 ID 之前的 50 条消息（支持向上翻页）

### Requirement: Online presence tracking
系统 SHALL 跟踪并广播用户的在线状态，使用 Redis 作为状态存储。

#### Scenario: User connects
- **WHEN** 用户通过 WebSocket 连接成功并认证
- **THEN** 系统 SHALL 在 Redis 中记录用户在线状态，并向其所在房间广播 `userOnline` 事件

#### Scenario: User disconnects
- **WHEN** 用户 WebSocket 连接断开
- **THEN** 系统 SHALL 在 Redis 中移除在线状态，并向其所在房间广播 `userOffline` 事件

#### Scenario: Query online members
- **WHEN** 用户请求 `GET /api/chat/:relationshipId/presence`
- **THEN** 系统 SHALL 返回房间内所有成员及其在线状态列表

### Requirement: Message persistence
所有聊天消息 MUST 持久化到 PostgreSQL 数据库，包括消息类型、发送者、时间戳等元数据。

#### Scenario: Message saved to database
- **WHEN** 用户发送一条消息（MAIN、PRIVATE 或 PENDING 类型）
- **THEN** 系统 SHALL 在 Message 表中创建记录，包含 content、senderId、relationshipId、type、createdAt

#### Scenario: Database write failure
- **WHEN** 消息持久化失败（数据库异常）
- **THEN** 系统 SHALL 向发送者返回错误，不广播消息
