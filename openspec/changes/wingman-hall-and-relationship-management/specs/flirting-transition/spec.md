## ADDED Requirements

### Requirement: 当事人可发起暧昧期
在破冰期（ICEBREAKING）聊天页面中，当事人 MUST 能通过军师面板的"发起暧昧期"按钮触发暧昧期流程。点击后系统 SHALL 向对方当事人发送确认请求（通过 Socket.io 实时推送，或下次进入时页面提示）。

#### Scenario: 一方发起暧昧期
- **WHEN** 当事人 A 在聊天页军师面板中点击"发起暧昧期"
- **THEN** 系统向当事人 B 发送 `proposeFlirting` socket 事件，包含发起方匿名信息。A 的界面显示"等待对方确认"

#### Scenario: 对方确认进入暧昧期
- **WHEN** 当事人 B 收到 `proposeFlirting` 事件并在确认弹窗中点击"同意"
- **THEN** B 的客户端发送 `transitionStatus(FLIRTING)` socket 事件。后端执行：Relationship.status → FLIRTING，所有 WingmanAssignment.leftAt 设为当前时间，发送系统消息"恭喜进入暧昧期"。双方收到 `roomClosed` 事件。

#### Scenario: 对方拒绝
- **WHEN** 当事人 B 在确认弹窗中点击"再想想"
- **THEN** 通知 A "对方暂未准备好"，关系保持 ICEBREAKING 状态

#### Scenario: 对方不在线
- **WHEN** 当事人 A 发起暧昧期但 B 当前不在线
- **THEN** 系统存储待确认状态。B 下次进入聊天或关系列表时看到"对方希望进入暧昧期"的提示弹窗

### Requirement: 暧昧期交换联系方式
双方确认进入暧昧期后，系统 MUST 自动展示对方的微信/QQ 联系方式。信息来自 User 模型的 wechat 和 qq 字段。

#### Scenario: 查看对方联系方式
- **WHEN** 暧昧期确认后，关系进入 FLIRTING 状态
- **THEN** 双方在聊天页或关系列表中能看到对方的微信/QQ（至少展示非空的那个）

#### Scenario: 对方未填写联系方式
- **WHEN** 对方的 wechat 和 qq 字段均为空
- **THEN** 显示"对方暂未填写联系方式"提示

### Requirement: 暧昧期军师自动退出
进入暧昧期时，系统 MUST 自动移除该关系中的所有军师。军师客户端收到 `roomClosed` 事件后被断开连接。

#### Scenario: 军师被自动退出
- **WHEN** 关系状态从 ICEBREAKING 转换为 FLIRTING
- **THEN** 所有 WingmanAssignment 的 leftAt 设为当前时间。军师客户端收到 `roomClosed` 事件（reason=FLIRTING），军师被踢出聊天室

### Requirement: 聊天室只读化
进入暧昧期后，聊天室 MUST 变为只读状态。双方可查看历史消息，但不能再发送新消息。

#### Scenario: 暧昧期发送消息被拒绝
- **WHEN** FLIRTING 状态下当事人尝试发送消息
- **THEN** 后端拒绝（canSendToRoom 返回 "Relationship is not in ICEBREAKING phase"），前端显示"聊天已转为只读"

### Requirement: 前端暧昧期触发 UI
ChatPage 的军师面板 MUST 包含"发起暧昧期"按钮。该按钮 MUST 仅在以下条件下显示：当前用户是当事人（非军师），关系状态为 ICEBREAKING。

#### Scenario: 按钮可见性
- **WHEN** 当事人在 ICEBREAKING 状态的聊天中打开军师面板
- **THEN** 面板底部显示"发起暧昧期"按钮

#### Scenario: 军师看不到按钮
- **WHEN** 军师在聊天页面
- **THEN** 不显示"发起暧昧期"按钮

#### Scenario: 确认弹窗
- **WHEN** 当事人 B 收到 `proposeFlirting` 事件
- **THEN** 页面弹出确认弹窗，内容为"对方希望进入暧昧期，交换联系方式？"，提供"同意"和"再想想"两个按钮
