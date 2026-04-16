## ADDED Requirements

### Requirement: Chat page with dual-window layout
前端 SHALL 提供聊天页面，包含主聊天窗口和军师私聊窗口的双面板布局。

#### Scenario: Client user views chat page
- **WHEN** 当事人进入破冰期关系的聊天页面
- **THEN** 页面 SHALL 显示主聊天窗口（与对方当事人的对话）和侧边私聊窗口（与己方军师的对话）

#### Scenario: Wingman user views chat page
- **WHEN** 军师进入聊天页面
- **THEN** 页面 SHALL 根据军师介入模式显示相应窗口：Solo/Assist 模式显示主窗口+私聊窗口，Private 模式仅显示私聊窗口

#### Scenario: No wingman assigned
- **WHEN** 当事人进入聊天页面但尚未分配军师
- **THEN** 页面 SHALL 显示主聊天窗口，私聊窗口显示为空或"暂无军师"提示

### Requirement: Message list component
消息列表 SHALL 展示当前窗口的消息，支持自动滚动到底部和加载历史消息。

#### Scenario: New message received
- **WHEN** WebSocket 接收到 `newMessage` 事件
- **THEN** 消息列表 SHALL 追加新消息并自动滚动到底部（除非用户正在向上浏览历史消息）

#### Scenario: Load history on scroll up
- **WHEN** 用户滚动到消息列表顶部
- **THEN** 系统 SHALL 通过 API 加载更早的历史消息并追加到列表顶部

#### Scenario: Pending message display (Assist mode)
- **WHEN** 当事人在辅助模式下收到 PENDING 消息
- **THEN** 消息 SHALL 以特殊样式显示，附带"确认"和"拒绝"按钮

### Requirement: Message input component
消息输入框 SHALL 支持文字输入和内置表情选择。

#### Scenario: Send text message
- **WHEN** 用户在输入框输入文字并按回车或点击发送按钮
- **THEN** 系统 SHALL 通过 WebSocket 发送消息，消息立即显示在发送者的消息列表中（乐观更新）

#### Scenario: Insert emoji
- **WHEN** 用户点击表情按钮选择一个内置表情
- **THEN** 系统 SHALL 将表情标识符插入输入框光标位置

#### Scenario: Empty message prevention
- **WHEN** 用户尝试发送空消息
- **THEN** 系统 SHALL 忽略发送操作，不调用 WebSocket

### Requirement: Socket connection management
前端 SHALL 使用 Zustand store 管理 Socket.io 连接生命周期。

#### Scenario: Establish connection on chat page mount
- **WHEN** 用户导航到聊天页面
- **THEN** 系统 SHALL 建立 Socket.io 连接（如未连接），并加入对应房间

#### Scenario: Reconnection handling
- **WHEN** Socket.io 连接断开后自动重连
- **THEN** 系统 SHALL 重新认证并重新加入之前的房间，拉取断线期间的消息

#### Scenario: Disconnect on page leave
- **WHEN** 用户离开聊天页面
- **THEN** 系统 SHALL 退出当前房间（但不断开 Socket 连接，保持在线状态）

### Requirement: Chat Zustand store
前端 SHALL 提供 `useChatStore` 管理聊天相关的所有状态。

#### Scenario: Store structure
- **WHEN** 应用初始化
- **THEN** `useChatStore` SHALL 包含以下状态：`socket`（连接实例）、`rooms`（房间映射）、`messages`（消息映射）、`activeRoom`（当前活跃房间）、`connected`（连接状态）

#### Scenario: Message state update
- **WHEN** 接收到新消息或发送消息
- **THEN** store SHALL 更新对应房间的消息数组，按时间戳排序

### Requirement: Online status indicator
聊天页面 SHALL 显示房间成员的在线状态。

#### Scenario: Display online members
- **WHEN** 聊天页面加载或收到 `userOnline`/`userOffline` 事件
- **THEN** 页面 SHALL 在成员列表中显示各成员的在线/离线状态（如绿色/灰色圆点）
