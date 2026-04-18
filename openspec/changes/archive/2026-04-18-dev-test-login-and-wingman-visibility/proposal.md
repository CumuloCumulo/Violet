## Why

当前登录页（DEV MODE）要求手动输入 userId、relationshipId、wingmanId 等原始 ID，测试体验差。同时军师模式切换的 UI 存在逻辑问题：当事人切换模式后，军师端的主聊天窗口可见性没有同步响应——军师在 PRIVATE 模式下主窗口被完全隐藏，但切换到 ASSIST/SOLO 后也看不到，因为 `modeSwitched` 事件只打了 console.log 没更新 store 和 UI 状态。

## What Changes

- **DEV 登录页改造为选择式 UI**：从后端 API 拉取 seed 用户列表和聊天室列表，用户通过点击选择身份（当事人/军师）和具体用户，无需手动输入 ID
- **新增后端 API 端点**：`GET /api/dev/users`（返回所有测试用户及其角色）、`GET /api/dev/relationships`（返回所有 ICEBREAKING 状态的聊天室及其成员信息）
- **军师主聊天窗口可见性修复**：`modeSwitched` socket 事件需要更新 store 中的 wingmanMode 状态，军师端根据当前模式动态控制主聊天窗口的显示/隐藏
- **当事人端模式状态同步**：当事人切换模式后，本地 UI 状态也需同步更新（当前 wingmanMode 只是 prop，不随 socket 事件变化）

## Capabilities

### New Capabilities

- `dev-test-login`: DEV 模式下的选择式登录页，包含身份选择、用户选择、聊天室选择三个步骤，通过后端 API 获取测试数据

### Modified Capabilities

- `chat-page-redesign`: 军师主聊天窗口可见性改为由 wingmanMode 状态动态控制；modeSwitched 事件需要同步更新前端 store 状态
- `login-page-redesign`: DEV 模式登录页从手动输入 ID 改为选择式 UI（正式登录页不在本次范围）

## Impact

- **新增后端 API**：`GET /api/dev/users`、`GET /api/dev/relationships`（仅 DEV 模式可用）
- **App.tsx**：登录表单完全重构为选择式 UI
- **chatStore.ts**：新增 `wingmanMode` 到 RoomState，`modeSwitched` 事件更新 store
- **ChatPage.tsx**：wingmanMode 从 store 读取而非 prop，军师端根据模式动态显示/隐藏主窗口
