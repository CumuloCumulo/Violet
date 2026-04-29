## 1. 数据库与后端基础

- [x] 1.1 更新 Prisma schema：UserRole 枚举增加 ADMIN，新增 CreditLog 模型，User 模型添加 creditLogs 和 adminActions 反向关系
- [x] 1.2 运行 Prisma 迁移 (`npx prisma migrate dev --name add_admin_role_and_credit_log`)
- [x] 1.3 创建 AdminGuard (`server/src/admin/admin.guard.ts`)：继承 JwtAuthGuard，查询数据库验证 ADMIN 角色
- [x] 1.4 创建 AdminService (`server/src/admin/admin.service.ts`)：实现 getStats、listUsers、getUserDetail、adjustCredit（事务）、toggleActive
- [x] 1.5 创建 AdminController (`server/src/admin/admin.controller.ts`)：定义 GET stats、GET users、GET users/:id、POST users/:id/credit、POST users/:id/toggle-active 端点
- [x] 1.6 创建 AdminModule (`server/src/admin/admin.module.ts`) 并在 AppModule 中注册

## 2. 前端路由与状态扩展

- [x] 2.1 扩展 authStore 的 AppPage 类型，增加 `'profile' | 'admin'`
- [x] 2.2 更新 App.tsx：导入 ProfilePage 和 AdminDashboardPage，在 ProdApp 和 DevApp 中添加 page === 'profile' 和 page === 'admin' 的路由分支（admin 分支额外检查 roles）
- [x] 2.3 更新 DiscoveryPage：将头部"画像"按钮改为导航到 `'profile'` 页面，为 ADMIN 角色用户显示"管理后台"入口

## 3. 个人中心页面

- [x] 3.1 创建 ProfilePage 组件 (`client/src/pages/ProfilePage.tsx`)：双栏 glass 容器布局，左栏展示/编辑个人资料（复用 ProfileSetupPage 的 pill-group 和 minimal-input 样式），右栏展示信用分、签到按钮、角色标签、兴趣标签云
- [x] 3.2 实现资料编辑功能：复用 authStore.updateProfile 保存修改
- [x] 3.3 实现签到功能：调用 `/api/credit/checkin`，更新信用分显示
- [x] 3.4 实现导航功能：返回发现页 (`setPage('discovery')`)、退出登录 (`logout`)、管理后台入口 (仅 ADMIN)
- [x] 3.5 添加 ProfilePage 的 CSS 样式到 index.css（`.profile-center-*` 系列）

## 4. 管理员后台页面

- [x] 4.1 创建 AdminDashboardPage 组件 (`client/src/pages/AdminDashboardPage.tsx`)：Tab 式布局（概览 / 用户管理 / 用户详情）
- [x] 4.2 实现概览 Tab：调用 GET `/api/admin/stats` 展示统计卡片
- [x] 4.3 实现用户管理 Tab：调用 GET `/api/admin/users` 获取分页列表，实现搜索和活跃状态筛选
- [x] 4.4 实现用户详情视图：点击用户展示完整资料、信用分调整表单（amount + reason）、活跃状态切换按钮
- [x] 4.5 实现信用分调整：调用 POST `/api/admin/users/:id/credit`，事务完成后刷新用户数据
- [x] 4.6 添加 AdminDashboardPage 的 CSS 样式到 index.css（`.admin-*` 系列）

## 5. 初始设置与验证

- [x] 5.1 通过 SQL 将目标用户的 roles 更新为包含 ADMIN：`UPDATE "User" SET roles = roles || '{ADMIN}' WHERE email = '241250005@smail.nju.edu.cn'`
- [x] 5.2 端到端测试：管理员登录 → 个人中心查看/编辑资料 → 签到 → 进入管理后台 → 查看统计 → 搜索用户 → 调整信用分 → 验证 CreditLog 记录
- [x] 5.3 端到端测试：非管理员登录 → 确认无管理入口 → 直接调用 admin API 返回 403
