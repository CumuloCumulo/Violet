## Context

Violet 项目目前运行在本地开发环境，前端 Vite dev server (5173) + 后端 NestJS (3000)，通过 Vite proxy 转发 API 请求。需要部署到阿里云 ECS（Ubuntu 24.04, 4vCPU/8GiB）供外部访问。

当前关键代码状态：
- `client/src/stores/chatStore.ts:70` — Socket.io 硬编码连接 `http://${window.location.hostname}:3000`
- `server/src/chat/chat.gateway.ts:29-32` — CORS 白名单仅包含 localhost
- `server/src/main.ts` — 已监听 `0.0.0.0`，API 前缀 `/api`
- 无 Dockerfile、无 Nginx 配置、无生产部署流程

## Goals / Non-Goals

**Goals:**
- 通过 `http://121.43.69.144` 可访问完整应用
- API 请求（`/api/*`）和 WebSocket（`/socket.io`）由 Nginx 统一反向代理
- 前端静态文件由 Nginx 直接托管
- 后端进程由 pm2 守护，SSH 断开后持续运行
- 生产环境配置通过环境变量管理，不硬编码敏感信息

**Non-Goals:**
- HTTPS / SSL 证书（后续有域名再做）
- SMTP 邮件服务部署（功能尚未实现）
- CI/CD 自动化部署（手动 scp 部署即可）
- 容器化（方案 A 直装，不用 Docker）
- 多环境配置（staging/production）

## Decisions

### 1. Nginx 作为统一入口

**选择**: Nginx 反向代理 + 静态文件托管
**替代方案**: 直接暴露 3000 端口 + 前端由 NestJS 托管
**理由**:
- 不暴露后端端口，安全性更好
- Nginx 处理静态文件性能远优于 Node.js
- WebSocket 升级需专门配置，Nginx 原生支持
- 后续加 HTTPS 只需改 Nginx 配置

### 2. Socket.io 走 Nginx 代理而非直连

**选择**: 前端用相对路径连接 Socket.io，Nginx 代理 `/socket.io/` 到后端
**替代方案**: 前端直连 `http://IP:3000/socket.io`
**理由**:
- 不需要开放 3000 端口
- CORS 问题更少（同源）
- 统一入口管理

### 3. pm2 进程守护

**选择**: pm2 管理 NestJS 进程
**替代方案**: systemd service
**理由**:
- Node.js 生态标准工具，配置简单
- 自带日志管理、崩溃重启
- `pm2 logs` 方便查看实时日志
- 团队成员更熟悉

### 4. 代码部署方式

**选择**: 本地构建 + scp 上传 dist 和构建产物
**替代方案**: 服务器上 git clone + 服务器端构建
**理由**:
- 服务器不需要装完整开发依赖（节省磁盘）
- 构建问题在本地解决，部署更可靠
- 40G 磁盘空间有限，避免 node_modules 占用

### 5. CORS 配置策略

**选择**: 通过 `CORS_ORIGIN` 环境变量配置，生产环境设为 `http://121.43.69.144`
**替代方案**: 代码里写死 IP
**理由**: 环境与代码解耦，换域名时只改 .env

## Risks / Trade-offs

- **[安全] 服务器密码已泄露** → 部署完成后立即更改 SSH 密码
- **[可用性] 无 HTTPS** → HTTP 明文传输，课程项目阶段可接受，上线前必须加 SSL
- **[安全组] 80 端口可能未开** → 部署前必须先在阿里云控制台开放 80 端口入方向
- **[磁盘] 40G ESSD** → 系统占 ~10G，PostgreSQL + 应用约 5G，剩余 25G 充裕
- **[单点故障] 单机部署** → 任何服务挂掉都影响整体，但课程项目不需要高可用
- **[数据] 系统盘随实例释放** → 数据库数据会随实例销毁丢失，需注意备份
