# AI 调试对决实验报告 — Phase 4

> Violet 校园恋爱辅助平台 — 实验二

---

**实验日期：** 2026-06-01 | **实验者：** 庄永琪、靳滨硕

---

## 零、Bug 汇总对比表

| Bug # | Bug 描述 | 纯人工定位耗时 | AI 辅助定位耗时 | AI 定位是否准确 | AI 修复方案是否可用 | 最终方案来源 |
|-------|---------|-------------|-------------|-------------|-----------------|-----------|
| 1 | ChatLifecycleService 3 个测试因 mock 缺失失败 | ~8 min | ~30 s | ✅ 完全准确 | ✅ 一次修复全部 3 个用例 | AI 方案 |
| 2 | bcrypt ESM 模块 vi.spyOn 报错 | ~12 min | ~1 min | ✅ 准确 | ✅ vi.mock 替代方案 | AI 方案 |

---

## 一、Bug #1：ChatLifecycleService 单元测试大面积失败

### Bug 描述

在运行 `pnpm run test` 时，`chat-lifecycle.service.spec.ts` 中 3 个测试失败，报错为：
- `TypeError: Cannot read properties of undefined (reading 'createNotification')`
- `TypeError: Cannot read properties of undefined (reading 'findUnique')`

原因：代码在 Phase 3 后期新增了 `NotificationService` 依赖和 `PrismaService.user.findUnique` 调用，但测试 mock 未同步更新。

### 调试对比

| 步骤 | 纯人工调试 | AI 辅助调试 |
|------|----------|-----------|
| 1. 问题描述 | 阅读报错堆栈，定位到 `chat-lifecycle.service.ts:89` 的 `this.notificationService` 为 undefined | 将报错信息和 spec 文件提供给 AI，AI 立即识别出构造函数新增了 `notificationService` 参数但 mock 缺失 |
| 2. 定位耗时 | ~8 分钟（需逐行对比源码与 spec 文件的构造函数参数） | ~30 秒 |
| 3. 定位准确度 | 正确，但需要手动对比所有依赖 | 完全准确，AI 一次性列出所有缺失的 mock |
| 4. 修复方案 | 逐个添加缺失的 mock，手动追踪每个测试用例的调用链 | AI 一次性生成完整的 mock 更新 + 所有测试用例的 mock 返回值调整 |
| 5. 方案质量 | 仅修复了 `createNotification`，遗漏了 `user.findUnique` 和返回类型变化（`roomClosed` → `roomReadOnly`） | 一次性修复全部问题：NotificationService mock、user.findUnique mock、断言类型更新 |
| 6. 最终修复 | 采纳 AI 方案，覆盖人工初步修复 | AI 方案完整无遗漏 |

### 分析

- AI **优势**：能快速对比源码与测试文件的差异，一次性找出所有缺失的依赖和类型变化
- 人工**劣势**：容易遗漏依赖链中的间接调用（如 `onFlirting` 方法内部调用的 `prisma.user.findUnique`）

---

## 二、Bug #2：bcrypt ESM 模块 spy 失败

### Bug 描述

在 `auth.service.spec.ts` 中使用 `vi.spyOn(bcrypt, 'compare')` 对 bcrypt 的 `compare` 方法进行 spy，报错：
```
TypeError: Cannot redefine property: compare
```

原因：bcrypt 是 ESM 模块，其导出的属性不可配置（non-configurable），`vi.spyOn` 无法直接修改。

### 调试对比

| 步骤 | 纯人工调试 | AI 辅助调试 |
|------|----------|-----------|
| 1. 问题描述 | 查阅 Vitest 文档，寻找 ESM mock 方案 | 将报错信息提供给 AI，AI 识别出这是 ESM 模块的已知限制 |
| 2. 定位耗时 | ~12 分钟（需查阅 Vitest 文档和 ESM 规范） | ~1 分钟 |
| 3. 定位准确度 | 正确，但花了较长时间验证方案可行性 | AI 直接给出 `vi.mock('bcrypt')` 方案 |
| 4. 修复方案 | 手动改写为 `vi.mock('bcrypt', ...)` 全局 mock | AI 生成完整的 `vi.mock` 配置，包括 `hash` 和 `compare` 的默认返回值 |
| 5. 方案质量 | 仅 mock 了 `compare`，后续 `resetPassword` 测试因 `hash` 未 mock 而可能失败 | 同时 mock 了 `hash` 和 `compare`，覆盖所有使用场景 |
| 6. 最终修复 | 采纳 AI 方案 | AI 方案完整 |

### 分析

- AI **优势**：对框架特性和 ESM 规范的了解更加全面，能直接给出最佳实践
- AI **劣势**：初始版本的 login 测试使用了 `vi.spyOn` 这种不可行的方式，说明 AI 在首次生成时也会犯 ESM 兼容性错误
- **关键上下文**：提供完整的报错信息（包括 `Cannot redefine property`）后，AI 的诊断准确性显著提高

---

## 三、实验总结

### 综合分析

| 维度 | 结论 |
|------|------|
| AI 擅长调试的 Bug 类型 | 依赖缺失、Mock 不完整、ESM 模块兼容性、类型不匹配 |
| AI 不擅长调试的 Bug 类型 | 运行时数据不一致、业务逻辑层面的语义错误 |
| AI 是否只修表象不找根因 | 本次实验中未出现，AI 均找到了根因（mock 未同步更新） |
| 人工提供哪些上下文后 AI 变好 | 完整的报错堆栈 + 源码 + 测试文件三者同时提供时效果最佳 |

### 关键发现

1. **上下文充分时 AI 定位速度远超人工**：Bug #1 中 AI 节省了约 7.5 分钟（8min → 30s）
2. **AI 也会犯同类错误**：Bug #2 中 AI 一开始也使用了错误的 `vi.spyOn` 方式，说明 AI 在 ESM 场景下并非全知全能
3. **AI 修复更全面**：Bug #1 中人工容易遗漏间接依赖，AI 一次性覆盖了所有变化点
4. **最佳实践**：提供完整的三方信息（报错 + 源码 + 相关测试）是获得高质量 AI 调试建议的关键
