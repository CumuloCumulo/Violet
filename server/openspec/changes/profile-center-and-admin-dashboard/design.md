## Context

Violet 是一个校园恋爱匹配平台，前端 React + Zustand（无 React Router，基于 store 状态路由），后端 NestJS + Prisma + PostgreSQL。已完成注册登录、画像、发现匹配、聊天室、信用签到等核心模块。

当前系统没有 ADMIN 角色枚举，没有管理员后台，用户登录后也没有个人中心页面（只有注册后一次性填写的 ProfileSetupPage）。DiscoveryPage 头部有"画像"按钮但指向 profile-setup 页面。

前端使用 glassmorphism 设计体系（`.glass` 容器、`--color-violet-main` 配色、`motion/react` 动画），Zustand 管理页面状态（`authStore.page` 类型决定渲染哪个组件）。

## Goals / Non-Goals

**Goals:**
- 用户登录后可进入个人中心查看/编辑全部资料
- 用户可在个人中心签到、查看信用分、角色状态、退出登录
- 管理员可通过后台查看系统统计、管理用户、手动调整信用分
- 信用分调整有审计日志（CreditLog）
- 管理员权限通过角色校验，非管理员无法访问后台 API 和页面

**Non-Goals:**
- 密码修改功能（后续迭代）
- 军师大厅/任务系统（不在本轮范围）
- 帖子大厅/社区树洞（不在本轮范围）
- 关系列表/互评系统（不在本轮范围）
- 复杂的数据统计图表（MVP 仅数字展示）

## Decisions

### 1. AdminGuard 继承 JwtAuthGuard + 数据库角色检查

**选择**: AdminGuard 继承 JwtAuthGuard，在 canActivate 中先完成 JWT 认证，再查询数据库检查 roles 是否包含 ADMIN。

**理由**: JWT payload 不包含角色信息（仅 sub + email），角色可能随时变更。实时查库确保最新权限状态。

**替代方案**: 在 JWT payload 中加入 roles — 会导致角色变更后需重新登录才能生效，不符合管理员可能被即时撤销权限的需求。

### 2. 个人中心与画像设置页面分开

**选择**: 新建独立的 ProfilePage，不复用 ProfileSetupPage。

**理由**: ProfileSetupPage 是注册后的引导流程（"完善你的画像" + "保存并开启邂逅"），ProfilePage 是持续使用的个人中心（"返回发现页" + "退出登录"）。导航意图和操作按钮完全不同，合并会增加条件分支复杂度。两者共享相似的编辑表单 UI 模式，但 V1 保持独立更简单。

### 3. CreditLog 审计模型

**选择**: 新建 CreditLog 表记录管理员信用分调整，包含 userId、adminId、amount、reason。

**理由**: 需求文档明确提到管理员需处理退款申诉和恶意举报，审计日志是必要追踪手段。普通签到和扣减不经过此模型（已有 CheckinRecord 和 MatchRequest 关联）。

### 4. 前端路由扩展（不引入 React Router）

**选择**: 继续使用 Zustand store 的 `page` 状态做 SPA 路由，增加 `'profile' | 'admin'` 两个值。

**理由**: 与现有架构一致，无需引入新依赖。admin 页面在 App.tsx 中额外检查 `user?.roles.includes('ADMIN')`，双重保护（前端隐藏 + 后端 AdminGuard）。

### 5. 管理员初始设置方式

**选择**: 通过 SQL 手动更新用户 roles 数组添加 ADMIN。

**理由**: 当前阶段管理员就是项目开发者本人，不需要自助注册流程。简单直接。

## Risks / Trade-offs

- **[AdminGuard 数据库查询开销]** → 每次 admin API 请求多一次数据库查询。MVP 阶段请求量极小，可接受。后续可加 Redis 缓存优化。
- **[枚举迁移风险]** → PostgreSQL ALTER TYPE ADD VALUE 是安全的，不影响现有数据。Prisma 迁移自动处理。
- **[ProfilePage 与 ProfileSetupPage 代码重复]** → 两者都有编辑表单，V1 保持独立。后续可提取共享组件。
- **[无密码修改]** → 本轮不做，用户如需重置可通过管理员后台直接修改密码 hash。

## Migration Plan

1. Prisma 迁移：添加 ADMIN 枚举值 + CreditLog 表
2. SQL 手动设置管理员用户
3. 部署后端新模块
4. 部署前端新页面
5. 无需回滚特殊策略——新页面和端点是增量添加，不影响现有功能
