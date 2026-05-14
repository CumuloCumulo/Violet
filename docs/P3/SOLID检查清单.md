# Phase 3 - SOLID 检查清单

> 对 AI（即 Claude）根据需求文档和 P2 架构设计生成的代码进行 SOLID 逐条审查

---

## 审查背景

AI 根据项目需求文档和 P2 架构设计，直接生成了完整的后端代码实现。以下对照 SOLID 五条原则，逐条审查 AI 生成的设计中存在的问题。

---

## SOLID 检查清单

### S - 单一职责原则（Single Responsibility Principle）

> 检查问题：有没有类承担了过多职责？

| 类名 | 是否违反 | 违反说明 | 修正方案 |
|------|---------|---------|---------|
| **ChatGateway** | **是** | ChatGateway 同时承担了：① WebSocket 连接/断开管理 ② 消息收发路由 ③ 军师模式切换 ④ 暧昧期提议 ⑤ 状态转换广播 ⑥ 成员可见性过滤 ⑦ 军师分配通知推送。共 7 项职责，约 695 行代码。 | 将消息可见性过滤逻辑完全移入 ChatService（已部分完成，`computeVisibility` 已在 ChatService 中，但 Gateway 中仍有过滤调用）；将军师模式切换逻辑抽为独立的 WingmanModeService；将通知推送逻辑抽为 NotificationService |
| **DiscoveryService** | **轻微** | `listRelationships()` 方法同时处理了当事人视角和军师视角两种不同的查询逻辑，方法内包含大量数据组装代码（约 100 行）。 | 可拆分为 `listAsClient()` 和 `listAsWingman()` 两个私有方法，或引入 RelationshipViewService |
| **WingmanTaskService.approveTask()** | **轻微** | 审批方法内同时处理了：申请状态更新、其他申请拒绝、军师分配创建/复用、任务状态更新。事务内逻辑较多。 | 可将分配逻辑抽为独立的 `createOrReactivateAssignment()` 方法 |

**违反数量**：1 处明显违反 + 2 处轻微违反

---

### O - 开闭原则（Open/Closed Principle）

> 检查问题：新增需求类型是否需要修改现有代码？

| 场景 | 是否违反 | 违反说明 | 修正方案 |
|------|---------|---------|---------|
| **新增消息类型** | **是** | 若需新增消息类型（如图片消息 `IMAGE`、红包消息 `GIFT`），需要修改 `computeVisibility()` 中的 `if/else` 链，以及 `handleSendMessage()` 中的发送逻辑。未使用策略模式，新增类型需要直接修改 ChatService 和 ChatGateway。 | 引入 `MessageVisibilityStrategy` 接口，每种消息类型实现自己的可见性规则，通过注册机制添加新类型，无需修改已有代码 |
| **新增军师模式** | **是** | 新增军师介入模式（如 `OBSERVE` 观察模式）需要修改：① handleSendMessage 中的 mode 判断 ② handleDraftMessage 中的权限检查 ③ computeVisibility 中的可见性逻辑。多处 if/else 需要扩展。 | 引入 `WingmanModeStrategy` 接口，每种模式实现 `canSendToMain()`, `canDraftMessage()`, `getVisibility()` 等方法 |
| **新增关系状态** | **轻微** | `transitionStatus()` 中使用 if 链匹配状态转换对（MATCHING→ICEBREAKING, ICEBREAKING→FLIRTING, *→ENDED），新增状态需要修改此方法。 | 可引入状态模式，每个状态类定义允许的转换和对应行为 |

**违反数量**：2 处明显违反 + 1 处轻微违反

---

### L - 里氏替换原则（Liskov Substitution Principle）

> 检查问题：子类是否可以替换父类使用？

| 类关系 | 是否违反 | 违反说明 | 修正方案 |
|--------|---------|---------|---------|
| **AdminGuard 继承 JwtAuthGuard** | **否** | AdminGuard 先调用 `super.canActivate()` 完成 JWT 认证，再额外查询数据库验证 ADMIN 角色。子类行为是父类行为的严格扩展，可以安全替换。 | 无需修正 |
| **PrismaService 继承 PrismaClient** | **否** | PrismaService 仅添加了 `onModuleInit` 和 `onModuleDestroy` 生命周期方法，不改变 PrismaClient 的任何行为。 | 无需修正 |

**违反数量**：0 处违反

---

### I - 接口隔离原则（Interface Segregation Principle）

> 检查问题：有没有接口太"胖"，包含了不需要的方法？

| 接口/类 | 是否违反 | 违反说明 | 修正方案 |
|---------|---------|---------|---------|
| **PrismaService（作为数据访问层）** | **是** | 所有 Service 层都直接注入完整的 PrismaService，但每个 Service 实际只使用其中几个模型（如 UserService 只用 `prisma.user`，ChatService 使用 `prisma.message`、`prisma.relationship`、`prisma.wingmanAssignment`、`prisma.user`）。PrismaClient 暴露了所有 12 个模型的完整 CRUD 方法，不符合接口隔离。 | 定义领域 Repository 接口（如 `IUserRepository`、`IMessageRepository`），Service 依赖接口而非具体实现。实际项目中可接受 PrismaService 全局注入的权衡，因为 Prisma 的类型安全已提供编译时保障 |
| **ChatGateway 对外暴露的方法** | **轻微** | `emitWingmanAssigned()` 和 `emitWingmanApproved()` 是专门为 WingmanTaskController 提供的公开方法。ChatGateway 作为 WebSocket 入口，暴露了非 WebSocket 相关的推送方法，职责不纯粹。 | 引入独立的事件总线或 NotificationService，WingmanTaskController 通过事件总线触发通知，而非直接持有 ChatGateway 的引用 |
| **RoomService** | **否** | RoomService 只暴露了与聊天室成员管理相关的方法，接口精简。 | 无需修正 |

**违反数量**：1 处明显违反 + 1 处轻微违反

---

### D - 依赖倒转原则（Dependency Inversion Principle）

> 检查问题：高层模块是否直接依赖了低层模块的具体实现？

| 依赖关系 | 是否违反 | 违反说明 | 修正方案 |
|----------|---------|---------|---------|
| **所有 Service → PrismaService** | **是（设计权衡）** | Service 层直接依赖 PrismaService（PrismaClient 的子类）的具体实现。高层业务逻辑与 Prisma ORM 耦合，若将来更换 ORM（如切换到 TypeORM 或原生 SQL），需要修改所有 Service。 | 定义 `IRepository` 接口层，Service 依赖接口。NestJS 的自定义 Provider 机制可轻松实现。但在本项目规模下，Prisma 的类型安全和开发效率收益远大于此架构代价，属于**有意识的权衡** |
| **PresenceService → ioredis** | **是（设计权衡）** | PresenceService 直接在构造函数中创建 Redis 连接实例（`new Redis(...)`），而非通过依赖注入。若需更换缓存方案（如 Memcached）或测试时 Mock，需要修改 PresenceService 源码。 | 定义 `IPresenceStore` 接口，通过 NestJS 依赖注入 Redis 客户端实例 |
| **WingmanTaskController → ChatGateway（forwardRef）** | **是** | 使用 `forwardRef` 解决循环依赖，WingmanTaskController 直接依赖 ChatGateway 的具体方法（`emitWingmanAssigned`、`emitWingmanApproved`）。这种反向依赖破坏了模块的层次结构。 | 定义 `INotificationService` 接口，ChatGateway 实现该接口，WingmanTaskController 依赖接口 |
| **AuthService → bcrypt, jsonwebtoken** | **是（设计权衡）** | 直接导入并使用 bcrypt 和 jsonwebtoken 库。密码哈希和 token 签发逻辑与具体库耦合。 | 可抽象为 `IPasswordHasher` 和 `ITokenService` 接口。但在此项目规模下属于过度设计 |

**违反数量**：4 处违反（其中 3 处为有意识的设计权衡）

---

## 总结

### 违反统计

| SOLID 原则 | 违反数量 | 严重程度 |
|-----------|---------|---------|
| S - 单一职责 | 3（1 严重 + 2 轻微） | 高 |
| O - 开闭原则 | 3（2 严重 + 1 轻微） | 高 |
| L - 里氏替换 | 0 | - |
| I - 接口隔离 | 2（1 严重 + 1 轻微） | 中 |
| D - 依赖倒转 | 4（均为设计权衡） | 低 |
| **总计** | **12** | - |

### 最严重的设计问题

**ChatGateway 违反单一职责原则**：作为系统中最大的类（695 行），承担了 WebSocket 连接管理、消息路由、可见性过滤、模式切换、状态广播、通知推送等 7 项职责。这使得：
- 代码难以理解和维护
- 测试困难（需要 Mock 大量依赖）
- 修改任何一项功能都可能影响其他功能
- 新增功能时容易引入回归问题

### 修正优先级建议

1. **高优先级**：拆分 ChatGateway（抽取 NotificationService、WingmanModeService）
2. **高优先级**：引入策略模式处理消息类型和军师模式（解决开闭原则违反）
3. **中优先级**：引入 INotificationService 接口解除 WingmanTaskController 对 ChatGateway 的直接依赖
4. **低优先级**：Repository 接口层（项目规模小，Prisma 类型安全足够）
5. **低优先级**：抽象密码和 token 库（变更可能性极低）

### 关于"设计权衡"的说明

D 原则中的 4 处违反均为**有意识的设计权衡**，而非 AI 的设计缺陷：
- 直接使用 PrismaService 是为了利用 Prisma 的类型安全和自动补全
- 直接使用 ioredis 是因为在线状态管理是 Redis 特有的数据结构操作
- 使用 bcrypt/jsonwebtoken 是因为这些是行业标准，更换可能性极低
- 这些权衡在 4 人团队、10 周开发周期的约束下是合理的
