## Context

当前 Violet 的 DEV 登录页（`App.tsx`）是一个简单的三字段表单，要求手动输入 `userId`、`relationshipId`、`wingmanId`。这些 ID 是 seed 数据中硬编码的值（如 `test_client1`、`test_relationship_1`），测试时需要反复输入或修改默认值。

后端 seed 数据（`server/prisma/seed.ts`）包含 4 个用户（2 当事人 + 2 军师）和 1 个聊天室。后端已有完整的 WebSocket gateway（`ChatGateway`）处理消息收发、模式切换等逻辑。

前端的军师模式切换存在状态断裂：`ChatPage` 通过 prop 接收 `wingmanMode`，但 `switchMode` 只 emit socket 事件，`modeSwitched` 事件回调只做了 `console.log`。这意味着当事人切换模式后，军师端 UI 不会响应。

## Goals / Non-Goals

**Goals:**
- DEV 登录页改为点击选择式 UI，测试时零键盘输入
- 用户从 seed 用户列表中选择身份和具体用户
- 根据选择的用户自动筛选可加入的聊天室
- 军师模式切换的完整状态同步：当事人操作 → 服务端广播 → 前端 store 更新 → UI 响应

**Non-Goals:**
- 正式登录/注册系统（邮箱验证、密码登录等）
- 新增 seed 数据或修改数据模型
- 消息转发 UI（本次只修登录页和模式同步）

## Decisions

### 1. DEV 登录页采用分步选择式 UI（Step-based Picker）

**选择**: 三步流程——选身份 → 选用户 → 选聊天室

```
┌──────────────────────────────────────┐
│  Step 1: 选择身份                     │
│  ┌─────────┐  ┌──────────┐           │
│  │ 当事人   │  │  军师     │           │
│  └─────────┘  └──────────┘           │
│                                      │
│  Step 2: 选择用户                     │
│  ┌──────────────────────────────┐    │
│  │ 👤 小明 (test_client1)       │    │
│  │ 👤 小红 (test_client2)       │    │
│  │ 🎯 军师·阿杰 (test_wingman1) │    │
│  │ 🎯 军师·小美 (test_wingman2) │    │
│  └──────────────────────────────┘    │
│                                      │
│  Step 3: 选择聊天室                   │
│  ┌──────────────────────────────┐    │
│  │ 💬 test_relationship_1       │    │
│  │    小明 ↔ 小红               │    │
│  │    军师: 阿杰(私聊) 小美(辅助)│    │
│  └──────────────────────────────┘    │
│                                      │
│       [ 进入聊天 ]                    │
└──────────────────────────────────────┘
```

**理由**: 分步选择比一次性表单更直观，且可以动态过滤（选当事人 → 只显示当事人用户；选军师 → 只显示有 WINGMAN 角色的用户）。替代方案是纯下拉菜单，但卡片式选择在移动端体验更好。

### 2. 新增两个轻量 DEV API

**选择**: 在后端添加 `DevController`，暴露 `GET /api/dev/users` 和 `GET /api/dev/relationships`

```typescript
// GET /api/dev/users
// 返回: [{ id, nickname, gender, campus, roles, avatar }]

// GET /api/dev/relationships
// 返回: [{ id, status, user1: { id, nickname }, user2: { id, nickname },
//          assignments: [{ userId, nickname, side, mode }] }]
```

**理由**: 直接从数据库读取，不硬编码。seed 数据变化后自动生效。替代方案是在前端硬编码用户列表，但这会让 seed 和前端产生耦合。通过 `if (process.env.NODE_ENV !== 'production')` 守卫，确保生产环境不暴露。

### 3. wingmanMode 状态管理改为 store-driven

**选择**: 在 `chatStore` 的 `RoomState` 中维护 `wingmanMode1` 和 `wingmanMode2`，`modeSwitched` socket 事件更新 store

```
当前流程（断裂）:
  当事人点击模式 → socket.emit('switchMode') → 服务端广播 modeSwitched
  → 前端 console.log ← 断在这里

修复后流程:
  当事人点击模式 → socket.emit('switchMode') → 服务端广播 modeSwitched
  → store 更新 wingmanMode ← 修复
  → ChatPage 从 store 读取 ← 修复
  → 军师端 showMainPanel 动态响应 ← 修复
```

**理由**: 状态应该在 store 中统一管理，而不是通过 prop drilling。`modeSwitched` 事件已包含 `{ wingmanId, mode }`，只需在 store 中匹配更新即可。

### 4. 军师主窗口可见性逻辑

**选择**: 军师端根据自身的 mode 决定是否显示主聊天窗口

| 模式 | 军师私聊窗口 | 主聊天窗口（当事人间对话） |
|------|------------|------------------------|
| PRIVATE | 显示 | 隐藏 |
| ASSIST | 显示 | 显示（只读 + 草拟消息） |
| SOLO | 显示 | 显示（直接代发） |

`ChatPage` 的 `showMainPanel` 逻辑改为：军师时，从 store 读取自己的 mode，仅 PRIVATE 时隐藏。

## Risks / Trade-offs

- **DEV API 暴露测试数据** → 通过环境守卫限制仅开发模式可用，不影响生产
- **多军师时 wingmanMode 需按 side 区分** → store 已有 `wingmanMode1`/`wingmanMode2`，军师只需读取自己 side 的 mode
- **登录页只支持 DEV 模式** → 正式登录页后续单独设计，本次改动完全在 `DEV_MODE` 条件分支内
