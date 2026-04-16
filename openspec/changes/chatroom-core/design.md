## Context

Violet 是一个面向南大学生的校园恋爱代聊平台。当前项目状态：

- **数据库层**：Prisma schema 已设计完成并迁移，`Message`、`Relationship`、`WingmanAssignment` 等核心模型已就绪
- **后端**：NestJS 脚手架为空，仅有 `AppModule`，无任何业务模块。`@nestjs/platform-socket.io` 和 `socket.io` 已在 dependencies 中
- **前端**：React + Vite + Tailwind 空项目，Zustand 已安装但无 store
- **Redis**：环境变量已配置（localhost:6379），代码中未使用
- **测试**：仅 Jest 配置存在，无实际测试代码

核心业务流程为三阶段（牵线→破冰→暧昧），聊天室主要服务于破冰期。聊天室的参与者最多四人：两位当事人 + 两位军师（各绑定一方）。军师有三种介入模式（Solo 代聊、私聊、辅助），决定其在聊天室中的可见性和操作权限。

## Goals / Non-Goals

**Goals:**

- 实现基于 Socket.io 的实时聊天室核心，支持最多四人的房间管理
- 实现军师三种介入模式的权限隔离与消息流转
- 聊天室生命周期与关系状态（RelationshipStatus）联动
- 消息持久化到 PostgreSQL，在线状态缓存到 Redis
- 前端聊天 UI 与 Socket 连接管理
- 建立可运行的单元测试与集成测试基础设施

**Non-Goals:**

- 不实现用户认证/注册（假设已有 userId，通过 mock 或简单 token）
- 不实现军师大厅、任务发布（属于独立模块）
- 不实现信用分系统、评价系统
- 不实现图片/文件传输（仅文字 + 内置表情）
- 不实现消息加密（后续安全迭代）
- 不实现消息已读回执（可作为后续增强）
- 不实现离线消息推送（本次仅在线实时通信）

## Decisions

### D1: Socket.io 作为实时通信层（而非原生 WebSocket）

**选择**：Socket.io

**备选**：原生 WebSocket（ws 库）、NestJS 纯 Gateway

**理由**：
- Socket.io 提供房间（Room）抽象，天然匹配"聊天室"概念
- 自动重连、命名空间、消息确认等开箱即用
- `@nestjs/platform-socket.io` 已安装，与 NestJS Gateway 模式深度集成
- 客户端 `socket.io-client` 生态成熟

### D2: 房间模型设计——单一房间 + 通道隔离

**选择**：一个 Relationship 对应一个 Socket.io Room，通过消息元数据（senderRole、visibility）实现通道隔离

**备选**：每个 Relationship 创建多个子房间（主聊天室、军师A私聊、军师B私聊）

**理由**：
- 需求文档明确"三边/四边聊天室"是单一空间，军师通过权限模式控制可见性
- 多子房间增加复杂度：需要管理房间间的消息同步
- 单一房间 + 消息可见性过滤更符合业务语义——"一个聊天室，不同角色看到不同内容"
- 客户端根据消息元数据过滤显示即可

```
Room: relationship:{id}
├── 参与者: user1, user2, wingman1, wingman2
├── 消息类型:
│   ├── MAIN: 主窗口消息（所有人可见）
│   ├── PRIVATE: 私聊消息（仅当事人+己方军师可见）
│   └── CONFIRM: 待确认消息（军师草拟 → 当事人确认 → 变为 MAIN）
└── 权限由 sender.role + wingmanMode 控制
```

### D3: 消息可见性——服务端过滤

**选择**：服务端在广播消息时根据接收者的角色和当前介入模式过滤

**备选**：客户端过滤（广播所有消息，客户端决定显示哪些）

**理由**：
- 隐私安全：军师在"私聊模式"下不应看到主窗口消息，客户端过滤会导致数据泄露
- 一致性：服务端作为权限唯一权威，避免客户端篡改
- 实现方式：Gateway 在 `handleMessage` 中根据 Room 内各连接的角色，逐个 socket 发送或使用 Room + except

### D4: Redis 用于在线状态 + 消息缓冲

**选择**：Redis 存储 `userId → socketId` 映射、在线状态、未读计数

**备选**：纯数据库、内存 Map

**理由**：
- 在线状态是高频读写、允许丢失的数据，适合 Redis
- 多实例部署时需要共享状态（虽然当前单实例，但架构预留）
- 未读消息计数缓存减轻数据库压力
- Redis 已在环境变量中配置，直接使用

数据结构设计：
```
# 在线状态
presence:{userId} → { socketId, relationshipId, role, connectedAt }

# 关系房间在线成员
room:{relationshipId}:members → Set<userId>

# 未读计数
unread:{relationshipId}:{userId} → count
```

### D5: 前端状态管理——Zustand + Socket.io 集成

**选择**：Zustand store 统一管理 Socket 连接状态、消息列表、房间信息

**架构**：
```
useChatStore (Zustand)
├── socket: Socket | null          // 连接实例
├── rooms: Map<relId, RoomState>   // 房间状态
├── messages: Map<relId, Message[]>// 消息缓存
├── activeRoom: string | null      // 当前房间
├── connect(userId, token)         // 建立连接
├── joinRoom(relationshipId)       // 加入房间
├── sendMessage(content, type)     // 发送消息
└── confirmMessage(messageId)      // 确认消息（辅助模式）
```

### D6: 测试策略

**选择**：分层测试

**单元测试**（Jest）：
- `ChatService`：消息创建、权限校验、状态流转逻辑
- `RoomService`：房间创建/加入/权限矩阵
- `PresenceService`：在线状态管理
- Gateway 不做单元测试（依赖 Socket.io 运行时，测试性价比低）

**集成测试**（Jest + `@nestjs/testing` + `socket.io-client`）：
- 启动完整 NestJS 应用（内存数据库或测试数据库）
- 多个 Socket.io 客户端模拟四人场景
- 端到端验证消息流转、权限隔离、状态流转

**测试工具**：
- `TestApp`：封装 NestJS 测试模块创建
- `TestClient`：封装 Socket.io-client 连接，提供 `waitForEvent`、`joinRoom` 等辅助方法
- `Fixture`：创建测试用户、关系、军师分配

### D7: Prisma Schema 变更

当前 `Message` 模型缺少消息类型和可见性字段。需要新增：

```prisma
enum MessageType {
  MAIN        // 主窗口消息
  PRIVATE     // 私聊消息（当事人↔己方军师）
  PENDING     // 待确认消息（军师草拟，辅助模式）
  SYSTEM      // 系统消息
}

// Message 模型新增字段
model Message {
  // ... 现有字段
  type        MessageType @default(MAIN)
  targetUserId String?    // PRIVATE 消息的目标用户
}
```

## Risks / Trade-offs

- **[单一房间复杂度]** → 单一房间 + 服务端过滤增加了 Gateway 层的复杂度。缓解：将权限逻辑封装在 `MessageVisibilityService` 中，职责单一，便于测试。
- **[Socket.io 扩展性]** → Socket.io 的 Room 机制在单实例下表现良好，但多实例需要 Redis Adapter。缓解：初期使用单实例，架构上预留 `RedisIoAdapter`，后续无缝迁移。
- **[辅助模式确认流程]** → 军师草拟→当事人确认→发布的流程涉及多步状态管理，可能导致消息顺序问题。缓解：待确认消息分配临时 ID，确认后转为正式消息并附带时间戳。
- **[测试数据库]** → 集成测试需要真实数据库。缓解：使用 Docker PostgreSQL 测试实例 + Prisma migrate reset，或在 CI 中使用 `prisma db push` 快速建表。
- **[前端消息缓存]** → Zustand 内存缓存会丢失。缓解：进入聊天室时从 API 加载历史消息，新消息实时追加。

## Open Questions

- 军师在 Solo 模式下发送的消息，对方看到的发送者是谁？是当事人还是系统提示"军师代发"？需求文档未明确。（倾向：显示为当事人发送，但系统可选提示"对方正在使用恋爱辅助"）
- 关系进入暧昧期后聊天通道"永久关闭"——是否需要保留历史消息查看能力？
- Redis 是否需要持久化配置？在线状态丢失是否可接受？
