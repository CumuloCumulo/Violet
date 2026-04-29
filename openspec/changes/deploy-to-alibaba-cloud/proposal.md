## Why

Violet 项目已具备核心功能（注册、发现、聊天室），需要部署到阿里云 ECS 服务器进行线上测试和演示。这是课程项目（软件工程与计算II）向可访问产品转化的关键一步。

## What Changes

- 修改前端 Socket.io 连接方式：从硬编码 `hostname:3000` 改为相对路径，由 Nginx 统一代理 WebSocket
- 修改后端 CORS 配置：WebSocket Gateway 的 CORS 白名单支持通过环境变量配置服务器 IP
- 新增 Nginx 反向代理配置：统一处理前端静态文件、API 代理和 WebSocket 升级
- 新增服务器环境搭建流程：PostgreSQL、Redis、Node.js、pm2 的安装与配置
- 新增后端生产环境 .env 配置（DATABASE_URL、JWT_SECRET、REDIS_HOST、CORS_ORIGIN）
- 前端生产构建（`pnpm build`）并部署 dist 到服务器

## Capabilities

### New Capabilities
- `server-setup`: 服务器基础环境搭建（Node.js、PostgreSQL、Redis、Nginx、pm2）
- `nginx-proxy`: Nginx 反向代理配置（静态文件、API、WebSocket）
- `production-config`: 生产环境配置管理（.env、CORS、构建产物部署）

### Modified Capabilities
<!-- 无现有 spec 需要修改 -->

## Impact

- **前端代码**: `client/src/stores/chatStore.ts` — Socket.io 连接地址逻辑
- **后端代码**: `server/src/chat/chat.gateway.ts` — CORS 配置支持环境变量
- **服务器**: 阿里云 ECS (121.43.69.144, Ubuntu 24.04, 4vCPU/8GiB/40GiB ESSD)
- **阿里云安全组**: 需开放 80 端口入方向
- **新增文件**: Nginx 站点配置、pm2 生态配置
- **依赖**: 服务器需安装 Node.js >= 18、PostgreSQL >= 15、Redis >= 7、Nginx、pm2
