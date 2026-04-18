## Context

Violet 是一个校园恋爱牵线平台，核心创新是"军师代聊"机制。当前聊天室系统（破冰期）已完整实现，包括 Socket.io 实时通信、军师三种介入模式、消息确认流程等。但用户只能通过 DEV 工具手动创建账号和关系来使用系统，缺少从注册到进入聊天室的完整管道。

后端采用 NestJS + Prisma + PostgreSQL + Redis，前端采用 React + Vite + Zustand。数据库 schema 已包含 User、Relationship 等模型，但缺少 MatchRequest（牵线请求）模型，User 模型也缺少恋爱宣言、军师认证状态等字段。

## Goals / Non-Goals

**Goals:**
- 实现完整的用户注册→浏览→牵线→进入破冰期的端到端流程
- 南大 smail 邮箱注册与 JWT 认证
- 用户列表页以标签卡片平铺展示，不含推荐算法
- 牵线请求的发送、响应、超时机制
- 最简信用分系统支撑牵线消耗

**Non-Goals:**
- 邮箱验证码发送（MVP 阶段仅校验邮箱后缀为 `@smail.nju.edu.cn`，不做真实邮件验证）
- 复杂推荐/匹配算法
- 军师大厅（任务发布/接单）——属于下一个变更
- 信用分充值/支付——早期人工处理，本变更仅实现签到和消耗逻辑
- 帖子大厅
- 后台管理系统
- 忘记密码/密码重置流程

## Decisions

### 1. 认证方案：JWT + HttpOnly Cookie

**选择**: NestJS Passport + JWT，token 存储在 HttpOnly cookie 中。

**理由**: HttpOnly cookie 防 XSS 窃取 token；与现有 Socket.io 的认证衔接自然（握手时从 cookie 提取 JWT）。不需要 refresh token 机制——MVP 阶段 token 有效期设 7 天足够。

**备选方案**:
- Session + Redis：更传统但需要额外维护 session store，对 Socket.io 集成也没有明显优势
- localStorage token：简单但易受 XSS 攻击

### 2. 邮箱验证策略：MVP 仅后缀校验

**选择**: 注册时仅验证邮箱以 `@smail.nju.edu.cn` 结尾，不发送验证邮件。

**理由**: 发送邮件需要配置 SMTP 服务或接入第三方服务（SendGrid 等），增加部署复杂度。对于校园内测阶段，后缀校验足以保证真实性，后续可迭代加入邮件验证。

### 3. 牵线请求模型：新增 MatchRequest 表

**选择**: 新建 `MatchRequest` 模型存储牵线请求，与 Relationship 分离。

**理由**: 牵线请求是独立的生命周期（可被拒绝、可超时），不应直接创建 Relationship。只有双方都同意时才创建 Relationship 并进入 ICEBREAKING 状态。这也便于未来做"同时向多人发起"的需求。

**备选方案**:
- 直接复用 Relationship + MATCHING 状态：语义混淆，Relationship 暗示双方已建立关联，而牵线请求可能是单向的

### 4. 用户列表：服务端分页 + 无算法排序

**选择**: 服务端返回活跃用户列表（按 lastActiveAt 降序分页），前端平铺展示。

**理由**: 需求文档明确"反算法"——100% 用户认为具体标签比算法有用。简单分页即可，不需要推荐逻辑。活跃度排序（一周内登录排前面）自然过滤掉死号。

### 5. Schema 扩展：最小改动原则

**选择**: 在现有 User 模型上新增字段，不改动已有字段语义。

新增字段：
- `declaration String?` — 恋爱宣言
- `wingmanCertStatus String @default("NONE")` — 军师认证状态 (NONE/PENDING/APPROVED/REJECTED)
- `wingmanCertCooldown DateTime?` — 军师认证失败冷却截止时间
- `wechat String?` — 微信（隐藏）
- `qq String?` — QQ（隐藏）

新增模型：
- `MatchRequest` — 牵线请求

### 6. 模块划分

```
server/src/
├── auth/           # 认证模块 (注册、登录、JWT 策略)
├── user/           # 用户模块 (画像、标签、军师认证)
├── discovery/      # 发现模块 (用户列表、牵线请求)
├── credit/         # 信用分模块 (签到、余额查询)
├── chat/           # 已有：聊天模块
└── dev/            # 已有：开发工具
```

前端新增页面：
```
client/src/pages/
├── RegisterPage.tsx    # 注册页
├── LoginPage.tsx       # 登录页
├── DiscoveryPage.tsx   # 用户列表 + 牵线
```

## Risks / Trade-offs

**[风险] 无邮件验证 → 任何人可注册** → 缓解：MVP 阶段面向校园内测，邮箱后缀校验已足够。部署时配合校园网 IP 白名单可进一步限制。正式运营前必须加入邮件验证。

**[风险] JWT 7 天有效期 → 无法即时吊销** → 缓解：MVP 阶段可接受。如果后续需要即时吊销能力，可在 Redis 维护 token 黑名单。

**[风险] 牵线请求 24h 超时 → 需要定时清理** → 缓解：查询时过滤 `createdAt > now() - 24h` 即可，无需专门的 cron job。已超时的请求在查询时标记为过期，可异步批量清理。

**[权衡] 军师认证问卷 → 硬编码 vs 动态配置** → 选择硬编码。问卷内容固定且少（10-15 题），不值得引入问卷引擎。后续若需频繁调整问卷内容再考虑配置化。

## Open Questions

- 信用分的初始值和签到增量具体数值？（建议：注册赠送 20 分，每日签到 +3 分，发起牵线消耗 5 分）
- 牵线请求是否需要通知机制（如邮件/站内信）？（建议：MVP 阶段仅登录后页面提示）
- 用户列表是否需要按性别筛选？（需求文档未明确，建议 MVP 不加筛选）
