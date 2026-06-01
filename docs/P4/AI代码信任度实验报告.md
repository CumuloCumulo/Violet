# AI 代码信任度实验报告 — Phase 4

> Violet 校园恋爱辅助平台 — 实验一

---

**实验日期：** 2026-06-01 | **实验者：** 庄永琪、靳滨硕

---

## 一、实验设计

### 实验功能点：通知服务（NotificationService）

选择理由：通知服务是跨模块的基础设施，涉及数据库操作、事件解耦、分页逻辑和权限校验，规模适中，能充分暴露 AI 生成代码的潜在问题。

### Prompt 摘要

```
请为以下 NotificationService 编写完整的单元测试。

NotificationService 依赖 PrismaService 和 EventEmitter2，
包含以下方法：createNotification、getNotifications（游标分页）、
getUnreadCount、markAsRead（权限校验）、markAllAsRead。

要求覆盖：正常路径、边界条件（空游标、游标不存在）、
权限校验（非本人不能标记已读）、分页 hasMore 逻辑。
```

---

## 二、AI 直出结果

### 生成代码摘要

AI 一次性生成了完整的 `notification.service.spec.ts`，包含 9 个测试用例：

| # | 测试用例 | 覆盖场景 |
|---|---------|---------|
| 1 | createNotification → should create and emit event | 通知创建 + 事件发布 |
| 2 | createNotification → with content and data | 携带内容和数据的创建 |
| 3 | getNotifications → without cursor | 无游标查询 |
| 4 | getNotifications → with hasMore pagination | 分页 hasMore 边界 |
| 5 | getNotifications → use cursor | 游标分页查询 |
| 6 | getNotifications → cursor not found fallback | 游标不存在降级 |
| 7 | getUnreadCount | 未读计数 |
| 8 | markAsRead → non-existent | 通知不存在 |
| 9 | markAsRead → wrong user | 权限校验 |
| 10 | markAsRead → success | 正常标记已读 |
| 11 | markAllAsRead | 全部标记已读 |

### 运行结果

| 指标 | 结果 |
|------|------|
| 编译是否通过 | ✅ 通过 |
| 测试是否全部通过 | ✅ 通过（9/9） |
| 覆盖的方法 | 5/5（100%） |

---

## 三、人工检查

### 检查要点

1. **是否符合 P3 详细设计** — 通知创建流程与 P3 设计文档一致：先写数据库，再通过 EventEmitter 解耦推送
2. **边界条件是否覆盖** — 游标分页的 `hasMore` 逻辑（取 limit+1 条再截断）正确
3. **权限校验是否到位** — `markAsRead` 正确检查了通知归属用户

### 发现的问题

| # | 问题描述 | 严重程度 | 修复方式 |
|---|---------|---------|---------|
| 1 | `createNotification` 第二个测试用例的断言方式不够直接，通过 `expect.objectContaining` 间接验证了 data 传递 | 低 | 可接受，保持原样 |
| 2 | 未测试 `getNotifications` 的 `where` 条件是否正确过滤了 userId | 低 | 已补充观察，mock 验证隐含覆盖 |

### 整体评价

AI 生成的通知服务测试代码**质量较高**，无需修改即可通过全部测试。Mock 结构清晰、断言准确、边界条件覆盖全面。唯一不足是对 Prisma 调用参数的验证不够细致，但这属于风格偏好而非功能缺陷。

---

## 四、对比总结

| 指标 | AI 直出 | 人工审查修复后 |
|------|--------|-------------|
| 编译是否通过 | ✅ | ✅ |
| 测试是否通过 | ✅ (11/11) | ✅ (11/11) |
| 人工修改幅度 | — | 0%（无修改） |
| 主要发现 | 1 个低级风格问题 | 无功能性问题 |

**结论：** 对于结构清晰、职责单一的服务类代码，AI 生成测试用例的可靠性很高。NotificationService 的测试代码可以直接使用，无需人工修复。但当服务依赖复杂的外部模块（如 bcrypt ESM 导入、Redis 连接）时，AI 生成的 mock 策略可能出现兼容性问题（见 auth.service 的 bcrypt mock 问题）。
