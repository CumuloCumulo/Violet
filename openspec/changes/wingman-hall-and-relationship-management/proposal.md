## Why

注册与牵线流程已完成，聊天室的三边通信和军师介入模式也已实现，但整个用户流程中存在三处断裂：(1) 牵线接受后双方找不到进入聊天的入口，因为没有"关系列表"页面；(2) 破冰期聊天中没有发布军师任务的 UI，军师也无法通过"军师大厅"接单加入聊天，导致军师介入模式虽然代码完整但无法被触发；(3) 聊天没有"毕业出口"——当事人无法触发暧昧期流程来交换联系方式和结算军师。这三处断裂使得产品从注册到聊天室关闭的完整闭环无法跑通，内测无法进行。

## What Changes

- 新增"关系列表"功能：当事人可查看所有进行中的关系（破冰期），点击直接进入聊天页面；军师可查看自己介入中的关系
- 新增"军师大厅"模块（后端 + 前端）：`WingmanTask` 模型已在 Prisma schema 中定义但无后端实现，需新建 WingmanTaskModule（Controller + Service），提供任务的 CRUD、申请、审批接口
- 聊天页面增强：在 ChatPage 中新增侧边面板，包含"发布军师任务"、查看/审批申请人、"触发暧昧期"等 UI
- 新增军师大厅页面：军师可浏览所有 OPEN 状态的任务并申请接单，申请后等待当事人审批
- 接入暧昧期触发流程：当事人在聊天页发起"进入暧昧期"，对方确认后交换联系方式（微信/QQ），军师自动退出并进入评价结算
- 前端路由扩展：authStore 中 `AppPage` 类型新增 `'wingman-hall'` 页面，DiscoveryPage 新增"关系"tab

## Capabilities

### New Capabilities

- `wingman-task`: 军师任务的完整生命周期——当事人在聊天页发布任务（标题 + 描述），军师在大厅浏览并申请，当事人在聊天页审批申请人，审批通过后创建 WingmanAssignment 并通知双方
- `relationship-list`: 关系列表管理——查询当前用户的所有活跃关系（ICEBREAKING 状态），展示关系状态、对方匿名信息、军师信息，提供进入聊天的入口
- `flirting-transition`: 暧昧期触发与结算——一方发起暧昧期请求，对方确认后自动交换联系方式（微信/QQ），所有军师强制退出，聊天室关闭，进入评价流程

### Modified Capabilities

_(无现有 spec 需要修改)_

## Impact

- **后端**: 新增 WingmanTaskModule（Controller + Service + Module），DiscoveryModule 新增关系列表 endpoint，ChatGateway 的 `transitionStatus` 事件需在前端接入
- **前端**: DiscoveryPage 新增"关系"tab；ChatPage 新增可折叠侧边面板（军师任务管理 + 暧昧期触发）；新增 WingmanHallPage；authStore 扩展 `AppPage` 类型和路由
- **数据库**: WingmanTask 模型已存在，WingmanAssignment 模型已存在，无需 schema 变更
- **API**: 新增 ~6 个 HTTP endpoint（任务 CRUD、申请、审批），Discovery 新增 1 个 endpoint（关系列表）
