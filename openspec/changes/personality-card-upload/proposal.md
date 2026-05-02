## Why

当前发现页的 soul-card 光晕区域（soul-card-aura）使用基于头像颜色提取的渐变背景，所有用户卡片视觉上较为同质化。用户无法通过卡片背景表达个性。允许用户上传自定义图片作为个性卡片，能让每张 soul-card 更具辨识度和个人风格，提升发现页的视觉吸引力。

## What Changes

- 在个人中心（ProfilePage）新增「个性卡片」上传入口，用户可以上传一张图片作为自己的 soul-card 背景
- 发现页（DiscoveryPage）的 soul-card-aura 区域：如果用户已设置个性卡片，则展示其上传的图片；否则保持现有的渐变光晕效果
- 后端新增个性卡片图片上传接口和存储
- User 模型新增 `cardImage` 字段存储图片路径

## Capabilities

### New Capabilities
- `personality-card`: 用户上传自定义图片作为发现页 soul-card 背景的完整功能，包括前端上传 UI、后端存储接口、发现页展示逻辑

### Modified Capabilities

（无现有 spec 需要修改）

## Impact

- **后端**: User 模型新增字段、UserController/UserService 新增上传接口、静态文件服务需覆盖卡片图片目录
- **前端**: ProfilePage 新增上传区域、DiscoveryPage soul-card-aura 渲染逻辑变更（图片 vs 渐变降级）
- **存储**: 服务器 `/uploads/cards/` 目录存放卡片图片
- **API**: 新增 `POST /user/card-image` 端点，`GET /discovery/users` 返回数据增加 `cardImage` 字段
