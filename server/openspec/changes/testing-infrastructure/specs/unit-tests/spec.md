## ADDED Requirements

### Requirement: ChatService.computeVisibility 单元测试
系统 SHALL 为 `computeVisibility` 方法提供完整的单元测试覆盖，验证所有消息类型和军师模式的组合。

#### Scenario: SYSTEM 消息对所有人可见
- **WHEN** 消息类型为 SYSTEM
- **THEN** 无论 viewer 角色如何，`canSee` SHALL 为 true

#### Scenario: MAIN 消息对当事人始终可见
- **WHEN** 消息类型为 MAIN，viewer 为 client1 或 client2
- **THEN** `canSee` SHALL 为 true

#### Scenario: MAIN 消息对 SOLO 模式军师可见
- **WHEN** 消息类型为 MAIN，viewer 为 wingman 且对应军师模式为 SOLO
- **THEN** `canSee` SHALL 为 true

#### Scenario: MAIN 消息对 ASSIST 模式军师可见
- **WHEN** 消息类型为 MAIN，viewer 为 wingman 且对应军师模式为 ASSIST
- **THEN** `canSee` SHALL 为 true

#### Scenario: MAIN 消息对 PRIVATE 模式军师不可见
- **WHEN** 消息类型为 MAIN，viewer 为 wingman 且对应军师模式为 PRIVATE
- **THEN** `canSee` SHALL 为 false

#### Scenario: PRIVATE 消息仅参与方可见
- **WHEN** 消息类型为 PRIVATE
- **THEN** 仅 senderId 或 targetUserId 匹配 viewerId 时 `canSee` SHALL 为 true，其他人 SHALL 为 false

#### Scenario: PENDING 消息仅参与方可见
- **WHEN** 消息类型为 PENDING
- **THEN** 仅 senderId 或 targetUserId 匹配 viewerId 时 `canSee` SHALL 为 true，其他人 SHALL 为 false

#### Scenario: 未知消息类型不可见
- **WHEN** 消息类型不在 SYSTEM/MAIN/PRIVATE/PENDING 中
- **THEN** `canSee` SHALL 为 false

#### Scenario: wingman1 和 wingman2 分别使用对应模式
- **WHEN** viewerRole 为 wingman1 时使用 wingmanMode1，viewerRole 为 wingman2 时使用 wingmanMode2
- **THEN** `canSee` SHALL 基于对应的模式计算

### Requirement: ChatLifecycleService.transitionStatus 单元测试
系统 SHALL 为状态机流转提供单元测试，验证合法和非法状态转换。

#### Scenario: MATCHING → ICEBREAKING 转换成功
- **WHEN** 当前状态为 MATCHING，请求转换为 ICEBREAKING
- **THEN** SHALL 返回 type 为 `roomOpened` 的 LifecycleEvent

#### Scenario: ICEBREAKING → FLIRTING 转换成功
- **WHEN** 当前状态为 ICEBREAKING，请求转换为 FLIRTING
- **THEN** SHALL 返回 type 为 `roomClosed`、reason 为 `FLIRTING` 的 LifecycleEvent

#### Scenario: 任意状态 → ENDED 转换成功
- **WHEN** 请求转换为 ENDED
- **THEN** SHALL 返回 type 为 `roomEnded`、reason 为 `ENDED` 的 LifecycleEvent，包含 disconnectedUserIds

#### Scenario: 相同状态转换返回 null
- **WHEN** 当前状态与请求状态相同
- **THEN** SHALL 返回 null

#### Scenario: Relationship 不存在时抛出异常
- **WHEN** 传入不存在的 relationshipId
- **THEN** SHALL 抛出 "Relationship not found" 错误

### Requirement: RoomService 单元测试
系统 SHALL 为 RoomService 的纯逻辑方法提供单元测试。

#### Scenario: getRoomId 返回正确格式
- **WHEN** 传入 relationshipId 为 `rel_123`
- **THEN** SHALL 返回 `relationship:rel_123`
