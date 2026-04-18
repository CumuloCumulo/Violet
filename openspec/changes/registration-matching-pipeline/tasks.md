## 1. 数据库 Schema 扩展

- [x] 1.1 在 User 模型新增字段：`declaration`(恋爱宣言)、`wingmanCertStatus`(军师认证状态，默认 NONE)、`wingmanCertCooldown`(认证冷却截止时间)、`wechat`、`qq`
- [x] 1.2 新增 `MatchRequest` 模型：id, fromUserId, toUserId, status(PENDING/ACCEPTED/REJECTED/EXPIRED), createdAt, updatedAt；关联 fromUser 和 toUser
- [x] 1.3 运行 prisma migrate dev 生成迁移，更新 seed 脚本适配新字段

## 2. 认证模块 (user-auth)

- [x] 2.1 创建 NestJS AuthModule，安装依赖 (bcrypt, jsonwebtoken, @nestjs/passport, passport-jwt)
- [x] 2.2 实现 AuthService：register（邮箱后缀校验 + bcrypt 加密 + 初始信用分）、login（密码验证 + JWT 签发）
- [x] 2.3 实现 AuthController：POST /api/auth/register、POST /api/auth/login，JWT 通过 HttpOnly cookie 返回
- [x] 2.4 实现 JwtStrategy (Passport)，从 HttpOnly cookie 提取并验证 token
- [x] 2.5 实现 JwtAuthGuard，保护需要认证的端点
- [x] 2.6 更新 ChatGateway 的 Socket.io 握手逻辑，从 cookie 提取 JWT 验证用户身份
- [ ] 2.7 为认证相关接口编写单元测试

## 3. 用户画像模块 (user-profile)

- [x] 3.1 创建 NestJS UserModule、UserService、UserController
- [x] 3.2 实现 GET /api/user/profile — 查看自己画像（需认证）
- [x] 3.3 实现 PATCH /api/user/profile — 编辑画像字段（昵称、头像、宣言、兴趣、校区、年级、专业）
- [x] 3.4 定义预定义兴趣标签常量列表，实现标签数量上限校验（最多 10 个）
- [x] 3.5 实现军师认证问卷逻辑：POST /api/user/wingman-certify — 道德评判 + 特点评判，信用分门槛校验，冷却期校验
- [ ] 3.6 为画像和军师认证接口编写单元测试

## 4. 信用分模块 (credit-system)

- [x] 4.1 创建 NestJS CreditModule、CreditService
- [x] 4.2 实现 POST /api/credit/checkin — 每日签到（按天去重 + 原子加分），返回新余额
- [x] 4.3 实现 GET /api/credit/balance — 查询信用分余额
- [x] 4.4 在 CreditService 中实现 deductCredit(amount) 内部方法：原子性扣费，余额不足时抛出异常
- [ ] 4.5 为签到去重和原子扣费编写单元测试

## 5. 发现与牵线模块 (user-discovery)

- [x] 5.1 创建 NestJS DiscoveryModule、DiscoveryService、DiscoveryController
- [x] 5.2 实现 GET /api/discovery/users — 分页返回活跃用户列表（7 天内登录、排除自己、匿名展示，按 lastActiveAt 降序）
- [x] 5.3 实现 POST /api/discovery/match-request — 发起牵线（调用 CreditService.deductCredit 扣费，防重复请求校验）
- [x] 5.4 实现 GET /api/discovery/match-requests/sent — 查看已发送的牵线请求（含状态和目标匿名画像）
- [x] 5.5 实现 GET /api/discovery/match-requests/received — 查看收到的待处理牵线请求（仅 PENDING 且未过期，含发送方匿名画像）
- [x] 5.6 实现 POST /api/discovery/match-request/:id/accept — 接受牵线：创建 Relationship(ICEBREAKING)，更新请求状态为 ACCEPTED
- [x] 5.7 实现 POST /api/discovery/match-request/:id/reject — 拒绝牵线：更新请求状态为 REJECTED
- [x] 5.8 在查询待处理请求时过滤 24h 过期逻辑：将 createdAt < now() - 24h 的 PENDING 请求标记为 EXPIRED
- [ ] 5.9 为牵线流程编写单元测试（发送、接受、拒绝、过期、重复请求防护）

## 6. 前端：注册与登录页面

- [x] 6.1 创建 LoginPage 组件：邮箱 + 密码输入，调用 POST /api/auth/login，成功后跳转
- [x] 6.2 创建 RegisterPage 组件：邮箱（校验 @smail.nju.edu.cn）、昵称、密码输入，调用 POST /api/auth/register
- [x] 6.3 创建 authStore (Zustand)：管理登录状态、用户信息、token 有效期判断
- [x] 6.4 配置前端路由守卫：未登录跳转登录页，已登录跳转发现页
- [x] 6.5 配置 axios/fetch 拦截器：携带 cookie，处理 401 跳转

## 7. 前端：用户画像设置页

- [x] 7.1 创建 ProfileSetupPage 组件：性别、校区、年级、专业输入，兴趣标签多选，恋爱宣言输入
- [x] 7.2 实现兴趣标签选择器 UI（预定义标签列表，点击选中/取消，上限提示）
- [x] 7.3 调用 PATCH /api/user/profile 提交画像数据

## 8. 前端：用户发现与牵线页

- [x] 8.1 创建 DiscoveryPage 组件：用户卡片列表（展示性别、校区、兴趣标签、宣言、活跃状态）
- [x] 8.2 实现分页加载（滚动加载或分页按钮）
- [x] 8.3 实现发起牵线按钮：点击扣费确认 → 调用 POST /api/discovery/match-request → 成功/失败提示
- [x] 8.4 实现已发送请求面板：查看各请求状态（等待中/已接受/已拒绝/已过期）
- [x] 8.5 实现已收到请求面板：查看待处理请求，接受/拒绝操作
- [x] 8.6 接受牵线后跳转到聊天室页面，携带新创建的 Relationship ID

## 9. 集成与清理

- [x] 9.1 更新 AppModule 注册所有新模块（AuthModule、UserModule、CreditModule、DiscoveryModule）
- [x] 9.2 确保现有 DEV 测试流程仍然可用（DevModule 不受影响）
- [x] 9.3 更新 seed 数据，包含牵线请求样本和不同画像的用户
- [ ] 9.4 端到端手动验证：注册 → 完善画像 → 浏览列表 → 发起牵线 → 接受 → 进入聊天室
