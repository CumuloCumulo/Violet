## ADDED Requirements

### Requirement: 用户可查看进行中的关系列表
系统 SHALL 在 DiscoveryPage 中新增"关系"tab，展示当前用户所有活跃的关系（status 为 ICEBREAKING 或 FLIRTING 的 Relationship 记录）。每个关系卡片 MUST 展示对方当事人的匿名信息（性别、校区、兴趣标签、恋爱宣言）、关系状态、以及是否有军师在线。

#### Scenario: 当事人查看关系列表
- **WHEN** 当事人切换到 DiscoveryPage 的"关系"tab
- **THEN** 系统展示该用户参与的所有非 ENDED 状态的关系列表，每条显示对方匿名信息和"进入聊天"按钮

#### Scenario: 空状态
- **WHEN** 用户没有任何活跃关系
- **THEN** 显示"暂无进行中的关系"提示

### Requirement: 关系列表提供进入聊天的入口
每个关系卡片 MUST 提供"进入聊天"按钮，点击后用户直接进入对应的 ChatPage，自动连接 Socket.io 并加入聊天室。

#### Scenario: 从关系列表进入聊天
- **WHEN** 用户在关系列表中点击某条关系的"进入聊天"按钮
- **THEN** 页面跳转到 ChatPage，自动连接 WebSocket，调用 joinRoom 加入该关系的聊天室，恢复聊天记录

#### Scenario: FLIRTING 状态的关系点击
- **WHEN** 用户点击一条 FLIRTING 状态的关系
- **THEN** 进入一个只读的聊天历史页面，显示"已进入暧昧期"提示和对方联系方式

### Requirement: 军师查看自己介入的关系
军师可在关系列表中看到自己当前介入的关系（通过 WingmanAssignment 记录中 leftAt 为 null 的条目）。

#### Scenario: 军师查看关系列表
- **WHEN** 拥有 WINGMAN 角色的用户切换到"关系"tab
- **THEN** 系统展示该军师当前介入的所有关系（WingmanAssignment.leftAt 为 null），显示当事人双方匿名信息和军师当前模式

### Requirement: 后端关系列表 API
系统 MUST 提供查询当前用户关系的 HTTP API。

#### Scenario: 查询关系列表
- **WHEN** GET /api/discovery/relationships
- **THEN** 返回当前用户作为 user1 或 user2 的所有非 ENDED 状态的 Relationship，包含对方匿名信息、关系状态、军师分配信息（side、mode、军师昵称）
