# Bug 修复日志 — Phase 4

> Violet 校园恋爱辅助平台

---

**阶段：** Phase 4 编码开发 | **记录者：** 庄永琪 | **日期：** 2026-06-01

---

## Bug #1：ChatLifecycleService 单元测试失败

| 字段 | 内容 |
|------|------|
| **问题现象** | `chat-lifecycle.service.spec.ts` 中 3 个测试失败，报 `TypeError: Cannot read properties of undefined (reading 'createNotification')` 和 `Cannot read properties of undefined (reading 'findUnique')` |
| **影响范围** | 3/5 测试用例失败：MATCHING→ICEBREAKING、ICEBREAKING→FLIRTING、→ENDED |
| **根因分析** | Phase 3 后期为 `ChatLifecycleService` 新增了两个功能：(1) 状态变更时发送通知（依赖 `NotificationService`）；(2) FLIRTING 阶段查询用户联系方式（依赖 `prisma.user.findUnique`）。测试文件的 mock 对象未同步更新，且返回类型从 `roomClosed` 变为 `roomReadOnly` |
| **修复方案** | (1) 在 `beforeEach` 中添加 `mockNotificationService` 和 `mockPrisma.user` mock；(2) 为每个测试用例配置 `findUnique` 的多次调用返回值（`.mockResolvedValueOnce` 链式调用）；(3) 更新 ICEBREAKING→FLIRTING 的断言从 `roomClosed` 改为 `roomReadOnly`，增加 `contactExchange` 字段验证 |
| **验证结果** | ✅ 5/5 测试全部通过 |

---

## Bug #2：bcrypt ESM 模块 Spy 不可用

| 字段 | 内容 |
|------|------|
| **问题现象** | `auth.service.spec.ts` 中 login 测试报 `TypeError: Cannot redefine property: compare` |
| **影响范围** | login 和 changePassword 相关测试无法运行 |
| **根因分析** | bcrypt 使用 ESM `export`，Vitest 环境下导出属性为 non-configurable，`vi.spyOn` 无法重新定义。需要改用 `vi.mock('bcrypt')` 在模块加载前进行全局 mock |
| **修复方案** | (1) 使用 `vi.mock('bcrypt', () => ({ hash: vi.fn(), compare: vi.fn() }))` 替换 `vi.spyOn`；(2) 在需要覆盖默认行为的测试中用 `vi.mocked(bcrypt.compare).mockResolvedValueOnce(true)` 临时覆盖；(3) 同时 mock `ioredis` 避免真实 Redis 连接 |
| **验证结果** | ✅ 15/15 auth 测试全部通过 |

---

## Bug #3：E2E 测试因缺少数据库连接全部跳过

| 字段 | 内容 |
|------|------|
| **问题现象** | E2E 测试在本地无 PostgreSQL/Redis 环境下全部 skip，在 CI 中因未配置服务容器也无法运行 |
| **影响范围** | 6 个 e2e 测试文件无法在 CI 中执行 |
| **根因分析** | CI 配置中未定义 PostgreSQL 和 Redis 服务容器，导致数据库连接失败 |
| **修复方案** | 在 `.github/workflows/ci.yml` 中新增 `server-e2e` job，配置 `postgres:16` 和 `redis:7` 服务容器，设置健康检查和环境变量 |
| **验证结果** | ✅ CI 配置已更新，待下次 push 触发运行验证 |

---

## Bug #4：前端构建包体积过大警告

| 字段 | 内容 |
|------|------|
| **问题现象** | `pnpm build` 输出警告：JS bundle 658 KB 超过 500 KB 限制 |
| **影响范围** | 不影响功能，仅影响加载性能 |
| **根因分析** | `DiscoveryPage.tsx`（1386 行）和 `index.css`（1139 行）体积较大，未做代码分割 |
| **修复方案** | 低优先级，可考虑路由懒加载优化。当前不影响演示，记录待 P6 处理 |
| **验证结果** | ⬜ 待处理（非阻塞） |
