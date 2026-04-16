# Violet Server

Violet 是一个面向南京大学学生的匿名社交平台，核心特色是**军师辅助聊天**——两位当事人各有一位军师在背后出谋划策，帮助破冰和交流。

## 技术栈

- **框架**: NestJS 11
- **数据库**: PostgreSQL + Prisma 6 ORM
- **缓存/实时**: Redis (ioredis) + Socket.io
- **邮件**: Nodemailer (南大校园邮箱验证)
- **测试**: Vitest + socket.io-client + supertest
- **包管理**: pnpm

## 核心业务模型

```
当事人A ←─── Relationship ───→ 当事人B
   │                              │
   └── 军师A (SOLO/PRIVATE/ASSIST)  └── 军师B (SOLO/PRIVATE/ASSIST)
```

### 关系状态流转

```
MATCHING → ICEBREAKING → FLIRTING → ENDED
 牵线期      破冰期       暧昧期     已结束
```

### 军师模式

| 模式 | 说明 |
|------|------|
| **SOLO** | 代聊：军师直接替当事人发消息，对方无感知 |
| **PRIVATE** | 私聊：当事人与己方军师私下沟通，对方不可见 |
| **ASSIST** | 辅助：军师草拟消息，当事人确认后才发出 |

## 项目结构

```
server/
├── prisma/
│   ├── schema.prisma          # 数据模型定义
│   ├── seed.ts                # 种子数据
│   └── migrations/            # 数据库迁移
├── src/
│   ├── chat/
│   │   ├── chat.gateway.ts    # WebSocket 网关
│   │   ├── chat.service.ts    # 消息处理与路由
│   │   ├── chat-lifecycle.service.ts  # 状态流转
│   │   ├── room.service.ts    # 聊天室管理
│   │   ├── presence.service.ts # 在线状态 (Redis)
│   │   └── dto/               # 请求/响应数据结构
│   ├── prisma/
│   │   └── prisma.service.ts  # Prisma 连接封装
│   ├── app.module.ts
│   └── main.ts
├── test/
│   ├── utils/
│   │   ├── test-app.ts        # 测试用 NestJS 应用实例
│   │   ├── test-client.ts     # 测试用 Socket.io 客户端
│   │   └── fixture.ts         # 测试数据工厂
│   ├── chat.four-person-flow.e2e-spec.ts   # 四人聊天室流程
│   ├── chat.wingman-modes.e2e-spec.ts      # 军师三种模式
│   ├── chat.lifecycle.e2e-spec.ts          # 生命周期状态流转
│   ├── chat.rest-api.e2e-spec.ts           # REST API 测试
│   └── chat.smoke.e2e-spec.ts              # 连通性冒烟测试
└── vitest.config.ts
```

## 快速开始

### 环境要求

- Node.js >= 20
- PostgreSQL
- Redis

### 安装

```bash
pnpm install
```

### 配置

复制 `.env.example` 为 `.env` 并填入实际配置：

```bash
cp .env.example .env
```

### 数据库

```bash
# 运行迁移
npx prisma migrate dev

# 填充种子数据
pnpm run seed

# 重置数据库并重新填充
pnpm run seed:reset
```

### 启动

```bash
# 开发模式 (热重载)
pnpm run start:dev

# 生产模式
pnpm run build && pnpm run start:prod
```

## 测试

共 38 个测试用例（22 单元测试 + 16 E2E 集成测试）。

```bash
# 运行全部测试
pnpm run test

# 运行 E2E 测试（需要 PostgreSQL 测试数据库）
pnpm run test:e2e

# 测试覆盖率
pnpm run test:cov

# 监听模式
pnpm run test:watch
```

E2E 测试使用独立的 `violet_test` 数据库，确保不影响开发数据。

## API

服务端提供 REST API 和 WebSocket 两类接口，全局前缀 `/api`。

### WebSocket 事件

| 事件 | 方向 | 说明 |
|------|------|------|
| `joinRoom` | Client → Server | 加入聊天室 |
| `sendMessage` | Client → Server | 发送消息 |
| `newMessage` | Server → Client | 收到新消息 |
| `roomClosed` | Server → Client | 聊天室关闭 |
| `switchMode` | Client → Server | 切换军师模式 |
| `confirmMessage` | Client → Server | 确认辅助模式消息 |

### REST 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/chat/:relationshipId/messages` | 获取聊天记录 |
| GET | `/api/chat/:relationshipId/presence` | 获取在线成员 |
| POST | `/api/chat/:relationshipId/status` | 切换关系状态 |
