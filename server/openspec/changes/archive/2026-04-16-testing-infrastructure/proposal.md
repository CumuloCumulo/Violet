## Why

当前测试基础设施处于不可用状态：Vitest 已安装但无法运行（SWC 插件配置错误导致 NestJS 装饰器解析失败），已有的单元测试和集成测试文件全部无法执行。作为独立开发者项目，需要一套"ROI 最高的实用主义"测试策略——聚焦核心业务逻辑（消息可见性规则、军师模式路由、状态机流转），而不是追求全量覆盖。

## What Changes

- **修复 Vitest 配置**：修正 `vite-plugin-swc-transform` 的 SWC 选项传递方式（`swcOptions` 包装），使装饰器解析正常工作
- **补全单元测试**：为 `ChatService.computeVisibility`、`ChatLifecycleService.transitionStatus`、`RoomService` 等纯逻辑/状态机方法编写完善的单测
- **重构集成测试**：将现有 `chat.integration.e2e-spec.ts` 拆分为聚焦的 Socket.io 集成测试，覆盖四人聊天室的三种军师模式消息路由
- **建立测试工具层**：完善 `test/utils/` 下的 Fixture、TestClient、TestApp，支持快速搭建测试场景
- **清理 Jest 遗留**：移除 package.json 中未使用的 Jest 相关依赖（`jest`, `ts-jest`, `@types/jest`）

## Capabilities

### New Capabilities

- `vitest-config`: Vitest 测试框架配置，包括 SWC 装饰器支持、ESM 兼容、测试环境设置
- `unit-tests`: 核心业务逻辑的单元测试套件——消息可见性规则、状态机流转、房间权限校验
- `socket-integration-tests`: Socket.io 集成测试套件——四人聊天室消息路由、军师模式切换、生命周期事件广播

### Modified Capabilities

（无已有 capability 需要修改）

## Impact

- **配置文件**：`vitest.config.ts`、`test/setup.ts`
- **测试文件**：`src/chat/chat.services.spec.ts`（已有）、`test/chat.integration.e2e-spec.ts`（重构拆分）
- **新增测试文件**：`src/chat/chat-lifecycle.service.spec.ts`、`src/chat/room.service.spec.ts`、`test/chat.wingman-modes.e2e-spec.ts`
- **依赖变更**：移除 `jest`、`ts-jest`、`@types/jest`
- **运行时要求**：集成测试需要 PostgreSQL 和 Redis 实例运行
