## Context

Violet 平台已完成注册→画像→牵线→接受→聊天的核心链路（后端 + 前端），聊天室的三边通信（当事人双方 + 军师）和三种介入模式（SOLO/ASSIST/PRIVATE）也已实现并通过 DEV 模式验证。但当前存在三处流程断裂：

1. **没有关系列表**：牵线接受后只在 acceptRequest 回调中立即进入聊天，用户离开后无法再次进入。DiscoveryPage 只有"发现/已发起/收到心动"三个 tab，没有展示进行中关系。
2. **没有军师接入通道**：WingmanAssignment 模型和聊天室内的军师模式逻辑完整，但缺少军师如何加入的入口——当事人无法发布任务，军师无法浏览和申请。
3. **没有毕业出口**：ChatGateway 已实现 `transitionStatus` 事件，ChatLifecycleService 已处理 FLIRTING 状态转换（军师自动退出、系统消息），但前端没有触发入口和联系方式交换 UI。

数据库层面，`WingmanTask` 和 `WingmanAssignment` 模型已在 Prisma schema 中定义，无需新增迁移。后端使用 NestJS + Prisma + PostgreSQL + Redis，前端使用 React + Zustand + Socket.io-client。

## Goals / Non-Goals

**Goals:**
- 实现关系列表页/Tab，让用户能随时进入进行中的聊天
- 实现军师任务发布、申请、审批的完整流程，让军师能真正加入聊天
- 实现暧昧期触发、联系方式交换、军师自动退出的前端闭环
- 所有新 UI 与现有 Violet 毛玻璃设计风格保持一致

**Non-Goals:**
- 军师个人主页和评价展示系统（属于 profile-center-and-admin-dashboard 变更）
- 帖子大厅（社区树洞）——后续变更
- 信用分互评惩罚机制（后续变更，本次仅完成流程闭环）
- 军师任务的高级功能（指定军师、任务分类筛选）

## Decisions

### 1. 关系列表：复用 DiscoveryPage 新增 Tab

**选择**: 在 DiscoveryPage 现有 tab 栏（发现/已发起/收到心动）右侧新增"关系"tab。

**理由**: 关系列表与发现、牵线请求同属"用户的社交入口"，放在同一页面减少导航层级。用户登录后的默认页面就是 DiscoveryPage，新增 tab 使得进入聊天只需两步（切换 tab → 点击关系卡片）。

**备选方案**:
- 独立 RelationshipListPage：增加页面数量，导航成本更高
- 首页 Dashboard：与当前架构（Zustand page 状态机）不太匹配

### 2. 军师任务发布：ChatPage 侧边栏面板

**选择**: 在 ChatPage 右侧新增可折叠的"军师面板"，包含发布任务、查看申请人、审批/拒绝、触发暧昧期等功能。

**理由**: 军师任务与具体聊天室强绑定——当事人发布任务是为了给"当前这个关系"找军师。将发布和审批 UI 放在聊天页面内，避免用户在多个页面间跳转。可折叠设计保证聊天空间不被压缩太多。

```
┌────────────────────────┬──────────────┐
│                        │ 军师面板 ▾    │
│     主聊天窗口          │              │
│                        │ [发布任务]    │
│                        │              │
│                        │ 申请人列表    │
│                        │ · 军师A [✓][✗]│
│                        │              │
│                        │ 已加入军师    │
│                        │ · 军师B [请出]│
│                        │              │
│                        │ ──────────── │
│                        │ [发起暧昧期]  │
├────────────────────────┴──────────────┤
│  私聊窗口（如军师在线）                 │
└───────────────────────────────────────┘
```

### 3. WingmanTask 与 Relationship 的关联方式

**选择**: WingmanTask 通过 `clientId` 关联当事人，不直接关联 `relationshipId`。当事人在聊天页发布任务时，后端自动将任务与当前 relationshipId 绑定。

**理由**: Prisma schema 中 WingmanTask 只有 `clientId` 字段，没有 `relationshipId`。需要新增字段关联。但如果一个当事人同时有多个关系，每个关系可能需要不同的军师。

**实际方案**: 在 WingmanTask 模型新增 `relationshipId` 字段（可选），使任务与具体关系绑定。发布任务时自动填入当前 relationshipId。

### 4. 军师大厅：独立页面

**选择**: 新增 `WingmanHallPage` 作为独立页面，通过顶部导航或侧边入口访问。

**理由**: 军师视角和当事人视角完全不同——军师需要一个全局视野浏览所有待接任务，这与聊天页的"聚焦当前关系"设计冲突。独立页面也更符合需求文档中"军师大厅"的定位。

### 5. 暧昧期触发：双方确认机制

**选择**: 一方在 ChatPage 点击"发起暧昧期"，后端创建一个待确认状态，通过 socket 通知对方。对方在聊天页看到确认弹窗，同意后执行状态转换。

**理由**: 需求文档明确要求"双方互相同意进入暧昧期后"才交换联系方式。单方面触发不符合业务需求。

**实现方式**: 利用现有 `transitionStatus` socket event，前端添加确认弹窗流程。具体为：A 点击发起 → 发送 `proposeFlirting` 自定义事件 → B 收到弹窗 → B 确认 → B 发送 `transitionStatus(FLIRTING)` → 后端执行状态转换、交换联系方式、军师退出。

### 6. 后端模块结构

**选择**: 新建 `WingmanTaskModule`（独立的 NestJS 模块），包含 WingmanTaskController 和 WingmanTaskService。

**理由**: WingmanTask 有独立的 CRUD 生命周期（创建、申请、审批、取消），与 Discovery 模块的职责不同。保持模块边界清晰。

```
server/src/
├── wingman-task/           # 新增
│   ├── wingman-task.module.ts
│   ├── wingman-task.controller.ts
│   └── wingman-task.service.ts
├── discovery/              # 修改：新增 listRelationships
├── chat/                   # 修改：新增 proposeFlirting 事件处理
└── ...
```

### 7. Prisma Schema 变更

**选择**: 在 WingmanTask 模型新增 `relationshipId` 可选字段。

```prisma
model WingmanTask {
  // ... 现有字段
  relationshipId String?   // 关联的具体关系
  relationship   Relationship? @relation(fields: [relationshipId], references: [id])
}
```

Relationship 模型新增反向关系：
```prisma
model Relationship {
  // ... 现有字段
  wingmanTasks   WingmanTask[]
}
```

## Risks / Trade-offs

**[风险] WingmanTask 关系变更需要数据库迁移** → 缓解：仅新增可选字段 `relationshipId`，不影响现有数据。执行 `prisma migrate dev` 即可。

**[风险] 侧边栏面板压缩聊天空间** → 缓解：面板可折叠，默认折叠。移动端可改为底部抽屉。

**[风险] 暧昧期确认流程依赖 socket 实时性** → 缓解：如果对方不在线，可以通过页面级轮询或下次进入聊天时弹出待确认提示。MVP 阶段可先仅支持双方在线时触发。

**[权衡] 军师审批流程简化** → 选择当事人在聊天页直接看到申请人列表并一键审批，不做复杂的军师主页查看流程。简化了实现，但当事人对军师的了解有限（只能看到标签和昵称）。

## Open Questions

- 军师申请接单时是否需要写一段"自我推荐"？还是直接申请等待审批？（建议 MVP 阶段直接申请，不需要自荐文本）
- 一个关系最多可以有几个军师？schema 限制每侧 1 个（@@unique([relationshipId, side])），是否足够？
- 暧昧期触发后，联系方式交换是自动展示还是需要用户手动点击"查看对方微信"？（建议自动展示，增加仪式感）
