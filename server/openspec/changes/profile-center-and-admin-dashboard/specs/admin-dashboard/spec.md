## ADDED Requirements

### Requirement: 管理员角色鉴权
系统 SHALL 新增 ADMIN 角色枚举值。仅 roles 包含 ADMIN 的用户可访问管理员后台 API 和页面。

#### Scenario: 管理员访问后台
- **WHEN** roles 包含 ADMIN 的用户发起 admin API 请求
- **THEN** AdminGuard 验证通过，正常返回数据

#### Scenario: 非管理员访问后台 API
- **WHEN** roles 不包含 ADMIN 的用户发起 admin API 请求
- **THEN** 系统返回 403 Forbidden

#### Scenario: 未登录访问后台 API
- **WHEN** 未携带有效 JWT 的请求访问 admin API
- **THEN** 系统返回 401 Unauthorized

### Requirement: 管理员可查看系统统计
管理员后台 SHALL 展示系统统计数据：总用户数、活跃用户数、系统总信用分、待处理牵线请求数。

#### Scenario: 查看统计
- **WHEN** 管理员进入后台概览页
- **THEN** 系统调用 GET `/api/admin/stats` 返回统计数据并展示

### Requirement: 管理员可浏览用户列表
管理员后台 SHALL 提供分页用户列表，支持按昵称/邮箱搜索和按活跃状态筛选。列表展示昵称、邮箱、角色、信用分、活跃状态。

#### Scenario: 浏览用户列表
- **WHEN** 管理员进入用户管理页
- **THEN** 系统调用 GET `/api/admin/users` 返回分页用户列表

#### Scenario: 搜索用户
- **WHEN** 管理员输入搜索关键词
- **THEN** 列表按昵称或邮箱模糊匹配过滤

#### Scenario: 按活跃状态筛选
- **WHEN** 管理员选择活跃/非活跃筛选
- **THEN** 列表仅展示对应状态的用户

### Requirement: 管理员可查看用户详情
管理员 SHALL 能查看单个用户的完整资料，包含信用分和基本信息。

#### Scenario: 查看用户详情
- **WHEN** 管理员在用户列表中点击某用户
- **THEN** 系统调用 GET `/api/admin/users/:id` 展示用户完整资料

### Requirement: 管理员可调整用户信用分
管理员 SHALL 能对任意用户进行信用分增减操作，必须填写调整原因。每次调整 SHALL 记录到 CreditLog 审计表。

#### Scenario: 增加信用分
- **WHEN** 管理员提交正数 amount 和 reason
- **THEN** 系统在事务中增加用户信用分并创建 CreditLog 记录，返回调整后的信用分

#### Scenario: 扣减信用分
- **WHEN** 管理员提交负数 amount 和 reason
- **THEN** 系统在事务中扣减用户信用分并创建 CreditLog 记录（允许扣至负数），返回调整后的信用分

#### Scenario: 缺少原因
- **WHEN** 管理员提交调整但未填写 reason
- **THEN** 系统返回 400 错误

### Requirement: 管理员可切换用户活跃状态
管理员 SHALL 能启用或禁用用户的活跃状态（isActive 字段）。

#### Scenario: 禁用用户
- **WHEN** 管理员对一个活跃用户点击禁用
- **THEN** 系统将该用户的 isActive 设为 false

#### Scenario: 启用用户
- **WHEN** 管理员对一个已禁用用户点击启用
- **THEN** 系统将该用户的 isActive 设为 true

### Requirement: 信用分调整审计日志
系统 SHALL 在 CreditLog 表中记录每次管理员信用分调整，包含被调整用户 ID、管理员 ID、调整金额、调整原因、时间戳。

#### Scenario: 审计记录完整性
- **WHEN** 管理员完成一次信用分调整
- **THEN** CreditLog 表中新增一条记录，包含 userId、adminId、amount、reason、createdAt

### Requirement: 管理员后台页面入口保护
前端管理员后台页面入口 SHALL 仅对 roles 包含 ADMIN 的用户可见。非管理员用户看不到入口按钮。

#### Scenario: 管理员看到入口
- **WHEN** roles 包含 ADMIN 的用户在 DiscoveryPage 或 ProfilePage
- **THEN** 页面显示"管理后台"入口按钮

#### Scenario: 非管理员不看到入口
- **WHEN** roles 不包含 ADMIN 的用户浏览页面
- **THEN** 不显示任何管理员相关入口

### Requirement: 管理员可返回个人中心
管理员后台 SHALL 提供返回个人中心的导航入口。

#### Scenario: 返回个人中心
- **WHEN** 管理员点击返回按钮
- **THEN** 系统导航到 ProfilePage
