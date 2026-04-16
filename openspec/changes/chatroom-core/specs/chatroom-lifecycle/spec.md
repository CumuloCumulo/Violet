## ADDED Requirements

### Requirement: Room lifecycle bound to relationship status
聊天室的生命周期 SHALL 与 Relationship 的状态（MATCHING → ICEBREAKING → FLIRTING → ENDED）严格绑定。

#### Scenario: Room unavailable during MATCHING
- **WHEN** Relationship 处于 MATCHING 状态
- **THEN** 系统 SHALL NOT 允许任何聊天室操作，房间不存在

#### Scenario: Room created on ICEBREAKING
- **WHEN** Relationship 从 MATCHING 变更为 ICEBREAKING
- **THEN** 系统 SHALL 创建聊天室房间，两位当事人可加入并发送消息

#### Scenario: Wingman joins during ICEBREAKING
- **WHEN** 军师被分配到处于 ICEBREAKING 状态的 Relationship
- **THEN** 军师 SHALL 能够加入房间，根据其介入模式获得相应权限

#### Scenario: Room transitions to FLIRTING
- **WHEN** Relationship 状态变更为 FLIRTING（暧昧期）
- **THEN** 系统 SHALL 禁止发送新消息，保留历史消息只读访问，军师被强制移出房间

#### Scenario: Room closed on ENDED
- **WHEN** Relationship 状态变更为 ENDED
- **THEN** 系统 SHALL 关闭房间，断开所有 WebSocket 连接，历史消息保留但不可访问（除非后续需求变更）

### Requirement: Status transition triggers
系统 SHALL 在特定事件触发关系状态变更，并联动聊天室行为。

#### Scenario: Both clients agree to enter ICEBREAKING
- **WHEN** 牵线期双方均确认同意
- **THEN** Relationship 状态从 MATCHING 变更为 ICEBREAKING，聊天室自动创建

#### Scenario: Mutual agreement to enter FLIRTING
- **WHEN** 破冰期双方均确认交换联系方式，同意进入暧昧期
- **THEN** Relationship 状态从 ICEBREAKING 变更为 FLIRTING，触发军师退出和评价流程

#### Scenario: Either party abandons relationship
- **WHEN** 任一当事人点击"放弃/不合适"
- **THEN** Relationship 状态变更为 ENDED，聊天室立即关闭，系统通知所有参与者

### Requirement: Wingman auto-removal on phase exit
当关系离开破冰期时，军师 SHALL 被自动移出聊天室。

#### Scenario: Wingman removed on FLIRTING transition
- **WHEN** Relationship 进入 FLIRTING 状态
- **THEN** 系统 SHALL 从 Socket.io Room 中移除所有军师，断开其 WebSocket 连接，更新 WingmanAssignment 的 leftAt 时间戳

#### Scenario: Wingman removed on ENDED transition
- **WHEN** Relationship 进入 ENDED 状态
- **THEN** 系统 SHALL 移除所有军师，与 FLIRTING 相同的处理逻辑

### Requirement: System messages on status change
关系状态变更时，系统 SHALL 发送描述性系统消息。

#### Scenario: Status change notification
- **WHEN** Relationship 状态发生变更
- **THEN** 系统 SHALL 在变更前向房间内发送系统消息，描述变更（如 "双方已确认进入破冰期"、"对方已选择放弃"）
