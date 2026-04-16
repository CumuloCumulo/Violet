## ADDED Requirements

### Requirement: Solo mode (代聊模式)
军师在 Solo 模式下 SHALL 能够直接以当事人身份发送主窗口消息，对方当事人看到的消息发送者为该当事人（而非军师）。

#### Scenario: Wingman sends message in Solo mode
- **WHEN** 军师 A（side=1, mode=SOLO）发送消息 `{ content, type: "MAIN" }`
- **THEN** 系统 SHALL 以当事人 1 的名义创建消息（senderId 记录为军师实际 ID，但展示名为当事人 1），向对方当事人 2 及其军师广播

#### Scenario: Wingman sees both windows in Solo mode
- **WHEN** 军师处于 Solo 模式并加入房间
- **THEN** 军师 SHALL 能看到主聊天窗口的所有消息，并能看到己方当事人的私聊窗口

#### Scenario: Opponent wingman in Solo mode
- **WHEN** 军师 A 处于 Solo 模式，军师 B 处于 Private 模式
- **THEN** 军师 B SHALL 看不到军师 A 发送的主窗口消息（Private 模式不显示主窗口）

### Requirement: Private mode (私聊模式)
军师在私聊模式下 SHALL 无法看到主聊天窗口的消息，只能在私聊窗口与己方当事人交流。当事人可手动转发主窗口消息给军师。

#### Scenario: Wingman cannot see main chat in Private mode
- **WHEN** 当事人 1 在主窗口发送消息，军师 1（side=1, mode=PRIVATE）在房间中
- **THEN** 系统 SHALL NOT 向军师 1 广播该主窗口消息

#### Scenario: Wingman sends private message
- **WHEN** 军师 1（mode=PRIVATE）发送私聊消息 `{ content, type: "PRIVATE", targetUserId: user1Id }`
- **THEN** 系统 SHALL 仅向当事人 1 和军师 1 广播该消息

#### Scenario: Client forwards message to wingman
- **WHEN** 当事人 1 选择一条主窗口消息并转发给军师 1
- **THEN** 系统 SHALL 创建一条 PRIVATE 类型的转发消息，仅当事人 1 和军师 1 可见，内容标记为转发

### Requirement: Assist mode (辅助模式)
军师在辅助模式下 SHALL 能看到主聊天窗口，并可草拟消息，但消息 MUST 经当事人确认后才发送到主窗口。

#### Scenario: Wingman drafts message in Assist mode
- **WHEN** 军师 1（mode=ASSIST）草拟消息 `{ content, type: "PENDING" }`
- **THEN** 系统 SHALL 创建 PENDING 类型消息，仅向当事人 1 展示待确认消息，不向对方广播

#### Scenario: Client confirms pending message
- **WHEN** 当事人 1 确认一条 PENDING 消息
- **THEN** 系统 SHALL 将消息状态变更为 MAIN，持久化并以当事人 1 名义广播到主窗口

#### Scenario: Client rejects pending message
- **WHEN** 当事人 1 拒绝一条 PENDING 消息
- **THEN** 系统 SHALL 删除该 PENDING 消息，通知军师 1 消息被拒绝，不广播到主窗口

### Requirement: Mode switching
当事人 SHALL 能够随时切换其军师的介入模式，切换后立即生效。

#### Scenario: Switch from Private to Assist
- **WHEN** 当事人 1 将军师 1 的模式从 PRIVATE 切换为 ASSIST
- **THEN** 系统 SHALL 更新 WingmanAssignment 的 mode 字段，军师 1 立即获得主窗口消息的可见性，系统广播模式切换通知

#### Scenario: Switch from Assist to Solo
- **WHEN** 当事人 1 将军师 1 的模式从 ASSIST 切换为 SOLO
- **THEN** 系统 SHALL 更新模式，军师 1 获得直接发送主窗口消息的权限，系统广播通知

#### Scenario: Mode switch requires active relationship
- **WHEN** 关系状态不为 ICEBREAKING 时尝试切换军师模式
- **THEN** 系统 SHALL 返回错误，不允许切换
