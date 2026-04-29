## Why

当前系统已完成注册登录、画像设置、发现匹配、聊天室、信用签到等核心模块，但缺少两个关键页面：登录后的个人中心（用户无法查看/编辑自己的资料和状态）和管理员后台（无法进行用户管理和信用分人工调整）。需求文档 `docs/P1/requirement_by_human.md` 第二、三、十章明确要求这两种功能。

## What Changes

- 新增 **个人中心页面** (`ProfilePage`)：用户登录后可查看和编辑个人资料（昵称、性别、校区、年级、专业、兴趣标签、恋爱宣言）、查看信用分和签到状态、查看角色和军师认证状态、退出登录
- 新增 **管理员后台页面** (`AdminDashboardPage`)：仅 ADMIN 角色可访问，包含系统统计概览、用户列表搜索与管理、信用分人工调整（含审计日志）、用户活跃状态切换
- 新增 **Admin 模块**（后端）：AdminGuard 鉴权、用户列表/详情/信用分调整/活跃切换 API
- 数据库增加 `ADMIN` 角色枚举值和 `CreditLog` 审计模型
- 扩展前端路由，增加 `profile` 和 `admin` 两个页面状态
- DiscoveryPage 导航入口调整：头部按钮指向个人中心

## Capabilities

### New Capabilities
- `user-profile-center`: 用户个人中心 — 查看编辑资料、信用分展示与签到、角色状态、退出登录
- `admin-dashboard`: 管理员后台 — 系统统计、用户列表管理、信用分调整审计、活跃状态控制

### Modified Capabilities
<!-- 无现有 spec 需要修改 -->

## Impact

- **数据库**: Prisma schema 增加 `ADMIN` 枚举值、新增 `CreditLog` 模型及 User 反向关系，需要迁移
- **后端 API**: 新增 `/api/admin/*` 系列端点（需 AdminGuard 保护），复用现有 `/api/user/profile`、`/api/credit/*` 端点
- **前端路由**: `authStore.page` 类型扩展，`App.tsx` 增加路由分支，`DiscoveryPage` 导航入口更新
- **前端页面**: 两个新页面组件，复用现有 glassmorphism 样式体系
- **初始管理员**: 需通过 SQL 手动为特定用户添加 ADMIN 角色
