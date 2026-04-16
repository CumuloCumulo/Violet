## ADDED Requirements

### Requirement: 四人聊天室消息流集成测试
系统 SHALL 提供集成测试验证四人同时在线时的消息收发正确性。

#### Scenario: 四人加入房间并交换消息
- **WHEN** client1、client2、wingman1 连接并加入同一房间
- **THEN** client1 发送 MAIN 消息后，client2 和 client1 都能收到该消息

#### Scenario: PRIVATE 消息不泄露给非参与方
- **WHEN** wingman1 向 client1 发送 PRIVATE 消息
- **THEN** client1 能收到该消息，client2 不应收到

#### Scenario: 非房间成员无法加入
- **WHEN** 不属于该 relationship 的用户尝试 joinRoom
- **THEN** SHALL 返回 FORBIDDEN 错误

### Requirement: 军师模式路由集成测试
系统 SHALL 提供集成测试验证三种军师模式下的消息路由行为。

#### Scenario: SOLO 模式军师代发消息
- **WHEN** wingman 处于 SOLO 模式并发送 MAIN 消息
- **THEN** 对方当事人收到的消息 senderId SHALL 为被代理的当事人 ID（而非军师 ID）

#### Scenario: PRIVATE 模式军师无法发送 MAIN 消息
- **WHEN** wingman 处于 PRIVATE 模式并尝试发送 MAIN 消息
- **THEN** SHALL 返回 FORBIDDEN 错误

#### Scenario: ASSIST 模式草拟消息
- **WHEN** wingman 处于 ASSIST 模式并发送 draftMessage
- **THEN** 仅对应的当事人收到 type 为 PENDING 的消息，对方当事人不应收到

#### Scenario: ASSIST 模式确认消息
- **WHEN** 当事人 confirmMessage 一条 PENDING 消息
- **THEN** 消息类型 SHALL 变为 MAIN，所有可见成员都能收到

#### Scenario: ASSIST 模式拒绝消息
- **WHEN** 当事人 rejectMessage 一条 PENDING 消息
- **THEN** 消息 SHALL 被删除，军师收到 messageRejected 通知

#### Scenario: 模式动态切换
- **WHEN** 当事人通过 switchMode 将军师从 PRIVATE 切换为 SOLO
- **THEN** 所有房间成员 SHALL 收到 modeSwitched 事件和系统消息

### Requirement: REST API 集成测试
系统 SHALL 提供集成测试验证 REST 端点的正确性和权限控制。

#### Scenario: 获取消息历史
- **WHEN** 房间成员 GET `/api/chat/:id/messages`
- **THEN** SHALL 返回 200 和该用户可见的消息列表

#### Scenario: 获取在线状态
- **WHEN** 房间成员 GET `/api/chat/:id/presence`
- **THEN** SHALL 返回 200 和在线成员列表

#### Scenario: 非成员无权访问
- **WHEN** 非房间成员 GET `/api/chat/:id/messages`
- **THEN** SHALL 返回 401

### Requirement: 生命周期集成测试
系统 SHALL 提供集成测试验证关系状态转换时的 Socket.io 事件广播。

#### Scenario: MATCHING → ICEBREAKING 触发 roomOpened
- **WHEN** 通过 REST API 将关系从 MATCHING 转为 ICEBREAKING
- **THEN** SHALL 创建系统消息并返回 roomOpened 事件

#### Scenario: ICEBREAKING → FLIRTING 触发 roomClosed
- **WHEN** 已连接的客户端在线时，关系转为 FLIRTING
- **THEN** 所有连接的客户端 SHALL 收到 reason 为 `FLIRTING` 的 roomClosed 事件

#### Scenario: → ENDED 触发断开连接
- **WHEN** 关系转为 ENDED
- **THEN** 所有连接的客户端 SHALL 收到 roomClosed 事件并被断开 Socket 连接
