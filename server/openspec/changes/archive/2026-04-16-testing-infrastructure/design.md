## Context

项目是 Violet——校园恋爱社交平台的后端，使用 NestJS + Prisma 7 + Socket.io + Redis 技术栈。核心功能是"四人三边聊天室"：两个当事人 + 两个军师，支持三种军师介入模式（SOLO 代聊 / PRIVATE 私聊 / ASSIST 辅助）。

当前状态：
- Vitest 已安装，`vite-plugin-swc-transform` 已配置，但 SWC 选项传递方式有误（直接传递而非包裹在 `swcOptions` 属性中），导致所有包含 `@Injectable()`、`@Controller()` 等装饰器的文件解析失败
- 已有 `test/utils/` 工具层（TestApp、Fixture、TestClient），结构合理
- 已有 `chat.services.spec.ts` 单元测试（9 个 computeVisibility 用例 + 1 个 getRoomId 用例）
- 已有 `chat.integration.e2e-spec.ts` 集成测试（12 个用例），但文件过大且混在一起
- Prisma 7 的 `prisma-client` generator 输出 ESM 代码（含 `import.meta.url`），这是当初从 Jest 迁移到 Vitest 的根本原因

## Goals / Non-Goals

**Goals:**
- 让 Vitest 能正常运行所有测试文件（修复 SWC 配置）
- 为 ChatService.computeVisibility 补全边界用例
- 为 ChatLifecycleService.transitionStatus 编写状态机单测
- 为 RoomService 编写权限校验单测
- 将集成测试按职责拆分：四人消息流、军师模式路由、REST API、生命周期
- 清理 Jest 遗留依赖

**Non-Goals:**
- 不编写 CreditService 测试（该 Service 尚未实现）
- 不编写 MatchStateService 测试（该 Service 尚未实现）
- 不编写邮箱校验/内容过滤测试（尚未实现相关逻辑）
- 不编写前端测试
- 不引入 Docker 测试环境（使用本地 PostgreSQL + Redis）
- 不配置 Git Hooks / CI 流水线（后续独立处理）

## Decisions

### D1: SWC 配置修复方案

**选择**: 将 SWC 选项包裹在 `swcOptions` 属性中

```typescript
// 修正后
swc({
  swcOptions: {
    jsc: {
      parser: { syntax: 'typescript', decorators: true },
      transform: { useDefineForClassFields: false, legacyDecorator: true, decoratorMetadata: true },
    },
  },
})
```

**原因**: `vite-plugin-swc-transform` 的 API 签名为 `({ include, exclude, swcOptions })`，不是直接传递 SWC 配置。

**替代方案**: 使用 `@vitest/decorators` 或 `unplugin-swc`——但这些需要额外依赖且不稳定。

### D2: 单元测试策略——直接实例化而非 NestJS DI

**选择**: 对纯逻辑方法使用 `new Service(mockPrisma)` 而非 `Test.createTestingModule()`

**原因**: `computeVisibility`、`getRoomId` 等方法不依赖 DI 容器。直接实例化避免了启动 NestJS 容器的开销，测试速度极快（毫秒级）。

**替代方案**: 使用 `Test.createTestingModule()` + provider mock——更接近真实运行时，但增加复杂度且单测不需要 DI 特性。

### D3: 集成测试拆分策略

**选择**: 按职责域拆分为独立文件：

| 文件 | 覆盖范围 | 大约用例数 |
|------|---------|-----------|
| `chat.four-person-flow.e2e-spec.ts` | 四人加入/发消息/可见性 | 4 |
| `chat.wingman-modes.e2e-spec.ts` | SOLO/PRIVATE/ASSIST 模式路由 | 6 |
| `chat.rest-api.e2e-spec.ts` | REST 端点（消息历史/在线状态） | 3 |
| `chat.lifecycle.e2e-spec.ts` | 状态转换（MATCHING→ICEBREAKING→FLIRTING→ENDED） | 4 |

**原因**: 原文件 338 行、12 个用例混在一起，难以定位失败。按职责拆分后每个文件独立维护。

**替代方案**: 保持单文件但增加 describe 分组——文件仍然过长，不便于并行运行。

### D4: Mock 策略

**选择**:
- **单元测试**: 手工构造 mock 对象 `{ provide: PrismaService, useValue: mockPrisma }` 或直接 `new Service(null as any)`（纯逻辑方法）
- **集成测试**: 使用真实 NestJS 应用 + 真实 PostgreSQL + Redis，不做 mock

**原因**: 单元测试关注纯逻辑正确性（速度优先），集成测试关注系统协作正确性（真实优先）。

### D5: 测试文件放置位置

**选择**: 单元测试放在 `src/**/*.spec.ts`（与源码同目录），集成测试放在 `test/**/*.e2e-spec.ts`

**原因**: Vitest 已配置 `include: ['src/**/*.spec.ts', 'test/**/*.e2e-spec.ts']`。单测与源码放一起便于维护，集成测试独立目录避免混淆。

## Risks / Trade-offs

- **[风险] 集成测试依赖外部服务** → 需要本地 PostgreSQL 和 Redis 运行。缓解：在 `test/setup.ts` 中添加环境检查，未启动时跳过集成测试（`describe.skipIf`）
- **[风险] SWC 插件版本兼容性** → `vite-plugin-swc-transform@1.1.1` 的 API 可能在未来版本变化。缓解：锁定版本
- **[权衡] 直接实例化 vs DI 容器** → 无法测试 DI 注入的正确性。可接受：DI 是 NestJS 框架层的职责，不在业务测试范围内
- **[权衡] 不做数据库事务并发测试** → Gemini 建议优先级三的内容。可接受：当前没有 CreditService，暂无并发扣费场景
