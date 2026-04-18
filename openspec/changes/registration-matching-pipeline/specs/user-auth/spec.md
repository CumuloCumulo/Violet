## ADDED Requirements

### Requirement: 邮箱注册与后缀校验
系统 SHALL 允许用户使用以 `@smail.nju.edu.cn` 结尾的邮箱、昵称和密码进行注册。系统 SHALL 拒绝非南大邮箱的注册请求。系统 SHALL 拒绝已注册邮箱的重复注册。密码 SHALL 使用 bcrypt 加密后存储。

#### Scenario: 注册成功
- **WHEN** 用户提交注册请求，邮箱为 `test@smail.nju.edu.cn`，昵称为 `测试用户`，密码为 `password123`
- **THEN** 系统创建新用户记录（密码经过 bcrypt 加密），返回 JWT token 并设置为 HttpOnly cookie

#### Scenario: 非南大邮箱被拒绝
- **WHEN** 用户使用 `test@gmail.com` 邮箱注册
- **THEN** 系统返回 400 错误，提示仅支持南大 smail 邮箱

#### Scenario: 重复邮箱被拒绝
- **WHEN** 用户使用已注册的邮箱注册
- **THEN** 系统返回 409 冲突错误

### Requirement: 邮箱密码登录
系统 SHALL 允许已注册用户通过邮箱和密码登录。登录成功后，系统 SHALL 签发 JWT token 并存储在 HttpOnly cookie 中。

#### Scenario: 登录成功
- **WHEN** 用户提交正确的邮箱和密码
- **THEN** 系统返回用户信息，并设置 7 天有效期的 JWT HttpOnly cookie

#### Scenario: 密码错误
- **WHEN** 用户提交正确邮箱但错误密码
- **THEN** 系统返回 401 错误，不透露邮箱是否存在

#### Scenario: 邮箱不存在
- **WHEN** 用户提交未注册的邮箱
- **THEN** 系统返回 401 错误，提示信息与密码错误时一致

### Requirement: JWT 认证守卫
系统 SHALL 使用 JWT 守卫保护需要认证的 API 端点。守卫 SHALL 从 HttpOnly cookie 中提取并验证 JWT。

#### Scenario: 有效 token
- **WHEN** 请求携带有效的 JWT cookie
- **THEN** 守卫将解码后的用户信息附加到请求对象上，放行请求

#### Scenario: 缺失或无效 token
- **WHEN** 请求未携带 JWT cookie 或 token 已过期/无效
- **THEN** 守卫返回 401 未授权错误

### Requirement: Socket.io JWT 认证
系统 SHALL 在 Socket.io 握手阶段验证 JWT token。已有的聊天网关 SHALL 更新为使用 JWT 守卫进行认证。

#### Scenario: 携带有效 token 的 Socket 连接
- **WHEN** 客户端携带有效 JWT cookie 连接 Socket.io
- **THEN** 连接建立成功，用户身份被识别

#### Scenario: 无有效 token 的 Socket 连接
- **WHEN** 客户端未携带有效 JWT 连接 Socket.io
- **THEN** 连接被拒绝
