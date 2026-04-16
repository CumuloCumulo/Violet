## 1. 修复 Vitest 配置

- [x] 1.1 修正 `vitest.config.ts` 中 `vite-plugin-swc-transform` 的 SWC 选项，将 `jsc` 包裹在 `swcOptions` 属性中
- [x] 1.2 运行 `npx vitest run --reporter=verbose` 验证装饰器解析正常，确认已有单元测试（`src/chat/chat.services.spec.ts`）全部通过
- [x] 1.3 从 package.json 移除 Jest 遗留依赖：`jest`、`ts-jest`、`@types/jest`

## 2. 补全 ChatService 单元测试

- [x] 2.1 在 `src/chat/chat.services.spec.ts` 中补全 computeVisibility 边界用例：未知消息类型、wingman1/wingman2 分别使用不同模式
- [x] 2.2 验证所有 computeVisibility 用例通过（目标：覆盖 SYSTEM/MAIN/PRIVATE/PENDING 四种类型 × client/wingman 角色 × SOLO/PRIVATE/ASSIST 模式）

## 3. 编写 ChatLifecycleService 单元测试

- [x] 3.1 创建 `src/chat/chat-lifecycle.service.spec.ts`
- [x] 3.2 编写状态转换单测：MATCHING→ICEBREAKING（返回 roomOpened）、ICEBREAKING→FLIRTING（返回 roomClosed）、→ENDED（返回 roomEnded）
- [x] 3.3 编写边界用例：相同状态返回 null、不存在的 relationship 抛出异常
- [x] 3.4 验证所有 lifecycle 单测通过

## 4. 编写 RoomService 单元测试

- [x] 4.1 创建 `src/chat/room.service.spec.ts`
- [x] 4.2 编写 getRoomId 纯函数测试
- [x] 4.3 验证通过

## 5. 拆分集成测试

- [x] 5.1 创建 `test/chat.four-person-flow.e2e-spec.ts`，迁移四人加入/消息交换/PRIVATE 消息不泄露/非成员拒绝用例
- [x] 5.2 创建 `test/chat.wingman-modes.e2e-spec.ts`，迁移 SOLO 代发/PRIVATE 禁止/ASSIST 草拟确认拒绝/模式切换用例
- [x] 5.3 创建 `test/chat.rest-api.e2e-spec.ts`，迁移消息历史/在线状态/权限拒绝用例
- [x] 5.4 创建 `test/chat.lifecycle.e2e-spec.ts`，迁移 MATCHING→ICEBREAKING/ICEBREAKING→FLIRTING/→ENDED 用例
- [x] 5.5 删除原 `test/chat.integration.e2e-spec.ts`

## 6. 最终验证

- [x] 6.1 运行 `npx vitest run --reporter=verbose` 确认所有单测和集成测试通过
- [x] 6.2 确认无 Jest 相关 import 或配置残留
