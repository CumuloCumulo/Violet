## ADDED Requirements

### Requirement: 当事人可发布军师任务
当事人在破冰期聊天页面中，可打开"军师面板"发布军师招募任务。任务 MUST 包含标题和描述字段。系统 SHALL 将任务与当前 relationshipId 绑定。每个关系每侧（side 1 / side 2）MUST 最多只有一条 OPEN 状态的任务。

#### Scenario: 发布任务成功
- **WHEN** 当事人在聊天页军师面板中填写标题和描述并点击"发布任务"
- **THEN** 系统创建 WingmanTask（status=OPEN，clientId=当前用户，relationshipId=当前关系ID），任务出现在军师大厅中

#### Scenario: 重复发布被拒绝
- **WHEN** 当事人已为当前关系的己方发布了一条 OPEN 状态的任务，再次尝试发布
- **THEN** 系统返回错误提示"已有一条进行中的招募任务"

### Requirement: 军师可浏览任务大厅
已通过军师认证（wingmanCertStatus=APPROVED）的用户可访问军师大厅页面，浏览所有 OPEN 状态的军师任务。任务卡片 MUST 展示当事人的匿名标签（性别、校区、兴趣标签）和任务描述，MUST NOT 展示当事人的昵称、头像或其他身份信息。

#### Scenario: 军师浏览任务列表
- **WHEN** 已认证军师进入军师大厅页面
- **THEN** 系统返回所有 status=OPEN 的 WingmanTask 列表，每条任务展示当事人匿名标签、任务标题和描述

#### Scenario: 未认证用户无法访问
- **WHEN** 未通过军师认证的用户尝试访问军师大厅
- **THEN** 系统显示"请先完成军师认证"提示

### Requirement: 军师可申请接单
军师在任务大厅中对感兴趣的任务点击"申请接单"。系统 SHALL 记录申请状态，并通知当事人。同一任务 MUST 不允许重复申请。

#### Scenario: 申请接单成功
- **WHEN** 军师对一条 OPEN 状态的任务点击"申请接单"
- **THEN** 任务状态更新为 ASSIGNED（wingmanId=当前军师ID），当事人聊天页面的军师面板中出现该申请

#### Scenario: 重复申请被拒绝
- **WHEN** 军师对已 ASSIGNED 的任务再次申请
- **THEN** 系统返回错误提示"该任务已被申请"

### Requirement: 当事人可审批军师申请
当事人在聊天页面的军师面板中可查看申请该任务的军师信息（昵称、标签），并选择同意或拒绝。

#### Scenario: 同意军师申请
- **WHEN** 当事人在军师面板中点击"同意"某个军师的申请
- **THEN** 系统创建 WingmanAssignment（side=当事人所在侧，mode=PRIVATE），任务状态更新为 IN_PROGRESS，军师可通过 joinRoom 进入聊天室

#### Scenario: 拒绝军师申请
- **WHEN** 当事人在军师面板中点击"拒绝"某个军师的申请
- **THEN** 任务状态恢复为 OPEN，wingmanId 清空，其他军师可重新申请

### Requirement: 当事人可取消军师任务
当事人在军师面板中可取消自己发布的任务。

#### Scenario: 取消未接任务
- **WHEN** 当事人取消一条 OPEN 状态的任务（无军师申请）
- **THEN** 任务状态更新为 CANCELLED

#### Scenario: 取消进行中的任务并请出军师
- **WHEN** 当事人取消一条 IN_PROGRESS 状态的任务
- **THEN** 任务状态更新为 CANCELLED，对应 WingmanAssignment 的 leftAt 设为当前时间，军师被移出聊天室

### Requirement: 后端 WingmanTask API
系统 MUST 提供以下 HTTP API（均需 JWT 认证）：

#### Scenario: 创建任务
- **WHEN** POST /api/wingman-task，body 含 { relationshipId, title, description }
- **THEN** 创建 WingmanTask 并返回

#### Scenario: 浏览任务大厅
- **WHEN** GET /api/wingman-task（需 WINGMAN 角色）
- **THEN** 返回所有 OPEN 状态的任务列表，含当事人匿名标签

#### Scenario: 申请接单
- **WHEN** POST /api/wingman-task/:id/apply（需 WINGMAN 角色）
- **THEN** 更新任务状态为 ASSIGNED

#### Scenario: 审批申请
- **WHEN** POST /api/wingman-task/:id/approve 或 /api/wingman-task/:id/reject
- **THEN** 同意则创建 WingmanAssignment，拒绝则重置任务为 OPEN

#### Scenario: 取消任务
- **WHEN** DELETE /api/wingman-task/:id
- **THEN** 取消任务，如有军师则移出
