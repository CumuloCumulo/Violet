# dev-test-login Specification

## Purpose
Provides development-mode tooling for quick login and chat room selection. Enables developers to bypass manual credential entry by selecting users and chat rooms from a card-based UI, backed by DEV-only API endpoints.
## Requirements
### Requirement: DEV 用户列表 API
系统 SHALL 在开发模式下提供 `GET /api/dev/users` 端点，返回数据库中所有用户的 id、nickname、gender、campus、roles。该端点 MUST 仅在非生产环境下可用。

#### Scenario: 获取用户列表
- **WHEN** 前端在开发模式调用 `GET /api/dev/users`
- **THEN** 返回 200 和用户列表数组，每项包含 `{ id, nickname, gender, campus, roles }`

#### Scenario: 生产环境不可访问
- **WHEN** 应用在生产环境运行
- **THEN** `GET /api/dev/users` 返回 404 或不注册该路由

### Requirement: DEV 聊天室列表 API
系统 SHALL 在开发模式下提供 `GET /api/dev/relationships` 端点，返回所有 ICEBREAKING 状态的关系，包含双方当事人信息和军师分配信息。

#### Scenario: 获取聊天室列表
- **WHEN** 前端在开发模式调用 `GET /api/dev/relationships`
- **THEN** 返回 200 和聊天室列表数组，每项包含 `{ id, status, user1: { id, nickname }, user2: { id, nickname }, assignments: [{ userId, nickname, side, mode }] }`

### Requirement: 分步选择式登录界面
DEV 模式登录页 SHALL 使用分步选择 UI：第一步选择身份（当事人/军师），第二步从用户卡片列表中选择具体用户，第三步选择要加入的聊天室。

#### Scenario: 选择当事人身份
- **WHEN** 用户选择"当事人"身份
- **THEN** 第二步仅显示 roles 包含 CLIENT 的用户卡片

#### Scenario: 选择军师身份
- **WHEN** 用户选择"军师"身份
- **THEN** 第二步仅显示 roles 包含 WINGMAN 的用户卡片

#### Scenario: 用户卡片展示
- **WHEN** 用户列表渲染
- **THEN** 每张卡片显示用户昵称和 ID（小字），当事人用人物图标，军师用军师图标区分

#### Scenario: 聊天室列表过滤
- **WHEN** 用户选择了身份和具体用户后进入第三步
- **THEN** 仅显示该用户有权加入的聊天室（当事人显示自己所在的聊天室，军师显示自己被分配到的聊天室）

#### Scenario: 聊天室卡片展示
- **WHEN** 聊天室列表渲染
- **THEN** 每张卡片显示聊天室 ID、双方当事人昵称（小明 ↔ 小红）、以及已分配的军师信息（昵称 + 当前模式）

#### Scenario: 快速进入聊天
- **WHEN** 三个步骤全部完成并点击"进入聊天"
- **THEN** 系统使用选定的 userId、relationshipId 进入聊天页；若为军师身份则同时传入 wingmanId

### Requirement: 选择后自动填充参数
选好用户和聊天室后，系统 SHALL 自动计算并填充 ChatPage 所需的 userId、relationshipId、wingmanId 参数。

#### Scenario: 当事人参数填充
- **WHEN** 用户选择当事人身份并选择具体用户和聊天室
- **THEN** `userId` = 选中的用户 ID，`relationshipId` = 选中的聊天室 ID，`wingmanId` 根据该聊天室的军师分配自动填充

#### Scenario: 军师参数填充
- **WHEN** 用户选择军师身份并选择具体用户和聊天室
- **THEN** `userId` = 选中的军师 ID，`relationshipId` = 选中的聊天室 ID，`wingmanId` = 选中的军师 ID
