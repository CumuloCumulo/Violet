## ADDED Requirements

### Requirement: 用户可以上传个性卡片图片
系统 SHALL 允许已登录用户在个人中心上传一张图片作为个性卡片。上传接口为 `POST /user/card-image`，接受 multipart/form-data 格式的 `cardImage` 字段。

#### Scenario: 成功上传个性卡片
- **WHEN** 用户通过个人中心上传一张有效图片（JPG/PNG/WEBP，≤5MB）
- **THEN** 系统保存图片到 `/uploads/cards/`，更新 User 记录的 `cardImage` 字段，返回更新后的用户信息

#### Scenario: 上传文件过大
- **WHEN** 用户上传超过 5MB 的图片
- **THEN** 系统返回 400 错误，提示文件大小超限

#### Scenario: 上传非图片文件
- **WHEN** 用户上传非图片格式的文件
- **THEN** 系统返回 400 错误，提示仅支持图片格式

### Requirement: 用户可以删除个性卡片
系统 SHALL 允许用户通过 `DELETE /user/card-image` 接口删除已设置的个性卡片。

#### Scenario: 成功删除个性卡片
- **WHEN** 用户请求删除个性卡片
- **THEN** 系统删除服务器上的图片文件，将 User 的 `cardImage` 设为 null，返回更新后的用户信息

#### Scenario: 删除不存在的卡片
- **WHEN** 用户未设置个性卡片时请求删除
- **THEN** 系统返回成功，不做额外操作

### Requirement: 发现页展示个性卡片图片
发现页的 soul-card-aura 区域 SHALL 优先展示用户的个性卡片图片。当用户未设置个性卡片时，SHALL 降级展示现有的渐变光晕效果。

#### Scenario: 用户已设置个性卡片
- **WHEN** 发现页加载一个已设置 cardImage 的用户卡片
- **THEN** soul-card-aura-bg 的背景设为该图片（`background-image: url(...)`），使用 `background-size: cover` 填充，保留 glass 遮罩层

#### Scenario: 用户未设置个性卡片
- **WHEN** 发现页加载一个未设置 cardImage 的用户卡片
- **THEN** soul-card-aura 保持现有的渐变背景行为不变

### Requirement: 发现页 API 返回 cardImage 字段
`GET /discovery/users` 接口 SHALL 在返回的用户数据中包含 `cardImage` 字段。

#### Scenario: 列表接口包含 cardImage
- **WHEN** 客户端请求发现页用户列表
- **THEN** 每个用户对象包含 `cardImage` 字段（可为 null）

### Requirement: 个人中心展示个性卡片上传区域
个人中心页面 SHALL 展示个性卡片的上传入口，显示当前卡片预览（如已设置），并提供删除功能。

#### Scenario: 已设置卡片时的展示
- **WHEN** 用户进入个人中心且已设置个性卡片
- **THEN** 页面显示当前卡片图片预览，并提供「更换」和「删除」操作

#### Scenario: 未设置卡片时的展示
- **WHEN** 用户进入个人中心且未设置个性卡片
- **THEN** 页面显示上传提示区域，引导用户上传
