## ADDED Requirements

### Requirement: Unit test infrastructure for services
后端 SHALL 为所有核心 Service 类提供可运行的单元测试骨架，使用 Jest + `@nestjs/testing`。

#### Scenario: ChatService unit tests
- **WHEN** 运行 `pnpm test` 命令
- **THEN** ChatService 的单元测试 SHALL 覆盖：消息创建、消息可见性计算、权限校验逻辑

#### Scenario: RoomService unit tests
- **WHEN** 运行 `pnpm test` 命令
- **THEN** RoomService 的单元测试 SHALL 覆盖：房间创建、成员加入验证、权限矩阵计算

#### Scenario: PresenceService unit tests
- **WHEN** 运行 `pnpm test` 命令
- **THEN** PresenceService 的单元测试 SHALL 覆盖：在线状态设置/移除、Redis 交互（使用 mock）

### Requirement: Integration test infrastructure
后端 SHALL 提供集成测试框架，使用 NestJS 测试模块 + Socket.io-client 进行端到端 WebSocket 测试。

#### Scenario: Full chat flow test
- **WHEN** 运行 `pnpm test:e2e` 命令
- **THEN** 集成测试 SHALL 模拟四人聊天场景：创建关系 → 进入破冰期 → 四人加入 → 发送消息 → 验证接收

#### Scenario: Wingman mode test
- **WHEN** 运行集成测试
- **THEN** 测试 SHALL 验证三种军师模式下的消息可见性隔离：Solo 消息广播、Private 消息隔离、Assist 待确认流程

#### Scenario: Lifecycle transition test
- **WHEN** 运行集成测试
- **THEN** 测试 SHALL 验证关系状态流转时的聊天室行为：MATCHING 无房间 → ICEBREAKING 创建 → FLIRTING 关闭

### Requirement: Test utility module
后端 SHALL 提供可复用的测试工具模块，简化测试编写。

#### Scenario: TestApp utility
- **WHEN** 编写集成测试
- **THEN** 开发者 SHALL 能使用 `TestApp` 工具类创建 NestJS 测试应用实例，自动配置测试数据库和 Redis mock

#### Scenario: TestClient utility
- **WHEN** 编写 WebSocket 集成测试
- **THEN** 开发者 SHALL 能使用 `TestClient` 工具类创建 Socket.io-client 连接，提供 `connect(userId)`、`joinRoom(relId)`、`sendMessage(content)`、`waitForEvent(event, timeout)` 等方法

#### Scenario: Fixture utility
- **WHEN** 编写任何需要测试数据的测试
- **THEN** 开发者 SHALL 能使用 `Fixture` 工具类创建测试用户、关系、军师分配等数据，返回创建的实体 ID

### Requirement: Test database management
测试 SHALL 使用独立的测试数据库，每次测试运行前自动清理。

#### Scenario: Database isolation
- **WHEN** 集成测试开始执行
- **THEN** 系统 SHALL 使用独立的 PostgreSQL 数据库（如 `violet_test`），每次测试套件运行前执行 `prisma db push` 确保最新 schema

#### Scenario: Data cleanup
- **WHEN** 每个测试用例完成后
- **THEN** 系统 SHALL 清理该用例创建的数据（通过 transaction rollback 或 `prisma.deleteMany`）

### Requirement: CI integration
测试 SHALL 在 GitHub Actions CI 中自动运行。

#### Scenario: Unit tests in CI
- **WHEN** GitHub Actions 运行 CI 流水线
- **THEN** 单元测试 SHALL 自动执行并通过（不依赖外部服务，Redis 使用 mock）

#### Scenario: Integration tests in CI
- **WHEN** GitHub Actions 运行 CI 流水线
- **THEN** 集成测试 SHALL 使用 CI 环境中的 PostgreSQL 服务容器执行并通过
