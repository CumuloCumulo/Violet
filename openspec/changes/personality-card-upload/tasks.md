## 1. 数据库与后端模型

- [x] 1.1 在 Prisma schema User 模型中新增 `cardImage String?` 字段，运行 `prisma migrate dev` 生成迁移
- [x] 1.2 确保服务器 `/uploads/cards/` 目录在 main.ts 静态文件服务中注册

## 2. 后端接口

- [x] 2.1 UserService 新增 `updateCardImage(userId, cardImagePath)` 方法：删除旧文件，更新 cardImage 字段
- [x] 2.2 UserService 新增 `deleteCardImage(userId)` 方法：删除文件，将 cardImage 设为 null
- [x] 2.3 UserController 新增 `POST /user/card-image` 端点：Multer 上传，限制 5MB，校验图片格式
- [x] 2.4 UserController 新增 `DELETE /user/card-image` 端点
- [x] 2.5 DiscoveryService `listUsers` 的 select 中加入 `cardImage` 字段

## 3. 前端 — 个人中心上传 UI

- [x] 3.1 ProfilePage 新增「个性卡片」上传区域：含预览、上传按钮、删除按钮
- [x] 3.2 对接 `POST /user/card-image` 和 `DELETE /user/card-image` API

## 4. 前端 — 发现页展示

- [x] 4.1 DiscoveryPage soul-card-aura-bg 渲染逻辑：有 cardImage 时用图片背景，否则保持渐变
- [x] 4.2 确保图片模式下 soul-card-aura-glass 遮罩层正常显示

## 5. 测试与验证

- [x] 5.1 本地验证：上传卡片 → 发现页展示图片；删除卡片 → 降级为渐变
- [x] 5.2 部署到服务器，运行 prisma migrate deploy，重启后端
