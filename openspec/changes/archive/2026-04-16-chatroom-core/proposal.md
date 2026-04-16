## Why

Violet 平台的核心差异化在于"军师代聊"机制，而四人三边聊天室是这个机制的载体。当前项目仅有数据库 schema 和空的 NestJS/React 脚手架，Socket.io 虽已安装但无任何实时通信实现。聊天室是整个平台的枢纽——牵线期、破冰期、暧昧期三个阶段的状态流转都围绕它展开。没有可用的聊天室，其他所有功能（军师大厅、信用分系统、帖子大厅）都无法端到端验证。

同时，聊天室是系统中最复杂的组件：涉及实时双向通信、权限矩阵（四种角色 × 三种介入模式）、消息确认流程、房间生命周期管理。缺乏配套的测试设施将导致后期难以验证正确性和回归安全性。因此将聊天室核心与测试设施作为一个整体变更来交付。

## What Changes

- **新增 Socket.io Gateway 层**：实现 NestJS WebSocket Gateway，管理房间创建/加入/离开、消息广播、在线状态
- **新增消息服务层**：基于 Prisma 的消息持久化，支持普通消息、系统消息、待确认消息三种类型
- **新增房间权限控制**：基于角色的消息可见性和发送权限矩阵（当事人 × 2 + 军师 × 2，三种介入模式）
- **新增关系状态驱动聊天室生命周期**：牵线期→破冰期→暧昧期的状态流转触发聊天室权限变化
- **新增客户端聊天 UI 组件**：基于 React + Zustand 的聊天界面，包含主聊天窗口和军师私聊窗口
- **新增客户端 Socket 连接管理**：Zustand store 管理 Socket.io 连接状态、房间状态、消息缓存
- **新增 Redis 在线状态与会话缓存**：利用 Redis 发布/订阅和缓存管理在线状态和临时消息
- **新增端到端测试基础设施**：基于 Jest + Socket.io-client 的集成测试框架，覆盖聊天室核心流程
- **新增单元测试基础设施**：NestJS Service/Gateway 层的单元测试骨架

## Capabilities

### New Capabilities

- `realtime-chatroom`: 四人三边实时聊天室的核心能力——房间管理、消息收发、在线状态、Socket.io 通信
- `wingman-modes`: 军师三种介入模式（Solo代聊、私聊、辅助）的权限控制与消息流转逻辑
- `chatroom-lifecycle`: 聊天室随关系状态（牵线期→破冰期→暧昧期）的生命周期管理
- `chat-client`: 前端聊天界面组件、Zustand 状态管理、Socket.io 客户端连接管理
- `testing-infra`: 聊天室相关的单元测试与集成测试基础设施，含测试工具函数和 mock 机制

### Modified Capabilities

（无已有 capability 需要修改——这是首次实现）

## Impact

- **后端新增模块**：`ChatModule`、`ChatGateway`（Socket.io）、`ChatService`、`RoomService`、`PresenceService`
- **后端依赖变化**：启用已安装的 `@nestjs/platform-socket.io`、`socket.io`、Redis（`ioredis` 或 `@nestjs/cache-manager`）
- **Prisma schema**：`Message` 和 `WingmanAssignment` 模型已存在，可能需要新增字段（如消息类型枚举、已读状态等）
- **前端新增**：聊天页面组件、消息列表组件、输入框组件、Socket hook、聊天相关 Zustand store
- **前端依赖变化**：需安装 `socket.io-client`
- **API 影响**：新增 REST 端点（历史消息加载、房间信息）和 WebSocket 事件集
- **测试新增**：服务端 `*.spec.ts` 单元测试、`*.e2e-spec.ts` 集成测试、测试工具模块
