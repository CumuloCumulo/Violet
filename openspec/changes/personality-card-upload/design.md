## Context

Violet 发现页使用 soul-card 组件展示用户卡片。当前 soul-card-aura 区域通过 ColorThief 从用户头像提取颜色生成渐变背景，如果无头像则使用基于用户 ID 的 fallback 渐变。所有卡片的视觉风格统一但缺乏个性化。

用户数据存储在 PostgreSQL（Prisma ORM），头像文件存储在服务器 `/uploads/avatars/`，通过 Express 静态文件服务访问。前端使用 React + Vite，发现页有 GSAP 动画驱动的水平滚动画廊。

## Goals / Non-Goals

**Goals:**
- 用户可在个人中心上传一张图片作为发现页 soul-card 的背景
- 发现页优先展示个性卡片图片，无卡片时降级为现有渐变效果
- 上传流程与现有头像上传保持一致的体验

**Non-Goals:**
- 不支持多张卡片轮播（仅一张）
- 不做图片裁剪/编辑功能
- 不改变 soul-card 的布局结构（content、tags、quote 区域保持不变）

## Decisions

### 1. 存储方案：本地文件系统（与头像一致）

**选择**: 复用现有 Express 静态文件方案，卡片图片存放在 `/uploads/cards/`。

**理由**: 头像已使用此方案，保持一致。项目规模小，无需引入 OSS。

**替代方案**: 阿里云 OSS — 增加外部依赖和成本，当前阶段不需要。

### 2. 数据模型：User 表新增 cardImage 字段

**选择**: 在 User 模型新增 `cardImage String?` 可选字段，存储相对路径。

**理由**: 与 `avatar` 字段模式一致，简单直接。null 表示未设置个性卡片。

### 3. 前端展示：图片作为 soul-card-aura 背景

**选择**: 当用户有 cardImage 时，将 soul-card-aura-bg 的 background 从渐变改为 `url(cardImage)` 并设置 `background-size: cover`。保持 clip-path 和 glass 遮罩层不变。

**理由**: 最小化 DOM 结构变更，仅切换背景内容。glass 遮罩层提供统一的半透明质感，让图片和渐变风格协调。

### 4. 图片约束

- 格式：JPG / PNG / WEBP
- 大小上限：5MB（比头像略大，卡片图片需要更高清）
- 尺寸建议：不强制，由 `background-size: cover` 自适应裁剪

## Risks / Trade-offs

- **[大图加载慢]** → 上传时前端可做压缩，服务端返回 URL 后浏览器缓存；后续可加 CDN
- **[不当图片内容]** → 当前阶段无审核机制，与头像一致；后续可接入审核
- **[磁盘空间]** → 单张图片 + 头像，用户量小，风险极低
